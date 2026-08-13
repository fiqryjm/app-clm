'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { FileCheck, Search, Filter, FileText, ArrowRight, Edit, RefreshCw, Clock, CheckCircle2, Folder, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency, formatDate, getDaysUntilExpiry, getExpiryStatus } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Contract } from '@/types/database'

function ExpiryBadge({ endDate }: { endDate: string | null }) {
  if (!endDate) return <span className="text-slate-500 text-xs">—</span>
  const days = getDaysUntilExpiry(endDate)
  if (days === null) return <span className="text-slate-500 text-xs">—</span>
  const status = getExpiryStatus(days)

  if (days < 0) {
    return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">Expired ({Math.abs(days)}d ago)</span>
  }
  if (status === 'critical') {
    return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">{days}d left</span>
  }
  if (status === 'warning') {
    return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">{days}d left</span>
  }
  return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">{days}d left</span>
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

export default function ActiveContractPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeTab, setTypeTab] = useState<string>('ALL')

  const loadActiveContracts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })

    setContracts(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadActiveContracts()
  }, [loadActiveContracts])

  const totalActive = contracts.length
  const salesCount = contracts.filter((c) => c.contract_type === 'SALES').length
  const supplierCount = contracts.filter((c) => c.contract_type === 'SUPPLIER').length

  const expiringSoonCount = contracts.filter((c) => {
    if (!c.end_date) return false
    const days = getDaysUntilExpiry(c.end_date)
    return days !== null && days >= 0 && days <= 60
  }).length

  const totalValue = contracts.reduce((sum, c) => sum + (c.initial_contract_value || c.owner_estimate || 0), 0)

  const filtered = contracts.filter((c) => {
    const matchesSearch =
      search === '' ||
      c.contract_id.toLowerCase().includes(search.toLowerCase()) ||
      c.contract_title.toLowerCase().includes(search.toLowerCase()) ||
      (c.counterpart_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.requisition_no ?? '').toLowerCase().includes(search.toLowerCase())

    const matchesType = typeTab === 'ALL' || c.contract_type === typeTab
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileCheck size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
              Active Contract
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Daftar seluruh kontrak yang sedang berjalan dan aktif (Active Contracts)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={loadActiveContracts} className="btn-secondary py-2 text-xs" title="Refresh data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div
          onClick={() => setTypeTab('ALL')}
          className={`card p-4 cursor-pointer transition-all ${typeTab === 'ALL' ? 'ring-2 ring-emerald-500' : 'hover:border-slate-600'}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <span>Total Active Contracts</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalActive}</div>
          <div className="text-[11px] text-emerald-400/70 mt-1">Currently binding & active</div>
        </div>

        <div
          onClick={() => setTypeTab('SALES')}
          className={`card p-4 cursor-pointer transition-all ${typeTab === 'SALES' ? 'ring-2 ring-sky-500' : 'hover:border-slate-600'}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
            <span>Sales Contracts</span>
            <TrendingUp size={16} />
          </div>
          <div className="text-2xl font-bold text-sky-300">{salesCount}</div>
          <div className="text-[11px] text-sky-400/70 mt-1">Customer & Client contracts</div>
        </div>

        <div
          onClick={() => setTypeTab('SUPPLIER')}
          className={`card p-4 cursor-pointer transition-all ${typeTab === 'SUPPLIER' ? 'ring-2 ring-indigo-500' : 'hover:border-slate-600'}`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
            <span>Supplier Contracts</span>
            <FileText size={16} />
          </div>
          <div className="text-2xl font-bold text-indigo-300">{supplierCount}</div>
          <div className="text-[11px] text-indigo-400/70 mt-1">Procurement & Vendors</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <span>Expiring Soon (&lt;60d)</span>
            <Clock size={16} />
          </div>
          <div className="text-2xl font-bold text-amber-300">{expiringSoonCount}</div>
          <div className="text-[11px] text-amber-400/70 mt-1">Requires renewal action</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/30 border border-white/5">
          {[
            { id: 'ALL', label: `All Active (${totalActive})` },
            { id: 'SALES', label: `Sales (${salesCount})` },
            { id: 'SUPPLIER', label: `Supplier (${supplierCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                typeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
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
            placeholder="Search active contract ID, title, or counterpart..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9 py-1.5 text-xs w-full"
          />
        </div>
      </div>

      {/* Active Contracts Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading active contracts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm space-y-2">
            <FileCheck size={36} className="mx-auto text-slate-600 mb-2" />
            <p>No active contracts found matching your search.</p>
            {typeTab !== 'ALL' && (
              <button
                onClick={() => setTypeTab('ALL')}
                className="text-xs text-sky-400 hover:underline"
              >
                Clear type filter
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider" style={{ borderColor: 'hsl(var(--border))' }}>
                <th className="py-3 px-4">Contract ID</th>
                <th className="py-3 px-4">Contract Title</th>
                <th className="py-3 px-4">Counterpart</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Period (Start — End)</th>
                <th className="py-3 px-4">Expiry Status</th>
                <th className="py-3 px-4 text-right">Contract Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                    {c.contract_id}
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
                    {formatDate(c.start_date)} — {formatDate(c.end_date)}
                  </td>
                  <td className="py-3.5 px-4">
                    <ExpiryBadge endDate={c.end_date} />
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                    {c.initial_contract_value
                      ? formatCurrency(c.initial_contract_value, c.currency)
                      : c.owner_estimate
                      ? formatCurrency(c.owner_estimate, c.currency)
                      : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/contracts/${c.id}?tab=documents`}
                        className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-sky-400 transition-colors"
                        title="Open Documents"
                      >
                        <Folder size={14} />
                      </Link>
                      <Link
                        href={`/contracts/${c.id}?edit=true`}
                        className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-sky-400 transition-colors"
                        title="Edit Contract"
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
