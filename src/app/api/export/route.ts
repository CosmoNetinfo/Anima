import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import React, { createElement } from 'react'
import { Document, Page, Text, View, StyleSheet, renderToStream } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
    color: '#333333'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 10
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3a8a'
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e3a8a',
    backgroundColor: '#f3f4f6',
    padding: 4,
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6
  },
  label: {
    width: 150,
    fontWeight: 'bold',
    color: '#4b5563'
  },
  value: {
    flex: 1
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
    marginBottom: 6,
    fontWeight: 'bold',
    color: '#4b5563'
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6'
  },
  col1: { width: '40%' },
  col2: { width: '25%' },
  col3: { width: '35%' }
})

// Riconverte il layout PDF usando React.createElement per rimanere in un file .ts standard
function createPatientPdf({ patient, meds, vitals, notes }: any) {
  return createElement(Document, {},
    createElement(Page, { size: 'A4', style: styles.page },
      // Header
      createElement(View, { style: styles.header },
        createElement(Text, { style: styles.title }, 'ANIMA — FASCICOLO CLINICO'),
        createElement(Text, { style: styles.subtitle }, `Generato automaticamente in data: ${new Date().toLocaleDateString('it-IT')}`)
      ),

      // Anagrafica
      createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "1. Dati Anagrafici dell'Ospite"),
        createElement(View, { style: styles.row },
          createElement(Text, { style: styles.label }, 'Nome Completo:'),
          createElement(Text, { style: styles.value }, patient.full_name)
        ),
        createElement(View, { style: styles.row },
          createElement(Text, { style: styles.label }, 'Codice Fiscale:'),
          createElement(Text, { style: styles.value }, patient.fiscal_code || 'N/A')
        ),
        createElement(View, { style: styles.row },
          createElement(Text, { style: styles.label }, 'Data di Nascita:'),
          createElement(Text, { style: styles.value }, new Date(patient.birth_date).toLocaleDateString('it-IT'))
        ),
        createElement(View, { style: styles.row },
          createElement(Text, { style: styles.label }, 'Reparto / Stanza:'),
          createElement(Text, { style: styles.value }, `${patient.ward || 'N/A'} • Stanza ${patient.room_number || 'N/A'}`)
        ),
        createElement(View, { style: styles.row },
          createElement(Text, { style: styles.label }, 'Data Ingresso:'),
          createElement(Text, { style: styles.value }, patient.admission_date ? new Date(patient.admission_date).toLocaleDateString('it-IT') : 'N/A')
        )
      ),

      // Farmaci prescitti
      createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, '2. Terapie Farmacologiche Attive'),
        meds.length === 0
          ? createElement(Text, {}, 'Nessun farmaco attivo prescritto.')
          : createElement(View, {},
              createElement(View, { style: styles.tableHeader },
                createElement(Text, { style: styles.col1 }, 'Nome Farmaco'),
                createElement(Text, { style: styles.col2 }, 'Dosaggio'),
                createElement(Text, { style: styles.col3 }, 'Orari / Frequenza')
              ),
              meds.map((med: any) =>
                createElement(View, { key: med.id, style: styles.tableRow },
                  createElement(Text, { style: styles.col1 }, `${med.name} ${med.active_principle ? `(${med.active_principle})` : ''}`),
                  createElement(Text, { style: styles.col2 }, med.dosage),
                  createElement(Text, { style: styles.col3 }, med.schedule?.times?.join(', '))
                )
              )
            )
      ),

      // Parametri Vitali Recenti
      createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, '3. Ultimi Parametri Vitali'),
        vitals.length === 0
          ? createElement(Text, {}, 'Nessun parametro registrato recentemente.')
          : createElement(View, {},
              createElement(View, { style: styles.tableHeader },
                createElement(Text, { style: styles.col1 }, 'Parametro'),
                createElement(Text, { style: styles.col2 }, 'Valore Rilevato'),
                createElement(Text, { style: styles.col3 }, 'Data Rilevazione')
              ),
              vitals.slice(0, 8).map((v: any) =>
                createElement(View, { key: v.id, style: styles.tableRow },
                  createElement(Text, { style: styles.col1 }, v.type?.replace(/_/g, ' ')),
                  createElement(Text, { style: styles.col2 }, `${v.value} ${v.unit} ${v.is_alert ? '(! ALERT)' : ''}`),
                  createElement(Text, { style: styles.col3 }, new Date(v.recorded_at).toLocaleDateString('it-IT'))
                )
              )
            )
      ),

      // Diario Clinico
      createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, '4. Annotazioni Diario Clinico (Staff)'),
        notes.length === 0
          ? createElement(Text, {}, 'Nessuna annotazione registrata.')
          : notes.slice(0, 5).map((note: any) =>
              createElement(View, { key: note.id, style: { marginBottom: 10, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' } },
                createElement(Text, { style: { fontWeight: 'bold' } },
                  `${new Date(note.created_at).toLocaleString('it-IT')} • Categoria: ${note.category}`
                ),
                createElement(Text, { style: { marginTop: 2 } }, note.content)
              )
            )
      )
    )
  )
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return new NextResponse('patientId mancante', { status: 400 })
    }

    const supabase = await createClient()

    // 1. Recupera Paziente
    const { data: patient, error: ptError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (ptError || !patient) {
      return new NextResponse('Paziente non trovato', { status: 404 })
    }

    // 2. Recupera farmaci, vitals e note
    const [medsRes, vitalsRes, notesRes] = await Promise.all([
      supabase.from('medications').select('*').eq('patient_id', patientId).eq('is_active', true),
      supabase.from('vital_signs').select('*').eq('patient_id', patientId).order('recorded_at', { ascending: false }),
      supabase.from('clinical_notes').select('*').eq('patient_id', patientId).eq('is_private', false).order('created_at', { ascending: false })
    ])

    const meds = medsRes.data || []
    const vitals = vitalsRes.data || []
    const notes = notesRes.data || []

    // Rende il PDF come stream di risposta
    const stream = await renderToStream(
      createPatientPdf({ patient, meds, vitals, notes })
    )

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Fascicolo_${patient.full_name.replace(/\s+/g, '_')}.pdf"`
      }
    })
  } catch (error: any) {
    console.error('Errore export PDF:', error.message)
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
