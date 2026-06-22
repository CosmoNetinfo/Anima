import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Endpoint temporaneo — aggiorna il ruolo dell'utente attualmente loggato a super_admin
 * Da chiamare UNA SOLA VOLTA visitando: http://localhost:3000/api/fix-admin
 * Dopo averlo usato puoi cancellare questo file.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Verifica che l'utente sia autenticato
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Aggiorna il ruolo a super_admin usando la service role key
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await serviceClient
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', user.id)
      .select('id, full_name, role')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `✅ Ruolo aggiornato con successo!`,
      user: data,
      note: 'Ricarica la pagina e questo file puoi cancellarlo.'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
