'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { getThreads, getMessages, sendMessage, createMessageThread } from '@/app/actions/messages'
import { getPatients } from '@/app/actions/patients'
import { uploadMemoryFile } from '@/app/actions/memories'
import { useUser } from '@/lib/hooks/useUser'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Play, Square, Mic, Send, MessageSquare, ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Patient, Message, MessageThread } from '@/types'

export default function MessagesPage() {
  const { profile, isStaff } = useUser()
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Modale Nuovo Canale (solo Staff)
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [threadTitle, setThreadTitle] = useState('')

  // Messaggio in invio
  const [textInput, setTextInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [audioBase64, setAudioBase64] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)

  // Registratore Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStartTimeRef = useRef<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchThreadsList = useCallback(async () => {
    setLoadingThreads(true)
    const res = await getThreads()
    if (res.data) {
      setThreads(res.data)
      if (res.data.length > 0 && !activeThreadId) {
        setActiveThreadId(res.data[0].id)
      }
    }
    setLoadingThreads(false)
  }, [activeThreadId])

  const fetchMessagesList = useCallback(async (tId: string) => {
    setLoadingMessages(true)
    const res = await getMessages(tId)
    if (res.data) setMessages(res.data)
    setLoadingMessages(false)
  }, [])

  useEffect(() => {
    if (profile) {
      const timer = setTimeout(() => {
        fetchThreadsList()
        if (isStaff()) {
          getPatients().then(res => {
            if (res.data) setPatients(res.data)
          })
        }
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [profile, fetchThreadsList, isStaff])

  // Carica i messaggi all'attivazione del thread
  useEffect(() => {
    if (activeThreadId) {
      const timer = setTimeout(() => {
        fetchMessagesList(activeThreadId)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [activeThreadId, fetchMessagesList])

  // Scroll automatico in fondo alla chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Sottoscrizione Realtime ai messaggi
  useEffect(() => {
    if (!activeThreadId) return
    const supabase = createClient()
    const channel = supabase
      .channel('realtime-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${activeThreadId}` },
        () => {
          fetchMessagesList(activeThreadId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeThreadId])

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

        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          setAudioBase64(reader.result as string)
        }

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

  const handleSend = async () => {
    if (!activeThreadId) return
    if (!textInput && !audioBase64) return

    try {
      let mediaUrl = ''

      if (audioBase64) {
        const name = `${activeThreadId}/${Date.now()}_voice.webm`
        const res = await uploadMemoryFile(audioBase64, name, 'audio/webm')
        if (res.error) throw new Error(res.error)
        mediaUrl = res.publicUrl || ''
      }

      const type = audioBase64 ? 'audio' : 'text'

      const res = await sendMessage({
        thread_id: activeThreadId,
        type,
        content: textInput || undefined,
        media_url: mediaUrl || undefined,
        duration_sec: audioBase64 ? audioDuration : undefined
      })

      if (res.error) {
        toast.error('Errore invio: ' + res.error)
      } else {
        setTextInput('')
        setAudioBase64(null)
        fetchMessagesList(activeThreadId)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      toast.error(msg)
    }
  }

  const handleCreateThreadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatientId || !threadTitle) {
      toast.error('Tutti i campi sono obbligatori')
      return
    }

    const res = await createMessageThread(selectedPatientId, threadTitle)
    if (res.error) {
      toast.error('Errore creazione canale: ' + res.error)
    } else {
      toast.success('Canale chat creato con successo!')
      setIsNewThreadOpen(false)
      setSelectedPatientId('')
      setThreadTitle('')
      fetchThreadsList()
    }
  }

  const activeThread = threads.find(t => t.id === activeThreadId)

  return (
    <div className="h-[80vh] flex gap-4">
      {/* Colonna Sinistra: Lista Canali */}
      <Card className={`w-full md:w-80 shrink-0 border border-border shadow-sm flex flex-col ${activeThreadId && 'hidden md:flex'}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Canali Chat
          </h3>
          {isStaff() && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => setIsNewThreadOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {loadingThreads ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            </div>
          ) : threads.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">Nessun canale attivo.</p>
          ) : (
            threads.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`p-4 cursor-pointer select-none transition-colors hover:bg-muted/50 ${activeThreadId === t.id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-foreground truncate">{t.title || 'Canale'}</h4>
                </div>
                {t.patient && (
                  <p className="text-[11px] text-muted-foreground mt-1">Paziente: {t.patient.full_name}</p>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Colonna Destra: Chat View */}
      <Card className={`flex-1 border border-border shadow-sm flex flex-col ${!activeThreadId && 'hidden md:flex'}`}>
        {activeThreadId ? (
          <>
            {/* Header chat */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Button size="icon" variant="ghost" className="h-8 w-8 md:hidden text-primary shrink-0" onClick={() => setActiveThreadId(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-foreground truncate">{activeThread?.title}</h4>
                {activeThread?.patient && (
                  <p className="text-[10px] text-muted-foreground truncate">Canale clinico di {activeThread.patient.full_name}</p>
                )}
              </div>
            </div>

            {/* Lista messaggi */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
              {loadingMessages ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">Nessun messaggio inviato in questa chat. Scrivi il primo messaggio!</p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === profile?.id
                  const isAudio = msg.type === 'audio'

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card border border-border text-foreground rounded-tl-none'
                      }`}>
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className={`text-[10px] font-bold ${isMe ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>
                            {msg.sender_profile?.full_name}
                          </span>
                        </div>
                        {msg.content && <p className="mt-1 leading-relaxed whitespace-pre-line">{msg.content}</p>}

                        {/* Player Audio */}
                        {isAudio && msg.media_url && (
                          <div className={`flex items-center gap-2 p-2 rounded-xl mt-1.5 ${isMe ? 'bg-primary-foreground/10' : 'bg-muted/50 border border-border'}`}>
                            <Button
                              size="icon"
                              variant={isMe ? 'secondary' : 'default'}
                              className="h-7 w-7 shrink-0"
                              onClick={() => {
                                const audio = new Audio(msg.media_url)
                                audio.play()
                              }}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <div className="text-[10px]">
                              <span className="font-bold block">Vocale</span>
                              <span>Durata: {msg.duration_sec || '--'}s</span>
                            </div>
                          </div>
                        )}

                        <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground/75'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-border bg-card flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className={`text-muted-foreground hover:text-primary ${isRecording ? 'text-danger animate-pulse bg-danger/10' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <Square className="h-5 w-5 fill-danger" /> : <Mic className="h-5 w-5" />}
              </Button>

              {audioBase64 ? (
                <div className="flex-1 bg-muted/40 border border-border px-3 py-1.5 rounded-xl text-xs flex items-center justify-between text-muted-foreground">
                  <span>Nota vocale registrata ({audioDuration}s)</span>
                  <Button variant="ghost" size="xs" onClick={() => setAudioBase64(null)} className="text-danger h-6 font-bold">Annulla</Button>
                </div>
              ) : (
                <Input
                  placeholder="Scrivi un messaggio..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="rounded-xl h-10 flex-1"
                />
              )}

              <Button size="icon" onClick={handleSend} disabled={!textInput && !audioBase64} className="h-10 w-10">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold">Seleziona un canale dalla lista per iniziare a chattare.</p>
          </div>
        )}
      </Card>

      {/* Modale Nuovo Thread (Solo Clinico/Staff) */}
      <Dialog open={isNewThreadOpen} onOpenChange={setIsNewThreadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea Nuovo Canale Chat</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateThreadSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="thread-patient">Paziente Associato</Label>
              <select
                id="thread-patient"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
              >
                <option value="">Seleziona Paziente</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thread-title">Titolo Canale</Label>
              <Input
                id="thread-title"
                placeholder="Es: Comunicazione Famiglia Rossi"
                value={threadTitle}
                onChange={(e) => setThreadTitle(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewThreadOpen(false)}>Annulla</Button>
              <Button type="submit">Crea Canale</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
