'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ProgressPayment } from '@/types/database'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const CHART_COLORS = {
  contract_value: '#ef4444',
  budget: '#22c55e',
  cumulative_payment: '#3b82f6',
  progress_delivery_pct: '#f59e0b',
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg p-3 text-xs shadow-xl" style={{ background: 'hsl(var(--surface-2))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
      <div className="font-semibold mb-2">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'hsl(var(--foreground-muted))' }}>{p.name}:</span>
          <span className="font-medium tabular-nums">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export function ProgressPaymentTab({ contractId, currency }: { contractId: string; currency: string }) {
  const [payments, setPayments] = useState<ProgressPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('progress_payments').select('*').eq('contract_id', contractId).order('item_no')
      setPayments(data ?? [])
      setLoading(false)
    }
    load()
  }, [contractId])

  const chartData = payments.map((p) => ({
    date: p.date ? new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : `#${p.item_no}`,
    'Contract Value': p.contract_value ?? 0,
    'Budget': p.budget ?? 0,
    'Cumulative Payment': p.cumulative_payment ?? 0,
    'Progress %': p.progress_delivery_pct ?? 0,
  }))

  const addPayment = async () => {
    const nextNo = (payments.at(-1)?.item_no ?? 0) + 1
    const { data } = await supabase.from('progress_payments').insert({
      contract_id: contractId, item_no: nextNo, date: null,
      budget: null, contract_value: null, progress_delivery_pct: null, cumulative_payment: null, payment: null,
    }).select().single()
    if (data) setPayments([...payments, data])
  }

  const updatePayment = (id: string, field: string, value: string | number | null) => {
    setPayments(payments.map((p) => p.id === id ? { ...p, [field]: value } : p))
  }

  const saveAll = async () => {
    setSaving(true)
    await Promise.all(payments.map((p) =>
      supabase.from('progress_payments').update({
        date: p.date || null,
        budget: p.budget,
        contract_value: p.contract_value,
        progress_delivery_pct: p.progress_delivery_pct,
        cumulative_payment: p.cumulative_payment,
        payment: p.payment,
      }).eq('id', p.id)
    ))
    setSaving(false)
  }

  const deletePayment = async (id: string) => {
    await supabase.from('progress_payments').delete().eq('id', id)
    setPayments(payments.filter((p) => p.id !== id))
  }

  const NUMERIC_FIELDS: (keyof ProgressPayment)[] = ['budget', 'contract_value', 'progress_delivery_pct', 'cumulative_payment', 'payment']

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 size={28} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Chart */}
      {payments.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'hsl(var(--foreground))' }}>Contract Budget Performance</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--foreground-muted))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'hsl(var(--foreground-muted))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'hsl(var(--foreground-muted))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 120]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--foreground-muted))' }} />
                <Line yAxisId="left" type="monotone" dataKey="Contract Value" stroke={CHART_COLORS.contract_value} strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="Budget" stroke={CHART_COLORS.budget} strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="Cumulative Payment" stroke={CHART_COLORS.cumulative_payment} strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="Progress %" stroke={CHART_COLORS.progress_delivery_pct} strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>Progress Payment Schedule</h3>
          <div className="flex gap-2">
            <button onClick={addPayment} className="btn-secondary py-1.5 text-xs"><Plus size={13} />Add Row</button>
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
                <th>Date</th>
                <th className="text-right">Budget</th>
                <th className="text-right">Contract Value</th>
                <th className="text-right">Progress %</th>
                <th className="text-right">Cumulative Payment</th>
                <th className="text-right">Payment (*)</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>No payment schedule yet. Click "Add Row" to start.</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id}>
                  <td className="text-center text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>{p.item_no}</td>
                  <td>
                    <input type="date" value={p.date ?? ''} onChange={(e) => updatePayment(p.id, 'date', e.target.value)} className="input-base py-1" />
                  </td>
                  {NUMERIC_FIELDS.map((field) => (
                    <td key={field}>
                      <input type="number" value={(p[field] as number | null) ?? ''} step="0.01" placeholder="0"
                        onChange={(e) => updatePayment(p.id, field, e.target.value ? Number(e.target.value) : null)}
                        className="input-base text-right tabular-nums py-1" />
                    </td>
                  ))}
                  <td>
                    <button onClick={() => deletePayment(p.id)} className="p-1 rounded hover:bg-red-500/10 transition-colors" style={{ color: 'hsl(var(--foreground-muted))' }}>
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
