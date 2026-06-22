import { redirect } from 'next/navigation'

export default function PatientIdPage({ params }: { params: { id: string } }) {
  redirect(`/patients/${params.id}/overview`)
}
