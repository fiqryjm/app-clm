'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ClipboardList, Search, Filter, FileText, ArrowRight, Edit, RefreshCw, AlertCircle, Clock, CheckCircle2, XCircle, Gavel } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Contract, ContractStatus } from '@/types/database'

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ACTIVE: 'status-active',
    REQUEST: 'status-request',
    REJECT: 'status-reject',
    BIDDING: 'status-bidding',
    DRAFT: 'status-draft',
    EXPIRED: 'status-expired',
    TERMINATED: 'status-terminated',
  }
  const label = status === 'ACTIVE' ? 'Active Contract' : status
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls[status] || 'status-draft'}`}>{label}</span>
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{
      background: type === 'SALES' ? 'hsl(199 89% 48% / 0.15)' : 'hsl(239 84% 67% / 0.15)',
      color: type === 'SALES' ? 'hsl(199 89% 60%)' : 'hsl(239 84% 75%)',
    }}>
      {type === 'SALES' ? '↗ Sales' : '↙ Supplier'}
    </span>
  )
}

export default function RequisitionListPage() {
  const [requisitions, setRequisitions] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<string>('ALL')

  const loadRequisitions = useCallback(async () => {
    setLoading(true)
    // Fetch all contracts that are NOT Active Contracts
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .neq('status', 'ACTIVE')
      .order('created_at', { ascending: false })

    setRequisitions(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadRequisitions()
  }, [loadRequisitions])

  const totalCount = requisitions.length
  const requestCount = requisitions.filter((c) => c.status === 'REQUEST').length
  const biddingCount = requisitions.filter((c) => c.status === 'BIDDING').length
  const rejectCount = requisitions.filter((c) => c.status === 'REJECT').length
  const draftCount = requisitions.filter((c) => c.status === 'DRAFT').length

  const filtered = requisitions.filter((c) => {
    const matchesSearch =
      search === '' ||
      c.contract_id.toLowerCase().includes(search.toLowerCase()) ||
      c.contract_title.toLowerCase().includes(search.toLowerCase()) ||
      (c.counterpart_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.requisition_no ?? '').toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusTab === 'ALL' || c.status === statusTab
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={22} className="text-sky-400" />
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
              Requisition List
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Daftar seluruh pengajuan kontrak yang belum menjadi Active Contract
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={loadRequisitions} className="btn-secondary py-2 text-xs" title="Refresh data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link href="/contracts/new" className="btn-primary py-2 text-xs">
            + New Request
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div
          onClick={() => setStatusTab('ALL')}
          className={`card p-4 cursor-pointer transition-all ${statusTab === 'ALL' ? 'ring-2 ring-sky-500' : 'hover:border-slate-600'}`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Total Requisitions
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending approval & bidding</div>
        </div>

        <div
          onClick={() => setStatusTab('REQUEST')}
          className={`card p-4 cursor-pointer transition-all ${statusTab === 'REQUEST' ? 'ring-2 ring-amber-500' : 'hover:border-slate-600'}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <span>Pending Requests</span>
            <Clock size={14} />
          </div>
          <div className="text-2xl font-bold text-amber-300">{requestCount}</div>
          <div className="text-[11px] text-amber-400/70 mt-1">Awaiting initial review</div>
        </div>

        <div
          onClick={() => setStatusTab('BIDDING')}
          className={`card p-4 cursor-pointer transition-all ${statusTab === 'BIDDING' ? 'ring-2 ring-purple-500' : 'hover:border-slate-600'}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <span>In Bidding</span>
            <Gavel size={14} />
          </div>
          <div className="text-2xl font-bold text-purple-300">{biddingCount}</div>
          <div className="text-[11px] text-purple-400/70 mt-1">Tender / negotiation phase</div>
        </div>

        <div
          onClick={() => setStatusTab('REJECT')}
          className={`card p-4 cursor-pointer transition-all ${statusTab === 'REJECT' ? 'ring-2 ring-rose-500' : 'hover:border-slate-600'}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
            <span>Rejected</span>
            <XCircle size={14} />
          </div>
          <div className="text-2xl font-bold text-rose-300">{rejectCount}</div>
          <div className="text-[11px] text-rose-400/70 mt-1">Not approved</div>
        </div>

        <div
          onClick={() => setStatusTab('DRAFT')}
          className={`card p-4 cursor-pointer transition-all ${statusTab === 'DRAFT' ? 'ring-2 ring-sky-500' : 'hover:border-slate-600'}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
            <span>Drafts</span>
            <FileText size={14} />
          </div>
          <div className="text-2xl font-bold text-sky-300">{draftCount}</div>
          <div className="text-[11px] text-sky-400/70 mt-1">Under preparation</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/30 border border-white/5">
          {[
            { id: 'ALL', label: `All (${totalCount})` },
            { id: 'REQUEST', label: `Request (${requestCount})` },
            { id: 'BIDDING', label: `Bidding (${biddingCount})` },
            { id: 'REJECT', label: `Reject (${rejectCount})` },
            { id: 'DRAFT', label: `Draft (${draftCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                statusTab === tab.id
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search requisition no, contract ID, title, or counterpart..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9 py-1.5 text-xs w-full"
          />
        </div>
      </div>

      {/* Requisition Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading requisitions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm space-y-2">
            <ClipboardList size={36} className="mx-auto text-slate-600 mb-2" />
            <p>No requisitions found matching your filter.</p>
            {statusTab !== 'ALL' && (
              <button
                onClick={() => setStatusTab('ALL')}
                className="text-xs text-sky-400 hover:underline"
              >
                Clear status filter
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider" style={{ borderColor: 'hsl(var(--border))' }}>
                <th className="py-3 px-4">Contract / Req No</th>
                <th className="py-3 px-4">Contract Title</th>
                <th className="py-3 px-4">Counterpart</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date Requested</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Estimate / Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                    <div>{c.contract_id}</div>
                    {c.requisition_no && (
                      <div className="text-[10px] text-slate-400">Req: {c.requisition_no}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-100 max-w-xs truncate">
                    <Link href={`/contracts/${c.id}`} className="hover:text-sky-400 transition-colors">
                      {c.contract_title}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {c.counterpart_name || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <TypeBadge type={c.contract_type} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {formatDate(c.date_request)}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200">
                    {c.owner_estimate
                      ? formatCurrency(c.owner_estimate, c.currency)
                      : c.initial_contract_value
                      ? formatCurrency(c.initial_contract_value, c.currency)
                      : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/contracts/${c.id}?edit=true`}
                        className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-sky-400 transition-colors"
                        title="Edit Requisition"
                      >
                        <Edit size={14} />
                      </Link>
                      <Link
                        href={`/contracts/${c.id}`}
                        className="btn-secondary py-1 px-2.5 text-[11px] flex items-center gap-1"
                      >
                        View <ArrowRight size={12} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
