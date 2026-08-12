'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, PlusCircle } from 'lucide-react'

const NAV_ITEMS = [
  {
    section: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    section: 'CONTRACTS',
    items: [
      { label: 'All Contracts', href: '/contracts', icon: FileText },
      { label: 'New Request', href: '/contracts/new', icon: PlusCircle },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col min-h-screen border-r"
      style={{
        backgroundColor: 'hsl(var(--surface))',
        borderColor: 'hsl(var(--border))',
      }}
    >
      {/* Brand Header with White Background for FJM Logo */}
      <div
        className="p-5 border-b flex items-center gap-3"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center p-1 flex-shrink-0 bg-white shadow-sm"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Image
            src="/logo.svg"
            alt="FJM Logo"
            width={32}
            height={32}
            priority
          />
        </div>
        <div className="min-w-0">
          <div
            className="font-extrabold text-sm tracking-tight leading-none flex items-center gap-1"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            <span style={{ color: 'hsl(var(--brand-red))' }}>FJM</span> CLM
          </div>
          <p
            className="text-[10px] mt-1 font-medium truncate"
            style={{ color: 'hsl(var(--foreground-muted))' }}
          >
            PT Fiqry Jaya Manunggal
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {NAV_ITEMS.map((group) => (
          <div key={group.section} className="space-y-1">
            <p
              className="text-[10px] font-bold tracking-widest uppercase px-3 mb-2"
              style={{ color: 'hsl(var(--foreground-muted))' }}
            >
              {group.section}
            </p>
            {group.items.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group"
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(90deg, hsl(var(--primary) / 0.2), hsl(var(--brand-red) / 0.1))',
                          color: 'hsl(var(--foreground))',
                          borderLeft: '3px solid hsl(var(--brand-red))',
                        }
                      : {
                          color: 'hsl(var(--foreground-muted))',
                        }
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      size={16}
                      style={{
                        color: isActive
                          ? 'hsl(var(--brand-red))'
                          : 'hsl(var(--foreground-muted))',
                      }}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'hsl(var(--brand-red))' }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer Branding */}
      <div
        className="p-4 border-t text-[11px]"
        style={{
          borderColor: 'hsl(var(--border))',
          color: 'hsl(var(--foreground-muted))',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'hsl(var(--success))' }}
          />
          <span>CLM System Online</span>
        </div>
        <div className="mt-1 opacity-70 text-[10px]">
          v1.0.0 · Multi-Currency Active
        </div>
      </div>
    </aside>
  )
}
