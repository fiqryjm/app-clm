'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { FolderKanban, Search, Filter, FileText, ArrowRight, RefreshCw, Folder, Building2, Calendar, FileCode, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Contract, ContractStatus } from '@/types/database'

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ACTIVE: 'status-active', REQUEST: 'status-request', REJECT: 'status-reject',
    BIDDING: 'status-bidding', DRAFT: 'status-draft', EXPIRED: 'status-expired',
    TERMINATED: 'status-terminated',
  }
  const label = status === 'ACTIVE' ? 'Active Contract' : status
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls[status] || 'status-draft'}`}>{label}</span>
}

export default function ContractRepositoryPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const loadData = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('contracts').select('*').order('created_at', { ascending: false })

    if (typeFilter) query = query.eq('contract_type', typeFilter)
    if (statusFilter) query = query.eq('status', statusFilter)
    if (search) query = query.or(`contract_title.ilike.%${search}%,counterpart_name.ilike.%${search}%,contract_id.ilike.%${search}%`)

    const { data } = await query
    if (data) setContracts(data)
    setLoading(false)
  }, [search, typeFilter, statusFilter])

  useEffect(() => {
    const timer = setTimeout(loadData, 250)
    return () => clearTimeout(timer)
  }, [loadData])

  const salesCount = contracts.filter((c) => c.contract_type === 'SALES').length
  const supplierCount = contracts.filter((c) => c.contract_type === 'SUPPLIER').length
  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length

  return (
    <div className="fade-in space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'hsl(var(--foreground))' }}>
            <FolderKanban size={24} className="text-sky-400" />
            Contract Repository
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--foreground-muted))' }}>
            Pusat Penyimpanan & Digital Repository Seluruh Kontrak Perusahaan
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary text-xs py-2 px-3">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="label">Total Repository</span>
            <Folder size={16} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{loading ? '...' : contracts.length}</div>
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--foreground-muted))' }}>Archived contracts</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="label">Active Contracts</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{loading ? '...' : activeCount}</div>
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--foreground-muted))' }}>Currently in force</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="label">Sales Contracts</span>
            <Building2 size={16} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400">{loading ? '...' : salesCount}</div>
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--foreground-muted))' }}>Revenue generating</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="label">Supplier Contracts</span>
            <FileCode size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">{loading ? '...' : supplierCount}</div>
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--foreground-muted))' }}>Vendor & procurement</div>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-64">
            <div className="flex items-center gap-2 flex-1 input-base">
              <Search size={15} style={{ color: 'hsl(var(--foreground-muted))' }} />
              <input
                type="text"
                placeholder="Search repository by title, counterpart, ID..."
                className="bg-transparent border-0 p-0 text-sm flex-1 outline-none"
                style={{ color: 'hsl(var(--foreground))' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="input-base w-auto text-xs py-2"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="SALES">Sales</option>
              <option value="SUPPLIER">Supplier</option>
            </select>

            <select
              className="input-base w-auto text-xs py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="REQUEST">REQUEST</option>
              <option value="DRAFT">DRAFT</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded font-medium transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded font-medium transition-all ${viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="card p-12 text-center text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>
          Loading contract repository...
        </div>
      ) : contracts.length === 0 ? (
        <div className="card p-12 text-center text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>
          No contracts found in repository matching criteria.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contracts.map((c) => (
            <div key={c.id} className="card p-5 hover:border-slate-600 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                    {c.contract_id}
                  </span>
                  <StatusBadge status={c.status} />
                </div>

                <h3 className="font-semibold text-base line-clamp-1 mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                  {c.contract_title}
                </h3>

                <p className="text-xs flex items-center gap-1.5 mb-3" style={{ color: 'hsl(var(--foreground-muted))' }}>
                  <Building2 size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{c.counterpart_name}</span>
                </p>

                <div className="space-y-1.5 text-xs pt-3 border-t border-white/5">
                  <div className="flex justify-between">
                    <span style={{ color: 'hsl(var(--foreground-muted))' }}>Type:</span>
                    <span className="font-medium text-slate-300">{c.contract_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'hsl(var(--foreground-muted))' }}>Start Date:</span>
                    <span className="font-medium text-slate-300">{formatDate(c.start_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'hsl(var(--foreground-muted))' }}>Expiry Reminder:</span>
                    <span className="font-medium text-slate-300">{formatDate(c.expiry_reminder_date)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span style={{ color: 'hsl(var(--foreground-muted))' }}>Contract Value:</span>
                    <span className="font-bold text-sky-400">
                      {c.total_contract_value ? formatCurrency(c.total_contract_value, c.currency) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Link
                  href={`/contracts/${c.id}?tab=documents`}
                  className="btn-secondary flex-1 justify-center text-xs py-2"
                >
                  <FolderKanban size={14} /> Open Files
                </Link>
                <Link
                  href={`/contracts/${c.id}?edit=true`}
                  className="btn-secondary text-xs py-2 px-3 text-amber-400 hover:text-amber-300"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract ID</th>
                  <th>Title</th>
                  <th>Counterpart</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Expiry Date</th>
                  <th className="text-right">Value</th>
                  <th className="w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono text-xs font-semibold text-sky-400">{c.contract_id}</td>
                    <td className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>{c.contract_title}</td>
                    <td className="text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>{c.counterpart_name}</td>
                    <td className="text-xs font-semibold">{c.contract_type}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="text-xs">{formatDate(c.start_date)}</td>
                    <td className="text-xs">{formatDate(c.expiry_reminder_date)}</td>
                    <td className="text-right font-medium text-xs">
                      {c.total_contract_value ? formatCurrency(c.total_contract_value, c.currency) : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link href={`/contracts/${c.id}?tab=documents`} className="text-xs text-sky-400 hover:underline">
                          Open
                        </Link>
                        <Link href={`/contracts/${c.id}?edit=true`} className="text-xs text-amber-400 hover:underline">
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
