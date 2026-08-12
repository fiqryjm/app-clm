'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { RiskRegister } from '@/types/database'
import { getRiskLevel } from '@/lib/utils'

const RATING_OPTIONS = [1, 2, 3, 4, 5]

function RiskScoreBadge({ likelihood, impact }: { likelihood: number | null; impact: number | null }) {
  if (!likelihood || !impact) return <span className="text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>—</span>
  const score = likelihood * impact
  const level = getRiskLevel(score)
  const styles = {
    low: { bg: 'hsl(142 71% 45% / 0.2)', color: 'hsl(142 71% 55%)' },
    medium: { bg: 'hsl(38 92% 50% / 0.2)', color: 'hsl(38 92% 60%)' },
    high: { bg: 'hsl(25 95% 53% / 0.2)', color: 'hsl(25 95% 65%)' },
    critical: { bg: 'hsl(0 84% 60% / 0.2)', color: 'hsl(0 84% 70%)' },
  }
  const s = styles[level]
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: s.bg, color: s.color }}>
      <span className="text-base leading-none">{score}</span>
      <span className="font-medium capitalize">{level}</span>
    </span>
  )
}

export function RisksTab({ contractId }: { contractId: string }) {
  const [risks, setRisks] = useState<RiskRegister[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('risks_register').select('*').eq('contract_id', contractId).order('item_no')
      setRisks(data ?? [])
      setLoading(false)
    }
    load()
  }, [contractId])

  const add = async () => {
    const nextNo = (risks.at(-1)?.item_no ?? 0) + 1
    const { data } = await supabase.from('risks_register').insert({
      contract_id: contractId, item_no: nextNo, issue: null,
      likelihood_rating: null, impact_rating: null, mitigation: null, proposed_solution: null,
    }).select().single()
    if (data) setRisks([...risks, data])
  }

  const update = (id: string, field: string, value: string | number | null) => {
    setRisks(risks.map((r) => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      // Recalculate risk score client-side for display
      if (field === 'likelihood_rating' || field === 'impact_rating') {
        updated.overall_risk_score = (updated.likelihood_rating ?? 0) * (updated.impact_rating ?? 0) || null
      }
      return updated
    }))
  }

  const saveAll = async () => {
    setSaving(true)
    await Promise.all(risks.map((r) =>
      supabase.from('risks_register').update({
        issue: r.issue, likelihood_rating: r.likelihood_rating,
        impact_rating: r.impact_rating, mitigation: r.mitigation, proposed_solution: r.proposed_solution,
      }).eq('id', r.id)
    ))
    // Reload to get DB-generated overall_risk_score
    const { data } = await supabase.from('risks_register').select('*').eq('contract_id', contractId).order('item_no')
    if (data) setRisks(data)
    setSaving(false)
  }

  const remove = async (id: string) => {
    await supabase.from('risks_register').delete().eq('id', id)
    setRisks(risks.filter((r) => r.id !== id))
  }

  const criticalCount = risks.filter((r) => r.overall_risk_score && getRiskLevel(r.overall_risk_score) === 'critical').length
  const highCount = risks.filter((r) => r.overall_risk_score && getRiskLevel(r.overall_risk_score) === 'high').length

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 size={28} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Risks', value: risks.length, color: 'hsl(var(--foreground))' },
          { label: 'Critical', value: criticalCount, color: 'hsl(var(--danger))' },
          { label: 'High', value: highCount, color: 'hsl(25 95% 65%)' },
          { label: 'Med + Low', value: risks.length - criticalCount - highCount, color: 'hsl(var(--warning))' },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <div className="label mb-1">{item.label}</div>
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>Risk Register</h3>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--foreground-muted))' }}>Risk Score = Likelihood × Impact (1–5 scale)</p>
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="btn-secondary py-1.5 text-xs"><Plus size={13} />Add Risk</button>
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
                <th>Issue(s)</th>
                <th className="w-28 text-center">Likelihood</th>
                <th className="w-28 text-center">Impact</th>
                <th className="w-36 text-center">Risk Score</th>
                <th>Mitigation</th>
                <th>Proposed Solution</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {risks.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>No risks registered yet.</td></tr>
              ) : risks.map((r) => (
                <tr key={r.id}>
                  <td className="text-center text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>{r.item_no}</td>
                  <td>
                    <input type="text" value={r.issue ?? ''} onChange={(e) => update(r.id, 'issue', e.target.value || null)}
                      className="input-base py-1.5" placeholder="Describe the risk..." />
                  </td>
                  <td>
                    <select value={r.likelihood_rating ?? ''} onChange={(e) => update(r.id, 'likelihood_rating', e.target.value ? Number(e.target.value) : null)}
                      className="input-base py-1.5 text-center">
                      <option value="">—</option>
                      {RATING_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={r.impact_rating ?? ''} onChange={(e) => update(r.id, 'impact_rating', e.target.value ? Number(e.target.value) : null)}
                      className="input-base py-1.5 text-center">
                      <option value="">—</option>
                      {RATING_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <td className="text-center">
                    <RiskScoreBadge likelihood={r.likelihood_rating} impact={r.impact_rating} />
                  </td>
                  <td>
                    <input type="text" value={r.mitigation ?? ''} onChange={(e) => update(r.id, 'mitigation', e.target.value || null)}
                      className="input-base py-1.5" placeholder="Mitigation actions..." />
                  </td>
                  <td>
                    <input type="text" value={r.proposed_solution ?? ''} onChange={(e) => update(r.id, 'proposed_solution', e.target.value || null)}
                      className="input-base py-1.5" placeholder="Proposed solution..." />
                  </td>
                  <td>
                    <button onClick={() => remove(r.id)} className="p-1 rounded hover:bg-red-500/10 transition-colors" style={{ color: 'hsl(var(--foreground-muted))' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-6 px-4 py-3 rounded-lg text-xs" style={{ background: 'hsl(var(--surface-2))', border: '1px solid hsl(var(--border))' }}>
        <span style={{ color: 'hsl(var(--foreground-muted))' }}>Risk Score Legend:</span>
        {[
          { label: 'Low (1–4)', bg: 'hsl(142 71% 45% / 0.2)', color: 'hsl(142 71% 55%)' },
          { label: 'Medium (5–9)', bg: 'hsl(38 92% 50% / 0.2)', color: 'hsl(38 92% 60%)' },
          { label: 'High (10–16)', bg: 'hsl(25 95% 53% / 0.2)', color: 'hsl(25 95% 65%)' },
          { label: 'Critical (17–25)', bg: 'hsl(0 84% 60% / 0.2)', color: 'hsl(0 84% 70%)' },
        ].map((l) => (
          <span key={l.label} className="px-2 py-0.5 rounded" style={{ background: l.bg, color: l.color }}>{l.label}</span>
        ))}
      </div>
    </div>
  )
}
