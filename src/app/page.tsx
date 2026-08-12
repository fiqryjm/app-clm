'use client'

import { useEffect, useState } from 'react'
import {
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate, getDaysUntilExpiry, getExpiryStatus } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Contract } from '@/types/database'

interface Stats {
  totalContracts: number
  activeContracts: number
  requestPending: number
  expiringIn30: number
  totalValue: number
  currency: string
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ACTIVE: 'status-active',
    REQUEST: 'status-request',
    DRAFT: 'status-draft',
    EXPIRED: 'status-expired',
    TERMINATED: 'status-terminated',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls[status] || 'status-draft'}`}>
      {status}
    </span>
  )
}

function KpiCard({
  title, value, sub, icon: Icon, color, href, loading,
}: {
  title: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
  href?: string
  loading?: boolean
}) {
  const content = (
    <div className="card p-5 hover:border-white/10 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: color + '22' }}>
          <Icon size={20} style={{ color }} />
        </div>
        {href && (
          <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(var(--foreground-muted))' }} />
        )}
      </div>
      {loading ? (
        <div className="h-8 w-16 rounded animate-pulse mb-1" style={{ background: 'hsl(var(--surface-3))' }} />
      ) : (
        <div className="text-2xl font-bold mb-0.5" style={{ color: 'hsl(var(--foreground))' }}>{value}</div>
      )}
      <div className="text-sm font-medium mb-0.5" style={{ color: 'hsl(var(--foreground))' }}>{title}</div>
      {sub && <div className="text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>{sub}</div>}
    </div>
  )
  return href ? <Link href={href} className="block">{content}</Link> : content
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ totalContracts: 0, activeContracts: 0, requestPending: 0, expiringIn30: 0, totalValue: 0, currency: 'IDR' })
  const [expiring, setExpiring] = useState<Contract[]>([])
  const [recent, setRecent] = useState<Contract[]>([])
  const [statusDist, setStatusDist] = useState<{ label: string; count: number; color: string; pct: number }[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: rawData } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false })

      const all = (rawData as Contract[]) ?? []

      const today = new Date()
      const in30 = new Date()
      in30.setDate(in30.getDate() + 30)

      const active = all.filter((c: Contract) => c.status === 'ACTIVE')
      const requests = all.filter((c: Contract) => c.status === 'REQUEST')
      const exp30 = all.filter((c: Contract) => {
        if (!c.expiry_reminder_date) return false
        const d = new Date(c.expiry_reminder_date)
        return d >= today && d <= in30
      })
      const totalVal = active.reduce((sum: number, c: Contract) => sum + (c.total_contract_value ?? 0), 0)

      setStats({
        totalContracts: all.length,
        activeContracts: active.length,
        requestPending: requests.length,
        expiringIn30: exp30.length,
        totalValue: totalVal,
        currency: 'IDR',
      })

      // Expiring soon (next 90 days, sorted by date)
      const exp90 = all
        .filter((c: Contract) => {
          if (!c.expiry_reminder_date) return false
          const d = new Date(c.expiry_reminder_date)
          const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return diff >= -7 && diff <= 90
        })
        .sort((a: Contract, b: Contract) => new Date(a.expiry_reminder_date!).getTime() - new Date(b.expiry_reminder_date!).getTime())
        .slice(0, 5)
      setExpiring(exp90)

      // Recent
      setRecent(all.slice(0, 5))

      // Status distribution
      const statuses = ['ACTIVE', 'REQUEST', 'DRAFT', 'EXPIRED', 'TERMINATED']
      const colors = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--primary))', 'hsl(var(--danger))', 'hsl(var(--foreground-muted))']
      const dist = statuses.map((s, i) => {
        const count = all.filter((c: Contract) => c.status === s).length
        return {
          label: s,
          count,
          color: colors[i],
          pct: all.length > 0 ? Math.round((count / all.length) * 100) : 0,
        }
      })
      setStatusDist(dist)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="fade-in space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--foreground-muted))' }}>
            Contract portfolio overview and key metrics
          </p>
        </div>
        <Link href="/contracts/new" className="btn-primary">
          <Plus size={16} />
          New Contract Request
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Contracts" value={stats.totalContracts} sub="All time" icon={FileText} color="hsl(225, 100%, 60%)" href="/contracts" loading={loading} />
        <KpiCard title="Active Contracts" value={stats.activeContracts} sub="Currently running" icon={CheckCircle2} color="hsl(142, 71%, 45%)" href="/contracts?status=ACTIVE" loading={loading} />
        <KpiCard title="Pending Requests" value={stats.requestPending} sub="Awaiting processing" icon={Clock} color="hsl(38, 92%, 50%)" href="/contracts?status=REQUEST" loading={loading} />
        <KpiCard title="Expiring in 30 Days" value={stats.expiringIn30} sub="Requires attention" icon={AlertTriangle} color="hsl(0, 84%, 60%)" loading={loading} />
      </div>

      {/* Total Portfolio Value */}
      <div className="rounded-xl p-5 border" style={{ background: 'linear-gradient(135deg, hsl(225 100% 60% / 0.1), hsl(239 84% 67% / 0.05))', borderColor: 'hsl(225 100% 60% / 0.2)' }}>
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp size={18} style={{ color: 'hsl(var(--primary))' }} />
          <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground-muted))' }}>Total Active Portfolio Value (IDR)</span>
        </div>
        {loading ? (
          <div className="h-10 w-48 rounded animate-pulse" style={{ background: 'hsl(var(--surface-3))' }} />
        ) : (
          <div className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {formatCurrency(stats.totalValue, stats.currency)}
          </div>
        )}
        <p className="text-xs mt-1" style={{ color: 'hsl(var(--foreground-muted))' }}>Combined value across all active contracts</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Soon */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: 'hsl(var(--danger))' }} />
              <h2 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>Expiring Soon</h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full status-expired">Needs Attention</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded animate-pulse" style={{ background: 'hsl(var(--surface-2))' }} />
              ))}
            </div>
          ) : expiring.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>
              No contracts expiring in the next 90 days 🎉
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
              {expiring.map((c) => {
                const days = getDaysUntilExpiry(c.expiry_reminder_date)
                const status = getExpiryStatus(days)
                const color = status === 'critical' ? 'hsl(var(--danger))' : status === 'warning' ? 'hsl(var(--warning))' : 'hsl(var(--success))'
                return (
                  <Link key={c.id} href={`/contracts/${c.id}`} className="flex items-start justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{c.contract_title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--foreground-muted))' }}>
                        {c.counterpart_name} · {c.contract_id}
                      </div>
                    </div>
                    <div className="ml-3 text-right flex-shrink-0">
                      <div className="text-sm font-semibold" style={{ color }}>
                        {days !== null && days >= 0 ? `${days}d left` : 'Expired'}
                      </div>
                      <div className="text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>{formatDate(c.expiry_reminder_date)}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Contracts */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-2">
              <FileText size={16} style={{ color: 'hsl(var(--primary))' }} />
              <h2 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>Recent Contracts</h2>
            </div>
            <Link href="/contracts" className="text-xs" style={{ color: 'hsl(var(--primary))' }}>View all →</Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded animate-pulse" style={{ background: 'hsl(var(--surface-2))' }} />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: 'hsl(var(--foreground-muted))' }}>
              No contracts yet. <Link href="/contracts/new" style={{ color: 'hsl(var(--primary))' }}>Create your first →</Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
              {recent.map((c) => (
                <Link key={c.id} href={`/contracts/${c.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{c.contract_title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>{c.contract_id}</span>
                      <span className="text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>·</span>
                      <span className="text-xs" style={{ color: 'hsl(var(--foreground-muted))' }}>{c.counterpart_name}</span>
                    </div>
                  </div>
                  <div className="ml-3 flex-shrink-0"><StatusBadge status={c.status} /></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Distribution */}
      {!loading && statusDist.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'hsl(var(--foreground))' }}>Contract Status Distribution</h2>
          <div className="grid grid-cols-5 gap-3">
            {statusDist.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-bold mb-1" style={{ color: s.color }}>{s.count}</div>
                <div className="text-xs mb-2" style={{ color: 'hsl(var(--foreground-muted))' }}>{s.label}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && stats.totalContracts === 0 && (
        <div className="card p-12 text-center">
          <FileText size={40} className="mx-auto mb-4" style={{ color: 'hsl(var(--foreground-muted))' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>No Contracts Yet</h3>
          <p className="text-sm mb-6" style={{ color: 'hsl(var(--foreground-muted))' }}>
            Get started by creating your first contract request.
          </p>
          <Link href="/contracts/new" className="btn-primary inline-flex">
            <Plus size={16} />
            Create First Contract
          </Link>
        </div>
      )}
    </div>
  )
}
