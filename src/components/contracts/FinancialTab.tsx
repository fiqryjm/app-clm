'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { ContractLineItem, VariationOrder } from '@/types/database'

function EditableNumber({ value, onChange, className = '' }: {
  value: number | null; onChange: (v: number | null) => void; className?: string
}) {
  return (
    <input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={`input-base text-right tabular-nums py-1.5 ${className}`} placeholder="0.00" step="0.01" />
  )
}

function sum(items: number[]) { return items.reduce((a, b) => a + b, 0) }

export function FinancialTab({ contractId, currency, onSaved }: { contractId: string; currency: string; onSaved?: () => void }) {
  const [lineItems, setLineItems] = useState<ContractLineItem[]>([])
  const [variations, setVariations] = useState<VariationOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: li }, { data: vo }] = await Promise.all([
        supabase.from('contract_line_items').select('*').eq('contract_id', contractId).order('item_no'),
        supabase.from('variation_orders').select('*').eq('contract_id', contractId).order('item_no'),
      ])
      setLineItems(li ?? [])
      setVariations(vo ?? [])
      setLoading(false)
    }
    load()
  }, [contractId])

  const totalContractValue = sum(lineItems.map((i) => i.contract_value ?? 0))
  const totalBudget = sum(lineItems.map((i) => i.budget ?? 0))
  const totalVarValue = sum(variations.map((v) => v.value ?? 0))
  const totalVarBudget = sum(variations.map((v) => v.budget ?? 0))

  const addLineItem = async () => {
    const nextNo = (lineItems.at(-1)?.item_no ?? 0) + 1
    const { data } = await supabase.from('contract_line_items').insert({
      contract_id: contractId, item_no: nextNo, description: null, contract_value: null, budget: null,
    }).select().single()
    if (data) setLineItems([...lineItems, data])
  }

  const updateLineItem = (id: string, field: string, value: string | number | null) => {
    setLineItems(lineItems.map((i) => i.id === id ? { ...i, [field]: value } : i))
  }

  const saveLineItem = async (item: ContractLineItem) => {
    await supabase.from('contract_line_items').update({
      description: item.description, contract_value: item.contract_value, budget: item.budget,
    }).eq('id', item.id)
  }

  const deleteLineItem = async (id: string) => {
    await supabase.from('contract_line_items').delete().eq('id', id)
    setLineItems(lineItems.filter((i) => i.id !== id))
  }

  const addVariation = async () => {
    const nextNo = (variations.at(-1)?.item_no ?? 0) + 1
    const { data } = await supabase.from('variation_orders').insert({
      contract_id: contractId, item_no: nextNo, description: null, value: null, budget: null, completion_date: null,
    }).select().single()
    if (data) setVariations([...variations, data])
  }

  const updateVariation = (id: string, field: string, value: string | number | null) => {
    setVariations(variations.map((v) => v.id === id ? { ...v, [field]: value } : v))
  }

  const saveVariation = async (item: VariationOrder) => {
    await supabase.from('variation_orders').update({
      description: item.description, value: item.value, budget: item.budget,
      completion_date: item.completion_date || null,
    }).eq('id', item.id)
  }

  const deleteVariation = async (id: string) => {
    await supabase.from('variation_orders').delete().eq('id', id)
    setVariations(variations.filter((v) => v.id !== id))
  }

  const saveAll = async () => {
    setSaving(true)
    await Promise.all([
      ...lineItems.map(saveLineItem),
      ...variations.map(saveVariation),
    ])

    // Update parent contract totals in Supabase
    await supabase.from('contracts').update({
      initial_contract_value: totalContractValue,
      total_contract_value: totalContractValue + totalVarValue,
      total_variation_order: totalVarValue,
      final_cost: totalContractValue + totalVarValue,
      initial_variation_budget: totalBudget,
      total_variation_budget: totalVarBudget,
      final_budget: totalBudget + totalVarBudget,
    }).eq('id', contractId)

    if (onSaved) onSaved()
    setSaving(false)
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
        {[
          { label: 'Initial Contract Value', value: totalContractValue, color: 'hsl(var(--primary))' },
          { label: 'Total Variation Order', value: totalVarValue, color: 'hsl(var(--warning))' },
          { label: 'Final Cost', value: totalContractValue + totalVarValue, color: 'hsl(var(--success))' },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <div className="label mb-1">{item.label}</div>
            <div className="text-lg font-bold tabular-nums" style={{ color: item.color }}>{formatCurrency(item.value, currency)}</div>
          </div>
        ))}
      </div>

      {/* Line Items */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--primary))' }}>Detail Cost / Budget Structure</h3>
          <div className="flex gap-2">
            <button onClick={addLineItem} className="btn-secondary py-1.5 text-xs"><Plus size={13} />Add Line Item</button>
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
                <th className="w-12">Item</th>
                <th>Description</th>
                <th className="w-44 text-right">Contract Value ({currency})</th>
                <th className="w-44 text-right">Budget ({currency})</th>
                <th className="w-44 text-right">Cost vs Budget</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>No line items yet. Click "Add Line Item" to start.</td></tr>
              ) : lineItems.map((item) => {
                const diff = (item.budget ?? 0) - (item.contract_value ?? 0)
                return (
                  <tr key={item.id}>
                    <td className="text-center text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>{item.item_no}</td>
                    <td>
                      <input type="text" value={item.description ?? ''} onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        onBlur={() => saveLineItem(item)} className="input-base py-1.5" placeholder="Description..." />
                    </td>
                    <td>
                      <EditableNumber value={item.contract_value} onChange={(v) => updateLineItem(item.id, 'contract_value', v)} />
                    </td>
                    <td>
                      <EditableNumber value={item.budget} onChange={(v) => updateLineItem(item.id, 'budget', v)} />
                    </td>
                    <td className="text-right">
                      <span className="text-sm font-medium tabular-nums" style={{ color: diff < 0 ? 'hsl(var(--danger))' : 'hsl(var(--success))' }}>
                        {diff > 0 ? '+' : ''}{formatCurrency(diff, '')}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => deleteLineItem(item.id)} className="p-1 rounded hover:bg-red-500/10 transition-colors" style={{ color: 'hsl(var(--foreground-muted))' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'hsl(var(--surface-2))' }}>
                <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-right" style={{ color: 'hsl(var(--foreground))' }}>Total</td>
                <td className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: 'hsl(var(--danger))' }}>{formatCurrency(totalContractValue, currency)}</td>
                <td className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: 'hsl(var(--danger))' }}>{formatCurrency(totalBudget, currency)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Variation Orders */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--warning))' }}>Variation Orders</h3>
          <button onClick={addVariation} className="btn-secondary py-1.5 text-xs"><Plus size={13} />Add Variation</button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">Item</th>
                <th>Description</th>
                <th className="w-44 text-right">Value ({currency})</th>
                <th className="w-44 text-right">Budget ({currency})</th>
                <th className="w-36">Completion Date</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {variations.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>No variation orders yet.</td></tr>
              ) : variations.map((item) => (
                <tr key={item.id}>
                  <td className="text-center text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>{item.item_no}</td>
                  <td>
                    <input type="text" value={item.description ?? ''} onChange={(e) => updateVariation(item.id, 'description', e.target.value)}
                      onBlur={() => saveVariation(item)} className="input-base py-1.5" placeholder="Description..." />
                  </td>
                  <td>
                    <EditableNumber value={item.value} onChange={(v) => updateVariation(item.id, 'value', v)} />
                  </td>
                  <td>
                    <EditableNumber value={item.budget} onChange={(v) => updateVariation(item.id, 'budget', v)} />
                  </td>
                  <td>
                    <input type="date" value={item.completion_date ?? ''} onChange={(e) => updateVariation(item.id, 'completion_date', e.target.value)}
                      onBlur={() => saveVariation(item)} className="input-base py-1.5" />
                  </td>
                  <td>
                    <button onClick={() => deleteVariation(item.id)} className="p-1 rounded hover:bg-red-500/10 transition-colors" style={{ color: 'hsl(var(--foreground-muted))' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'hsl(var(--surface-2))' }}>
                <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-right" style={{ color: 'hsl(var(--foreground))' }}>Total</td>
                <td className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: 'hsl(var(--danger))' }}>{formatCurrency(totalVarValue, currency)}</td>
                <td className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: 'hsl(var(--danger))' }}>{formatCurrency(totalVarBudget, currency)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
