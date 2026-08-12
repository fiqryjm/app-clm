import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined, currency: string = 'IDR'): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' ' + currency
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function generateContractId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 900) + 100
  return `CLM-${year}-${random}`
}

export function getDaysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getExpiryStatus(days: number | null): 'ok' | 'warning' | 'critical' | 'expired' {
  if (days === null) return 'ok'
  if (days < 0) return 'expired'
  if (days <= 30) return 'critical'
  if (days <= 90) return 'warning'
  return 'ok'
}

export function getRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 4) return 'low'
  if (score <= 9) return 'medium'
  if (score <= 16) return 'high'
  return 'critical'
}

export const CURRENCIES = [
  'IDR', 'USD', 'EUR', 'SGD', 'GBP', 'JPY', 'AUD', 'CNY', 'MYR'
]

export const CONTRACT_TYPES = [
  'Service Agreement',
  'Supply Agreement',
  'Maintenance Agreement',
  'Construction Agreement',
  'Consulting Agreement',
  'License Agreement',
  'Distribution Agreement',
  'Partnership Agreement',
  'Non-Disclosure Agreement',
  'Master Agreement',
  'Other',
]

export const CONTRACT_STATUSES = [
  'REQUEST',
  'REJECT',
  'BIDDING',
  'DRAFT',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
] as const

export type ContractStatus = typeof CONTRACT_STATUSES[number]

export const STATUS_LABELS: Record<ContractStatus, string> = {
  REQUEST: 'Request',
  REJECT: 'Reject',
  BIDDING: 'Bidding',
  DRAFT: 'Draft',
  ACTIVE: 'Active Contract',
  EXPIRED: 'Expired',
  TERMINATED: 'Terminated',
}
