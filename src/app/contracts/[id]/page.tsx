'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit, FileText, DollarSign, Calendar,
  Milestone, FolderOpen, AlertTriangle, CheckSquare, Clock, Loader2,
} from 'lucide-react'
import { formatCurrency, formatDate, getDaysUntilExpiry, CURRENCIES } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Contract } from '@/types/database'
import { FinancialTab } from '@/components/contracts/FinancialTab'
import { ProgressPaymentTab } from '@/components/contracts/ProgressPaymentTab'
import { MilestonesTab } from '@/components/contracts/MilestonesTab'
import { DocumentsTab } from '@/components/contracts/DocumentsTab'
import { RisksTab } from '@/components/contracts/RisksTab'
import { DeliverablesTab } from '@/components/contracts/DeliverablesTab'

type TabKey = 'overview' | 'financial' | 'payments' | 'milestones' | 'documents' | 'risks' | 'deliverables'

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: FileText },
  { key: 'financial', label: 'Financial', icon: DollarSign },
  { key: 'payments', label: 'Progress Payment', icon: Calendar },
  { key: 'milestones', label: 'Milestones', icon: Milestone },
  { key: 'documents', label: 'Documents', icon: FolderOpen },
  { key: 'risks', label: 'Risk Register', icon: AlertTriangle },
  { key: 'deliverables', label: 'Deliverables', icon: CheckSquare },
]

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ACTIVE: 'status-active', REQUEST: 'status-request',
    DRAFT: 'status-draft', EXPIRED: 'status-expired', TERMINATED: 'status-terminated',
  }
  return <span className={`text-sm font-semibold px-3 py-1 rounded-full ${cls[status] || 'status-draft'}`}>{status}</span>
}

function ValueCard({ label, value, currency, color }: { label: string; value: number | null | undefined; currency: string; color?: string }) {
  return (
    <div className="card p-4">
      <div className="label mb-1">{label}</div>
      <div className="text-lg font-bold tabular-nums" style={{ color: color || 'hsl(var(--foreground))' }}>
        {value != null ? formatCurrency(value, currency) : '—'}
      </div>
    </div>
  )
}

const STATUS_OPTIONS = ['REQUEST', 'DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'] as const

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<Contract>>({})

  const loadContract = async () => {
    const { data, error } = await supabase.from('contracts').select('*').eq('id', id).single()
    if (error || !data) { router.push('/contracts'); return }
    setContract(data as Contract)
    setEditData(data as Contract)
  }

  useEffect(() => {
    setLoading(true)
    loadContract().finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!contract) return
    setSaving(true)

    // Calculate total_contract_value as initial + variation
    const initialVal = editData.initial_contract_value ?? contract.initial_contract_value ?? 0
    const varVal = editData.total_variation_order ?? contract.total_variation_order ?? 0
    const computedTotal = initialVal + varVal

    const updatePayload = {
      ...editData,
      total_contract_value: computedTotal > 0 ? computedTotal : editData.total_contract_value,
    }

    const { data, error } = await supabase
      .from('contracts')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setContract(data as Contract)
      setEditing(false)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    )
  }
  if (!contract) return null

  const c = contract
  const daysLeft = getDaysUntilExpiry(c.expiry_reminder_date)
  const displayContractValue = c.initial_contract_value ?? c.total_contract_value ?? c.owner_estimate

  return (
    <div className="fade-in max-w-7xl space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>
        <Link href="/contracts" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft size={14} /> Contracts
        </Link>
        <span>/</span>
        <span style={{ color: 'hsl(var(--foreground))' }}>{c.contract_id}</span>
      </div>

      {/* Header Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-mono text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>{c.contract_id}</span>
              {editing ? (
                <select
                  value={editData.status || c.status}
                  onChange={(e) => setEditData((d) => ({ ...d, status: e.target.value as Contract['status'] }))}
                  className="input-base py-1 w-auto text-xs"
                  style={{ width: 'auto', minWidth: 130 }}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <StatusBadge status={c.status} />
              )}
              <span className="text-xs px-2 py-0.5 rounded" style={{
                background: c.contract_type === 'SALES' ? 'hsl(199 89% 48% / 0.15)' : 'hsl(239 84% 67% / 0.15)',
                color: c.contract_type === 'SALES' ? 'hsl(199 89% 60%)' : 'hsl(239 84% 75%)',
              }}>
                {c.contract_type === 'SALES' ? '↗ Sales' : '↙ Supplier'}
              </span>
            </div>
            {editing ? (
              <input
                type="text"
                value={editData.contract_title || ''}
                onChange={(e) => setEditData((d) => ({ ...d, contract_title: e.target.value }))}
                className="input-base text-xl font-bold"
                style={{ fontSize: '1.2rem' }}
              />
            ) : (
              <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{c.contract_title}</h1>
            )}
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--foreground-muted))' }}>
              {c.counterpart_name} · {c.cost_center} · {c.type_of_contract}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); setEditData(c) }} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-secondary">
                <Edit size={14} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg p-3" style={{
            background: daysLeft !== null && daysLeft <= 30 ? 'hsl(0 84% 60% / 0.1)'
              : daysLeft !== null && daysLeft <= 90 ? 'hsl(38 92% 50% / 0.1)' : 'hsl(var(--surface-2))',
            border: `1px solid ${daysLeft !== null && daysLeft <= 30 ? 'hsl(0 84% 60% / 0.3)'
              : daysLeft !== null && daysLeft <= 90 ? 'hsl(38 92% 50% / 0.3)' : 'hsl(var(--border))'}`,
          }}>
            <div className="label mb-1"><Clock size={12} className="inline mr-1" />Expiry Reminder</div>
            <div className="text-sm font-semibold" style={{
              color: daysLeft !== null && daysLeft <= 30 ? 'hsl(var(--danger))'
                : daysLeft !== null && daysLeft <= 90 ? 'hsl(var(--warning))' : 'hsl(var(--foreground))',
            }}>
              {daysLeft !== null ? (daysLeft >= 0 ? `${daysLeft} days left` : 'Expired') : '—'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--foreground-muted))' }}>{formatDate(c.expiry_reminder_date)}</div>
          </div>

          <ValueCard label="Contract Value" value={displayContractValue} currency={c.currency} color="hsl(var(--primary))" />
          <ValueCard label="Final Cost" value={c.final_cost} currency={c.currency} />
          <ValueCard
            label="Final Budget"
            value={c.final_budget}
            currency={c.currency}
            color={c.final_cost != null && c.final_budget != null && c.final_cost > c.final_budget ? 'hsl(var(--danger))' : 'hsl(var(--success))'}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'hsl(var(--surface))' }}>
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center"
            style={activeTab === tab.key ? {
              background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))',
              border: '1px solid hsl(var(--primary) / 0.3)',
            } : { color: 'hsl(var(--foreground-muted))', border: '1px solid transparent' }}>
            <tab.icon size={13} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="fade-in">
        {activeTab === 'overview' && <OverviewTab contract={c} editing={editing} editData={editData} setEditData={setEditData} />}
        {activeTab === 'financial' && <FinancialTab contractId={c.id} currency={c.currency} onSaved={loadContract} />}
        {activeTab === 'payments' && <ProgressPaymentTab contractId={c.id} currency={c.currency} />}
        {activeTab === 'milestones' && <MilestonesTab contractId={c.id} />}
        {activeTab === 'documents' && <DocumentsTab contractId={c.id} />}
        {activeTab === 'risks' && <RisksTab contractId={c.id} />}
        {activeTab === 'deliverables' && <DeliverablesTab contractId={c.id} />}
      </div>
    </div>
  )
}

function OverviewTab({ contract: c, editing, editData, setEditData }: {
  contract: Contract
  editing: boolean
  editData: Partial<Contract>
  setEditData: (fn: (d: Partial<Contract>) => Partial<Contract>) => void
}) {
  const field = (key: keyof Contract) => editing ? (
    <input
      type={key.includes('date') ? 'date' : 'text'}
      value={(editData[key] as string) ?? ''}
      onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.value || null }))}
      className="input-base py-1.5 text-sm"
    />
  ) : (
    <div className="text-sm" style={{ color: (c[key] as string) ? 'hsl(var(--foreground))' : 'hsl(var(--foreground-muted))' }}>
      {(c[key] as string) || '—'}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2 border-b" style={{ color: 'hsl(var(--primary))', borderColor: 'hsl(var(--border))' }}>
          Contract Information
        </h3>
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          <div><div className="label">Requisition No</div>{field('requisition_no')}</div>
          <div><div className="label">Date Request</div>{editing ? field('date_request') : <div className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{formatDate(c.date_request)}</div>}</div>
          <div><div className="label">Date Entry</div><div className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{formatDate(c.date_entry)}</div></div>
          <div><div className="label">Start Date</div>{editing ? field('start_date') : <div className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{formatDate(c.start_date)}</div>}</div>
          <div><div className="label">End Date</div>{editing ? field('end_date') : <div className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{formatDate(c.end_date)}</div>}</div>
          <div><div className="label">Expiry Reminder</div>{editing ? field('expiry_reminder_date') : <div className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{formatDate(c.expiry_reminder_date)}</div>}</div>
          <div><div className="label">Location of Work</div>{field('location_of_work')}</div>
          <div><div className="label">Used of Contract</div>{field('used_of_contract')}</div>
          <div>
            <div className="label">Currency</div>
            {editing ? (
              <select className="input-base py-1.5 text-sm" value={editData.currency || c.currency} onChange={(e) => setEditData((d) => ({ ...d, currency: e.target.value }))}>
                {CURRENCIES.map((cur) => <option key={cur} value={cur}>{cur}</option>)}
              </select>
            ) : (
              <div className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{c.currency}</div>
            )}
          </div>
        </div>
        {(editing || c.contract_brief_summary) && (
          <div className="mt-4">
            <div className="label">Contract Brief Summary</div>
            {editing ? (
              <textarea rows={3} className="input-base resize-none text-sm"
                value={editData.contract_brief_summary || ''}
                onChange={(e) => setEditData((d) => ({ ...d, contract_brief_summary: e.target.value || null }))}
              />
            ) : (
              <p className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{c.contract_brief_summary}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2 border-b" style={{ color: 'hsl(var(--success))', borderColor: 'hsl(var(--border))' }}>Our Company</h3>
          <div className="space-y-3">
            <InfoField label="Approving Person" value={c.company_approving_person} editing={editing} editKey="company_approving_person" editData={editData} setEditData={setEditData} />
            <InfoField label="Representative" value={c.company_representative} editing={editing} editKey="company_representative" editData={editData} setEditData={setEditData} />
            <InfoField label="Phone" value={c.company_rep_phone} editing={editing} editKey="company_rep_phone" editData={editData} setEditData={setEditData} />
            <InfoField label="E-mail" value={c.company_rep_email} editing={editing} editKey="company_rep_email" editData={editData} setEditData={setEditData} />
            <InfoField label="End User Name" value={c.end_user_name} editing={editing} editKey="end_user_name" editData={editData} setEditData={setEditData} />
            <InfoField label="Department" value={c.end_user_department} editing={editing} editKey="end_user_department" editData={editData} setEditData={setEditData} />
            <InfoField label="Contract Manager" value={c.contract_manager} editing={editing} editKey="contract_manager" editData={editData} setEditData={setEditData} />
            <InfoField label="Approved By" value={c.approved_by} editing={editing} editKey="approved_by" editData={editData} setEditData={setEditData} />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2 border-b" style={{ color: 'hsl(var(--info))', borderColor: 'hsl(var(--border))' }}>Counterpart</h3>
          <div className="space-y-3">
            <InfoField label="Name" value={c.counterpart_name} editing={editing} editKey="counterpart_name" editData={editData} setEditData={setEditData} />
            <InfoField label="Counterpart ID" value={c.counterpart_id} editing={editing} editKey="counterpart_id" editData={editData} setEditData={setEditData} />
            <InfoField label="Address" value={c.address} editing={editing} editKey="address" editData={editData} setEditData={setEditData} />
            <InfoField label="Phone" value={c.phone} editing={editing} editKey="phone" editData={editData} setEditData={setEditData} />
            <InfoField label="E-mail" value={c.email} editing={editing} editKey="email" editData={editData} setEditData={setEditData} />
            <InfoField label="Approving Person" value={c.counterpart_approving_person} editing={editing} editKey="counterpart_approving_person" editData={editData} setEditData={setEditData} />
            <InfoField label="Representative" value={c.counterpart_representative} editing={editing} editKey="counterpart_representative" editData={editData} setEditData={setEditData} />
            <InfoField label="Rep Phone" value={c.counterpart_rep_phone} editing={editing} editKey="counterpart_rep_phone" editData={editData} setEditData={setEditData} />
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value, editing, editKey, editData, setEditData }: {
  label: string
  value: string | null | undefined
  editing: boolean
  editKey: keyof Contract
  editData: Partial<Contract>
  setEditData: (fn: (d: Partial<Contract>) => Partial<Contract>) => void
}) {
  return (
    <div>
      <div className="label">{label}</div>
      {editing ? (
        <input
          type="text"
          value={(editData[editKey] as string) ?? ''}
          onChange={(e) => setEditData((d) => ({ ...d, [editKey]: e.target.value || null }))}
          className="input-base py-1.5 text-sm"
          placeholder={label}
        />
      ) : (
        <div className="text-sm" style={{ color: value ? 'hsl(var(--foreground))' : 'hsl(var(--foreground-muted))' }}>
          {value || '—'}
        </div>
      )}
    </div>
  )
}
