'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Milestone } from '@/types/database'

function getMilestoneStatus(initial: string | null, actual: string | null): 'ahead' | 'on-target' | 'late' {
  if (actual && initial) {
    const act = new Date(actual).setHours(0, 0, 0, 0)
    const init = new Date(initial).setHours(0, 0, 0, 0)
    if (act < init) return 'ahead'
    if (act === init) return 'on-target'
    return 'late'
  }
  if (initial) {
    const today = new Date().setHours(0, 0, 0, 0)
    const init = new Date(initial).setHours(0, 0, 0, 0)
    if (today > init) return 'late'
  }
  return 'on-target'
}

function MilestoneStatusBadge({ status }: { status: ReturnType<typeof getMilestoneStatus> }) {
  const config = {
    'ahead': { label: 'Ahead', color: 'hsl(var(--success))', icon: CheckCircle2 },
    'on-target': { label: 'On Target', color: 'hsl(var(--info))', icon: Clock },
    'late': { label: 'Late', color: 'hsl(var(--danger))', icon: AlertCircle },
  }
  const c = config[status]
  return (
    <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: c.color + '22', color: c.color, border: `1px solid ${c.color}44` }}>
      <c.icon size={11} />{c.label}
    </span>
  )
}

export function MilestonesTab({ contractId }: { contractId: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('milestones').select('*').eq('contract_id', contractId).order('item_no')
      setMilestones(data ?? [])
      setLoading(false)
    }
    load()
  }, [contractId])

  const completed = milestones.filter((m) => m.actual_completion).length
  const total = milestones.length

  const add = async () => {
    const nextNo = (milestones.at(-1)?.item_no ?? 0) + 1
    const { data } = await supabase.from('milestones').insert({
      contract_id: contractId, item_no: nextNo, initial_deadline_date: null,
      actual_completion: null, milestones_description: null, remarks: null,
    }).select().single()
    if (data) setMilestones([...milestones, data])
  }

  const update = (id: string, field: string, value: string | null) => {
    setMilestones(milestones.map((m) => m.id === id ? { ...m, [field]: value } : m))
  }

  const saveAll = async () => {
    setSaving(true)
    await Promise.all(milestones.map((m) =>
      supabase.from('milestones').update({
        initial_deadline_date: m.initial_deadline_date || null,
        actual_completion: m.actual_completion || null,
        milestones_description: m.milestones_description,
        remarks: m.remarks,
      }).eq('id', m.id)
    ))
    setSaving(false)
  }

  const remove = async (id: string) => {
    await supabase.from('milestones').delete().eq('id', id)
    setMilestones(milestones.filter((m) => m.id !== id))
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 size={28} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="label mb-1">Overall Progress</div>
          <div className="text-2xl font-bold mb-2" style={{ color: 'hsl(var(--primary))' }}>
            {total > 0 ? Math.round((completed / total) * 100) : 0}%
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
          </div>
          <div className="text-xs mt-2" style={{ color: 'hsl(var(--foreground-muted))' }}>
            {completed} of {total} milestones completed
          </div>
        </div>
        <div className="card p-4">
          <div className="label mb-1">Delivery Status</div>
          <div className="text-lg font-bold" style={{ color: completed === total && total > 0 ? 'hsl(var(--success))' : 'hsl(var(--info))' }}>
            {total === 0 ? 'No Milestones' : completed === total ? 'Completed' : 'In Progress'}
          </div>
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--foreground-muted))' }}>{total - completed} remaining</div>
        </div>
        <div className="card p-4">
          <div className="label mb-1">Late</div>
          <div className="text-lg font-bold" style={{ color: 'hsl(var(--danger))' }}>
            {milestones.filter((m) => getMilestoneStatus(m.initial_deadline_date, m.actual_completion) === 'late').length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--foreground-muted))' }}>milestones past deadline</div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>Milestone Schedule</h3>
          <div className="flex gap-2">
            <button onClick={add} className="btn-secondary py-1.5 text-xs"><Plus size={13} />Add Milestone</button>
            <button onClick={saveAll} disabled={saving} className="btn-primary py-1.5 text-xs">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th className="w-36">Initial Deadline</th>
                <th className="w-36">Actual Completion</th>
                <th>Milestone Description</th>
                <th className="w-40">Status</th>
                <th>Remarks</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {milestones.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>No milestones yet. Click "Add Milestone" to start.</td></tr>
              ) : milestones.map((m) => (
                <tr key={m.id}>
                  <td className="text-center text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>{m.item_no}</td>
                  <td>
                    <input type="date" value={m.initial_deadline_date ?? ''} onChange={(e) => update(m.id, 'initial_deadline_date', e.target.value || null)} className="input-base py-1" />
                  </td>
                  <td>
                    <input type="date" value={m.actual_completion ?? ''} onChange={(e) => update(m.id, 'actual_completion', e.target.value || null)} className="input-base py-1" />
                  </td>
                  <td>
                    <input type="text" value={m.milestones_description ?? ''} onChange={(e) => update(m.id, 'milestones_description', e.target.value || null)} className="input-base py-1" placeholder="Milestone description..." />
                  </td>
                  <td>
                    <MilestoneStatusBadge status={getMilestoneStatus(m.initial_deadline_date, m.actual_completion)} />
                  </td>
                  <td>
                    <input type="text" value={m.remarks ?? ''} onChange={(e) => update(m.id, 'remarks', e.target.value || null)} className="input-base py-1" placeholder="Notes..." />
                  </td>
                  <td>
                    <button onClick={() => remove(m.id)} className="p-1 rounded hover:bg-red-500/10 transition-colors" style={{ color: 'hsl(var(--foreground-muted))' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
