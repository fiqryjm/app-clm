'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Clock, Search, Filter, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, Calendar } from 'lucide-react'
import { formatCurrency, formatDate, getDaysUntilExpiry, getExpiryStatus } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Contract } from '@/types/database'

function ExpiryBadge({ days }: { days: number | null }) {
  if (days === null) {
    return <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">No Date</span>
  }
  if (days < 0) {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 w-fit"><AlertTriangle size={12} />Expired ({Math.abs(days)}d ago)</span>
  }
  if (days <= 30) {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1 w-fit"><AlertTriangle size={12} />Critical ({days} days left)</span>
  }
  if (days <= 90) {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit"><Clock size={12} />Warning ({days} days left)</span>
  }
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit"><CheckCircle2 size={12} />Safe ({days} days left)</span>
}

export default function ExpiryReportPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<'ALL' | 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'SAFE'>('ALL')

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .not('expiry_reminder_date', 'is', null)
      .order('expiry_reminder_date', { ascending: true })

    if (data) setContracts(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const contractsWithDays = contracts.map((c) => ({
    ...c,
    daysLeft: getDaysUntilExpiry(c.expiry_reminder_date),
  }))

  const expiredCount = contractsWithDays.filter((c) => c.daysLeft !== null && c.daysLeft < 0).length
  const criticalCount = contractsWithDays.filter((c) => c.daysLeft !== null && c.daysLeft >= 0 && c.daysLeft <= 30).length
  const warningCount = contractsWithDays.filter((c) => c.daysLeft !== null && c.daysLeft > 30 && c.daysLeft <= 90).length
  const safeCount = contractsWithDays.filter((c) => c.daysLeft !== null && c.daysLeft > 90).length

  const filteredContracts = contractsWithDays.filter((c) => {
    const s = search.toLowerCase()
    const matchesSearch =
      !search ||
      (c.contract_title ?? '').toLowerCase().includes(s) ||
      (c.counterpart_name ?? '').toLowerCase().includes(s) ||
      (c.contract_id ?? '').toLowerCase().includes(s)

    if (!matchesSearch) return false

    if (filterTab === 'EXPIRED') return c.daysLeft !== null && c.daysLeft < 0
    if (filterTab === 'CRITICAL') return c.daysLeft !== null && c.daysLeft >= 0 && c.daysLeft <= 30
    if (filterTab === 'WARNING') return c.daysLeft !== null && c.daysLeft > 30 && c.daysLeft <= 90
    if (filterTab === 'SAFE') return c.daysLeft !== null && c.daysLeft > 90
    return true
  })

  return (
    <div className="fade-in space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'hsl(var(--foreground))' }}>
            <Clock size={24} className="text-amber-500" />
            Expiry Report
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--foreground-muted))' }}>
            Laporan & Pemantauan Masa Berlaku Kontrak (Expiry Monitoring & Expiration Audit)
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary text-xs py-2 px-3">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterTab('EXPIRED')}
          className={`card p-4 cursor-pointer transition-all border ${filterTab === 'EXPIRED' ? 'ring-2 ring-red-500/50' : ''}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="label">Expired</span>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-500">{loading ? '...' : expiredCount}</div>
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--foreground-muted))' }}>Past expiration date</div>
        </div>

        <div
          onClick={() => setFilterTab('CRITICAL')}
          className={`card p-4 cursor-pointer transition-all border ${filterTab === 'CRITICAL' ? 'ring-2 ring-orange-500/50' : ''}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="label">Critical (&le; 30 Days)</span>
            <Clock size={16} className="text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-400">{loading ? '...' : criticalCount}</div>
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--foreground-muted))' }}>Action required urgently</div>
        </div>

        <div
          onClick={() => setFilterTab('WARNING')}
          className={`card p-4 cursor-pointer transition-all border ${filterTab === 'WARNING' ? 'ring-2 ring-amber-500/50' : ''}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="label">Warning (31-90 Days)</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{loading ? '...' : warningCount}</div>
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--foreground-muted))' }}>Prepare renewal review</div>
        </div>

        <div
          onClick={() => setFilterTab('SAFE')}
          className={`card p-4 cursor-pointer transition-all border ${filterTab === 'SAFE' ? 'ring-2 ring-emerald-500/50' : ''}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="label">Safe (&gt; 90 Days)</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{loading ? '...' : safeCount}</div>
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--foreground-muted))' }}>Sufficient validity remaining</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-lg border border-white/5">
            {(['ALL', 'EXPIRED', 'CRITICAL', 'WARNING', 'SAFE'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  filterTab === tab
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'ALL' ? `All Monitored (${contracts.length})` : tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-sm input-base">
            <Search size={15} style={{ color: 'hsl(var(--foreground-muted))' }} />
            <input
              type="text"
              placeholder="Search contract, counterpart, ID..."
              className="bg-transparent border-0 p-0 text-sm flex-1 outline-none"
              style={{ color: 'hsl(var(--foreground))' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contract ID</th>
                <th>Contract Title</th>
                <th>Counterpart</th>
                <th>Type</th>
                <th>Expiry Date</th>
                <th>Expiry Status</th>
                <th className="text-right">Total Value</th>
                <th className="w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>
                    Loading expiry report...
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>
                    No expiry records found for selected filter.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                      {c.contract_id}
                    </td>
                    <td className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                      {c.contract_title}
                    </td>
                    <td className="text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>
                      {c.counterpart_name}
                    </td>
                    <td>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.contract_type === 'SALES' ? 'bg-sky-500/20 text-sky-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {c.contract_type}
                      </span>
                    </td>
                    <td className="text-xs tabular-nums" style={{ color: 'hsl(var(--foreground))' }}>
                      {formatDate(c.expiry_reminder_date)}
                    </td>
                    <td>
                      <ExpiryBadge days={c.daysLeft} />
                    </td>
                    <td className="text-right font-medium text-xs tabular-nums" style={{ color: 'hsl(var(--foreground))' }}>
                      {c.total_contract_value ? formatCurrency(c.total_contract_value, c.currency) : '—'}
                    </td>
                    <td>
                      <Link
                        href={`/contracts/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                      >
                        View <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
