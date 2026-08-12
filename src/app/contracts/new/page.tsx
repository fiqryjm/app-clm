'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, FileText, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { CURRENCIES, CONTRACT_TYPES } from '@/lib/utils'
import { supabase, generateNextContractId } from '@/lib/supabase'

const USED_OF_CONTRACT_OPTIONS = ['Project', 'In-house']

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2 border-b"
        style={{ color: 'hsl(var(--primary))', borderColor: 'hsl(var(--border))' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, required, children, hint, className = '' }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string; className?: string
}) {
  return (
    <div className={className}>
      <label className="label">
        {label}{required && <span style={{ color: 'hsl(var(--danger))' }}> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>{hint}</p>}
    </div>
  )
}

export default function NewContractPage() {
  const router = useRouter()
  const [contractType, setContractType] = useState<'SALES' | 'SUPPLIER'>('SUPPLIER')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewId, setPreviewId] = useState<string>('...')
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    contract_title: '',
    cost_center: '',
    requisition_no: '',
    date_request: new Date().toISOString().split('T')[0],
    start_date: '',
    end_date: '',
    expiry_reminder_date: '',
    counterpart_name: '',
    counterpart_id: '',
    address: '',
    phone: '',
    email: '',
    used_of_contract: '',
    type_of_contract: '',
    contract_brief_summary: '',
    location_of_work: '',
    bom_scope_of_work: '',
    owner_estimate: '',
    currency: 'IDR',
    end_user_name: '',
    end_user_department: '',
    approved_by: '',
  })

  useEffect(() => {
    generateNextContractId().then(setPreviewId)
  }, [])

  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const contractId = await generateNextContractId()
      const today = new Date().toISOString().split('T')[0]

      const { data, error: insertError } = await supabase
        .from('contracts')
        .insert({
          contract_id: contractId,
          contract_type: contractType,
          contract_title: formData.contract_title,
          cost_center: formData.cost_center || null,
          requisition_no: formData.requisition_no || null,
          date_request: formData.date_request || today,
          date_entry: today,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          expiry_reminder_date: formData.expiry_reminder_date || null,
          status: 'REQUEST',
          counterpart_name: formData.counterpart_name || null,
          counterpart_id: formData.counterpart_id || null,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          used_of_contract: formData.used_of_contract || null,
          type_of_contract: formData.type_of_contract || null,
          contract_brief_summary: formData.contract_brief_summary || null,
          location_of_work: formData.location_of_work || null,
          bom_scope_of_work: formData.bom_scope_of_work || null,
          currency: formData.currency,
          owner_estimate: formData.owner_estimate ? parseFloat(formData.owner_estimate) : null,
          end_user_name: formData.end_user_name || null,
          end_user_department: formData.end_user_department || null,
          approved_by: formData.approved_by || null,
        })
        .select()
        .single()

      if (insertError) throw insertError
      router.push(`/contracts/${data.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create contract. Please try again.'
      setError(message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/contracts" className="flex items-center gap-1.5 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>
          <ArrowLeft size={16} />Back
        </Link>
        <div className="w-px h-4" style={{ background: 'hsl(var(--border))' }} />
        <div className="flex items-center gap-2">
          <FileText size={18} style={{ color: 'hsl(var(--primary))' }} />
          <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Contract Request</h1>
        </div>
        <span className="ml-auto font-mono text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>
          {previewId}
        </span>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg mb-6" style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
        <AlertCircle size={16} style={{ color: 'hsl(var(--primary))', marginTop: 1 }} />
        <div className="text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>
          Fields marked with <span style={{ color: 'hsl(var(--danger))' }}>*</span> are mandatory.
          Contract ID <strong style={{ color: 'hsl(var(--primary))' }}>{previewId}</strong> will be auto-assigned.
          Counterpart (**) is suggested and subject to Procurement Policy.
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg mb-6" style={{ background: 'hsl(var(--danger) / 0.1)', border: '1px solid hsl(var(--danger) / 0.3)' }}>
          <AlertCircle size={16} style={{ color: 'hsl(var(--danger))' }} />
          <span className="text-sm" style={{ color: 'hsl(var(--danger))' }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contract Type & Header */}
        <div className="card p-6 space-y-6">
          <FormSection title="Contract Type & Identification">
            <div className="mb-6">
              <label className="label">Contract Side</label>
              <div className="flex gap-3">
                {(['SUPPLIER', 'SALES'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setContractType(t)}
                    className="flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all border"
                    style={contractType === t ? {
                      background: t === 'SALES' ? 'hsl(199 89% 48% / 0.2)' : 'hsl(239 84% 67% / 0.2)',
                      borderColor: t === 'SALES' ? 'hsl(199 89% 48% / 0.5)' : 'hsl(239 84% 67% / 0.5)',
                      color: t === 'SALES' ? 'hsl(199 89% 60%)' : 'hsl(239 84% 75%)',
                    } : {
                      background: 'hsl(var(--surface-2))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground-muted))',
                    }}>
                    {t === 'SALES' ? '↗ Sales Contract (Sell)' : '↙ Supplier Contract (Buy)'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Cost Center">
                <input type="text" className="input-base" placeholder="e.g. IT-001" value={formData.cost_center} onChange={(e) => handleChange('cost_center', e.target.value)} />
              </Field>
              <Field label="Requisition No">
                <input type="text" className="input-base" placeholder="e.g. REQ-2024-001" value={formData.requisition_no} onChange={(e) => handleChange('requisition_no', e.target.value)} />
              </Field>
              <Field label="Date Request">
                <input type="date" className="input-base" value={formData.date_request} onChange={(e) => handleChange('date_request', e.target.value)} />
              </Field>
            </div>
            <Field label="Contract Title" required className="mt-4">
              <input type="text" className="input-base" placeholder="Enter full contract title..." required value={formData.contract_title} onChange={(e) => handleChange('contract_title', e.target.value)} />
            </Field>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Field label="Start Date" required>
                <input type="date" className="input-base" required value={formData.start_date} onChange={(e) => handleChange('start_date', e.target.value)} />
              </Field>
              <Field label="End Date" required>
                <input type="date" className="input-base" required value={formData.end_date} onChange={(e) => handleChange('end_date', e.target.value)} />
              </Field>
              <Field label="Expiry Reminder Date">
                <input type="date" className="input-base" value={formData.expiry_reminder_date} onChange={(e) => handleChange('expiry_reminder_date', e.target.value)} />
              </Field>
            </div>
          </FormSection>
        </div>

        {/* Counterpart */}
        <div className="card p-6 space-y-4">
          <FormSection title="Counterpart Information (**)">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Suggested Counter Part" required hint="(**) Subject to Procurement Policy">
                <input type="text" className="input-base" placeholder="Company / Individual name" required value={formData.counterpart_name} onChange={(e) => handleChange('counterpart_name', e.target.value)} />
              </Field>
              <Field label="Counter Part ID">
                <input type="text" className="input-base" placeholder="Vendor/Customer ID" value={formData.counterpart_id} onChange={(e) => handleChange('counterpart_id', e.target.value)} />
              </Field>
            </div>
            <Field label="Address" required>
              <input type="text" className="input-base" placeholder="Full address" required value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Phone">
                <input type="tel" className="input-base" placeholder="+62..." value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              </Field>
              <Field label="E-mail">
                <input type="email" className="input-base" placeholder="email@example.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
              </Field>
              <Field label="Type of Contract">
                <select className="input-base" value={formData.type_of_contract} onChange={(e) => handleChange('type_of_contract', e.target.value)}>
                  <option value="">Select type...</option>
                  {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Used of Contract">
              <select className="input-base" value={formData.used_of_contract} onChange={(e) => handleChange('used_of_contract', e.target.value)}>
                <option value="">Select purpose...</option>
                {USED_OF_CONTRACT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </FormSection>
        </div>

        {/* Scope */}
        <div className="card p-6 space-y-4">
          <FormSection title="Scope & Summary">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contract Brief Summary">
                <textarea className="input-base resize-none" rows={3} placeholder="Brief description..." value={formData.contract_brief_summary} onChange={(e) => handleChange('contract_brief_summary', e.target.value)} />
              </Field>
              <Field label="Location of Work" required>
                <input type="text" className="input-base" placeholder="Work location / site" required value={formData.location_of_work} onChange={(e) => handleChange('location_of_work', e.target.value)} />
              </Field>
            </div>
            <Field label="BoM, Scope of Work" required hint="(*) Mandatory. Describe or attach scope of work, bill of materials, etc.">
              <textarea className="input-base resize-none" rows={4} placeholder="Describe the scope of work..." required value={formData.bom_scope_of_work} onChange={(e) => handleChange('bom_scope_of_work', e.target.value)} />
            </Field>
          </FormSection>
        </div>

        {/* Financial */}
        <div className="card p-6 space-y-4">
          <FormSection title="Financial Information">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Owner Estimate">
                <input type="number" className="input-base" placeholder="0.00" min="0" step="0.01" value={formData.owner_estimate} onChange={(e) => handleChange('owner_estimate', e.target.value)} />
              </Field>
              <Field label="Currency">
                <select className="input-base" value={formData.currency} onChange={(e) => handleChange('currency', e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </FormSection>
        </div>

        {/* Approval */}
        <div className="card p-6 space-y-4">
          <FormSection title="Requestor & Approval">
            <div className="grid grid-cols-2 gap-4">
              <Field label="End User Name" required>
                <input type="text" className="input-base" placeholder="Full name" required value={formData.end_user_name} onChange={(e) => handleChange('end_user_name', e.target.value)} />
              </Field>
              <Field label="Department">
                <input type="text" className="input-base" placeholder="Department name" value={formData.end_user_department} onChange={(e) => handleChange('end_user_department', e.target.value)} />
              </Field>
            </div>
            <Field label="Approved By">
              <input type="text" className="input-base" placeholder="Approver name / title" value={formData.approved_by} onChange={(e) => handleChange('approved_by', e.target.value)} />
            </Field>
          </FormSection>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between py-4">
          <Link href="/contracts" className="btn-secondary">
            <ArrowLeft size={14} />Cancel
          </Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSubmitting ? 'Submitting...' : 'Submit Contract Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
