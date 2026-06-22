'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { usePatient } from '@/lib/hooks/usePatient'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabSwitcher } from '@/components/patients/PatientTabSwitcher'
import { getMemories, createMemory, toggleReaction, uploadMemoryFile } from '@/app/actions/memories'
import { useUser } from '@/lib/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Image, Mic, Play, Square, Heart, Paperclip, Check, Trash2, Smile } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Memory } from '@/types'

export default function PatientMemoriesPage() {
  const { id } = useParams()
  const { currentPatient, loading: patientLoading } = usePatient(id as string)
  const { profile } = useUser()

  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)

  // Creazione ricordo
  const [textInput, setTextInput] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBase64, setAudioBase64] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStartTimeRef = useRef<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMemoriesList = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const res = await getMemories(id as string)
    if (res.data) setMemories(res.data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMemoriesList()
    }, 0)

    // Realtime update subscription
    const supabase = createClient()
    const channel = supabase
      .channel('realtime-memories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories', filter: `patient_id=eq.${id}` },
        () => {
          fetchMemoriesList()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memory_reactions' },
        () => {
          fetchMemoriesList()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      clearTimeout(timer)
    }
  }, [id, fetchMemoriesList])

  // Gestione registrazione audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      recordingStartTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const duration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000)
        setAudioDuration(duration)

        // Converti in base64
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          const base64data = reader.result as string
          setAudioBase64(base64data)
          setAudioUrl(URL.createObjectURL(audioBlob))
        }

        // Rilascia stream
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      toast.error('Impossibile accedere al microfono: ' + msg)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendMemory = async () => {
    if (!textInput && !selectedImage && !audioBase64) {
      toast.error('Aggiungi un testo, un\'immagine o un audio prima di inviare')
      return
    }

    try {
      let mediaUrl = ''

      // Se c'è un'immagine, carica su storage
      if (selectedImage && imageFile) {
        const name = `${id}/${Date.now()}_${imageFile.name}`
        const res = await uploadMemoryFile(selectedImage, name, imageFile.type)
        if (res.error) throw new Error(res.error)
        mediaUrl = res.publicUrl || ''
      }

      // Se c'è un audio, carica su storage
      if (audioBase64) {
        const name = `${id}/${Date.now()}_voice.webm`
        const res = await uploadMemoryFile(audioBase64, name, 'audio/webm')
        if (res.error) throw new Error(res.error)
        mediaUrl = res.publicUrl || ''
      }

      const type = audioBase64 ? 'audio' : selectedImage ? 'photo' : 'text'

      const res = await createMemory({
        patient_id: id as string,
        type,
        content: textInput || undefined,
        media_url: mediaUrl || undefined,
        duration_sec: audioBase64 ? audioDuration : undefined
      })

      if (res.error) {
        toast.error('Errore durante la creazione: ' + res.error)
      } else {
        toast.success('Ricordo condiviso!')
        // Reset
        setTextInput('')
        setSelectedImage(null)
        setImageFile(null)
        setAudioBase64(null)
        setAudioUrl(null)
        fetchMemoriesList()
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      toast.error(msg)
    }
  }

  const handleReact = async (memoryId: string, emoji = '❤️') => {
    const res = await toggleReaction(memoryId, emoji)
    if (!res.success) {
      toast.error('Errore reazione: ' + res.error)
    }
  }

  if (patientLoading || !currentPatient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PatientHeader patient={currentPatient} />
      <PatientTabSwitcher patientId={currentPatient.id} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna Sinistra: Aggiungi un ricordo */}
        <div className="space-y-6">
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Condividi un Ricordo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Scrivi un pensiero o descrivi questo momento..."
                  rows={4}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>

              {/* Anteprima Immagine Selezionata */}
              {selectedImage && (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={selectedImage} alt="Anteprima" className="w-full h-40 object-cover" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => {
                      setSelectedImage(null)
                      setImageFile(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Anteprima Audio Registrato */}
              {audioUrl && (
                <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border">
                  <Play className="h-4 w-4 text-primary shrink-0" onClick={() => {
                    const audio = new Audio(audioUrl)
                    audio.play()
                  }} />
                  <span className="text-xs text-muted-foreground flex-1">Registrazione vocale ({audioDuration}s)</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-danger"
                    onClick={() => {
                      setAudioUrl(null)
                      setAudioBase64(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Tool addizionali per allegati */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`text-muted-foreground hover:text-primary ${isRecording ? 'text-danger animate-pulse bg-danger/10' : ''}`}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? <Square className="h-5 w-5 fill-danger" /> : <Mic className="h-5 w-5" />}
                  </Button>
                </div>
                <Button size="sm" onClick={handleSendMemory}>
                  Condividi
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonna Destra: Wall Ricordi */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-xl text-muted-foreground text-sm">
              Nessun ricordo condiviso su questa bacheca. Aggiungi il primo!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {memories.map((mem) => {
                const userReaction = mem.reactions?.find((r) => r.user_id === profile?.id)
                const isPhoto = mem.type === 'photo'
                const isAudio = mem.type === 'audio'

                return (
                  <Card key={mem.id} className="border border-border shadow-sm flex flex-col justify-between overflow-hidden bg-card hover:shadow-md transition-shadow">
                    <div>
                      {/* Polaroid style image container */}
                      {isPhoto && mem.media_url && (
                        <div className="aspect-[4/3] w-full bg-muted overflow-hidden border-b border-border">
                          <img
                            src={mem.media_url}
                            alt="Ricordo"
                            className="w-full h-full object-cover select-none"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                            {mem.author_profile?.role || 'Utente'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(mem.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {mem.content && (
                          <p className="text-sm font-semibold text-foreground leading-relaxed whitespace-pre-line">
                            {mem.content}
                          </p>
                        )}

                        {/* Player Audio per memo vocali */}
                        {isAudio && mem.media_url && (
                          <div className="bg-muted/40 p-3 rounded-xl border border-border flex items-center gap-3">
                            <Button
                              size="icon"
                              variant="default"
                              className="h-8 w-8 shrink-0"
                              onClick={() => {
                                const audio = new Audio(mem.media_url)
                                audio.play()
                              }}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold block text-foreground truncate">Memo vocale</span>
                              <span className="text-[10px] text-muted-foreground">Durata: {mem.duration_sec || '--'}s</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </div>

                    <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Scritto da <strong>{mem.author_profile?.full_name}</strong>
                      </span>
                      <Button
                        size="sm"
                        variant={userReaction ? 'secondary' : 'ghost'}
                        onClick={() => handleReact(mem.id)}
                        className={`h-8 gap-1.5 ${userReaction ? 'text-danger font-bold bg-danger/10 border-danger/10 hover:bg-danger/20' : 'text-muted-foreground hover:text-danger'}`}
                      >
                        <Heart className={`h-4 w-4 ${userReaction ? 'fill-danger text-danger' : ''}`} />
                        <span>{mem.reactions?.length || 0}</span>
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
