import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use untyped client to avoid complex generic issues; TypeScript types applied via cast
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient(supabaseUrl, supabaseAnonKey) as any

// Helper to generate next Contract ID
export async function generateNextContractId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `CLM-${year}-`

  const { data } = await supabase
    .from('contracts')
    .select('contract_id')
    .like('contract_id', `${prefix}%`)
    .order('contract_id', { ascending: false })
    .limit(1)

  if (!data || data.length === 0) return `${prefix}001`

  const lastNum = parseInt((data[0].contract_id as string).replace(prefix, ''), 10)
  return `${prefix}${(lastNum + 1).toString().padStart(3, '0')}`
}
