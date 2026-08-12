'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { FinalDeliverable } from '@/types/database'

export function DeliverablesTab({ contractId }: { contractId: string }) {
  const [deliverables, setDeliverables] = useState<FinalDeliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('final_deliverables').select('*').eq('contract_id', contractId).order('item_no')
      setDeliverables(data ?? [])
      setLoading(false)
    }
    load()
  }, [contractId])

  const add = async () => {
    const nextNo = (deliverables.at(-1)?.item_no ?? 0) + 1
    const { data } = await supabase.from('final_deliverables').insert({
      contract_id: contractId, item_no: nextNo, description: null,
    }).select().single()
    if (data) setDeliverables([...deliverables, data])
  }

  const update = (id: string, description: string) => {
    setDeliverables(deliverables.map((d) => d.id === id ? { ...d, description: description || null } : d))
  }

  const saveAll = async () => {
    setSaving(true)
    await Promise.all(deliverables.map((d) =>
      supabase.from('final_deliverables').update({ description: d.description }).eq('id', d.id)
    ))
    setSaving(false)
  }

  const remove = async (id: string) => {
    await supabase.from('final_deliverables').delete().eq('id', id)
    setDeliverables(
      deliverables
        .filter((d) => d.id !== id)
        .map((d, i) => ({ ...d, item_no: i + 1 }))
    )
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 size={28} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>Final Deliverables</h3>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--foreground-muted))' }}>
              {deliverables.length} deliverable{deliverables.length !== 1 ? 's' : ''} defined
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="btn-secondary py-1.5 text-xs"><Plus size={13} />Add Deliverable</button>
            <button onClick={saveAll} disabled={saving || deliverables.length === 0} className="btn-primary py-1.5 text-xs">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
          {deliverables.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>
              No deliverables defined yet. Click "Add Deliverable" to start.
            </div>
          ) : deliverables.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-5 py-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                {d.item_no}
              </span>
              <input
                type="text"
                value={d.description ?? ''}
                onChange={(e) => update(d.id, e.target.value)}
                className="input-base py-2 flex-1"
                placeholder="Describe the final deliverable..."
              />
              <button onClick={() => remove(d.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors flex-shrink-0" style={{ color: 'hsl(var(--foreground-muted))' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
