'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPatients, getPatientById, createPatient, updatePatient, deletePatient } from '@/app/actions/patients'
import { Patient } from '@/types'
import { PatientFormInput } from '@/lib/validators/patient'
import { toast } from 'sonner'

export function usePatient(patientId?: string) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [ward, setWard] = useState('all')
  const [showInactive, setShowInactive] = useState(false)

  // Carica la lista dei pazienti
  const fetchPatients = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getPatients(search, ward, showInactive)
    if (error) {
      toast.error('Errore nel caricamento dei pazienti: ' + error)
    } else if (data) {
      setPatients(data)
    }
    setLoading(false)
  }, [search, ward, showInactive])

  // Carica i dettagli del singolo paziente
  const fetchPatientById = useCallback(async (id: string) => {
    setLoading(true)
    const { data, error } = await getPatientById(id)
    if (error) {
      toast.error('Errore nel caricamento del paziente: ' + error)
    } else if (data) {
      setCurrentPatient(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientId) {
        fetchPatientById(patientId)
      } else {
        fetchPatients()
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [patientId, fetchPatients, fetchPatientById])

  // Crea un nuovo paziente
  const handleCreatePatient = async (input: PatientFormInput) => {
    setLoading(true)
    const { data, error } = await createPatient(input)
    setLoading(false)
    if (error) {
      toast.error('Errore nella creazione: ' + error)
      return { success: false, data: null }
    } else {
      toast.success('Paziente creato con successo!')
      fetchPatients()
      return { success: true, data }
    }
  }

  // Modifica un paziente
  const handleUpdatePatient = async (id: string, input: PatientFormInput) => {
    setLoading(true)
    const { data, error } = await updatePatient(id, input)
    setLoading(false)
    if (error) {
      toast.error('Errore nell\'aggiornamento: ' + error)
      return { success: false, data: null }
    } else {
      toast.success('Paziente aggiornato con successo!')
      if (currentPatient && currentPatient.id === id) {
        setCurrentPatient(data)
      } else {
        fetchPatients()
      }
      return { success: true, data }
    }
  }

  // Elimina/Disattiva un paziente
  const handleDeletePatient = async (id: string) => {
    setLoading(true)
    const { error } = await deletePatient(id)
    setLoading(false)
    if (error) {
      toast.error('Errore nella disattivazione: ' + error)
      return false
    } else {
      toast.success('Paziente disattivato con successo!')
      fetchPatients()
      return true
    }
  }

  return {
    patients,
    currentPatient,
    loading,
    search,
    setSearch,
    ward,
    setWard,
    showInactive,
    setShowInactive,
    refreshPatients: fetchPatients,
    refreshCurrentPatient: () => patientId && fetchPatientById(patientId),
    createPatient: handleCreatePatient,
    updatePatient: handleUpdatePatient,
    deletePatient: handleDeletePatient,
  }
}
