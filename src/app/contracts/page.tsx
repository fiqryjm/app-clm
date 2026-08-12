'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { FileText, Plus, Search, Filter, RefreshCw } from 'lucide-react'
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

const STATUS_OPTIONS: ContractStatus[] = ['REQUEST', 'REJECT', 'BIDDING', 'DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const loadContracts = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter) query = query.eq('status', statusFilter as ContractStatus)
    if (typeFilter) query = query.eq('contract_type', typeFilter as 'SALES' | 'SUPPLIER')
    if (search) query = query.or(`contract_title.ilike.%${search}%,counterpart_name.ilike.%${search}%,contract_id.ilike.%${search}%`)

    const { data, error } = await query
    if (!error && data) setContracts(data)
    setLoading(false)
  }, [search, statusFilter, typeFilter])

  useEffect(() => {
    const timer = setTimeout(loadContracts, 300)
    return () => clearTimeout(timer)
  }, [loadContracts])

  return (
    <div className="fade-in space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Contracts</h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--foreground-muted))' }}>
            {loading ? 'Loading...' : `${contracts.length} contract${contracts.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <Link href="/contracts/new" className="btn-primary">
          <Plus size={16} />
          New Contract Request
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48 input-base">
            <Search size={15} style={{ color: 'hsl(var(--foreground-muted))', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by title, counterpart, contract ID..."
              className="bg-transparent border-0 p-0 text-sm flex-1 outline-none"
              style={{ color: 'hsl(var(--foreground))' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>✕</button>
            )}
          </div>

          <div className="w-px h-5" style={{ background: 'hsl(var(--border))' }} />

          <select className="input-base w-auto text-sm py-1.5" style={{ minWidth: 140 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select className="input-base w-auto text-sm py-1.5" style={{ minWidth: 140 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="SALES">Sales</option>
            <option value="SUPPLIER">Supplier</option>
          </select>

          {(search || statusFilter || typeFilter) && (
            <button className="btn-secondary py-1.5 text-xs" onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter('') }}>
              <Filter size={13} />
              Clear
            </button>
          )}

          <button className="btn-secondary py-1.5" onClick={loadContracts} title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contract ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Counterpart</th>
                <th className="text-right">Value</th>
                <th>Period</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j}>
                        <div className="h-4 rounded animate-pulse" style={{ background: 'hsl(var(--surface-3))', width: j === 1 ? '80%' : '60%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16" style={{ color: 'hsl(var(--foreground-muted))' }}>
                    <FileText size={32} className="mx-auto mb-3 opacity-40" />
                    <div className="text-sm">No contracts found</div>
                    {(search || statusFilter || typeFilter) && (
                      <button
                        className="text-xs mt-2"
                        style={{ color: 'hsl(var(--primary))' }}
                        onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter('') }}
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-mono text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>
                        {c.contract_id}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-sm max-w-xs truncate" style={{ color: 'hsl(var(--foreground))' }}>
                        {c.contract_title}
                      </div>
                      {c.cost_center && (
                        <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--foreground-muted))' }}>
                          {c.cost_center}
                        </div>
                      )}
                    </td>
                    <td><TypeBadge type={c.contract_type} /></td>
                    <td>
                      <div className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                        {c.counterpart_name || '—'}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="text-sm font-medium tabular-nums" style={{ color: 'hsl(var(--foreground))' }}>
                        {c.total_contract_value ? formatCurrency(c.total_contract_value, c.currency) : '—'}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>{formatDate(c.start_date)}</div>
                      {c.end_date && (
                        <div className="text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>→ {formatDate(c.end_date)}</div>
                      )}
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Link href={`/contracts/${c.id}`} className="text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>
                          View →
                        </Link>
                        <Link href={`/contracts/${c.id}?edit=true`} className="text-xs font-medium text-amber-400 hover:underline">
                          Edit
                        </Link>
                      </div>
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
