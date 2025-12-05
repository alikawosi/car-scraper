import Link from 'next/link'
import {
  LayoutDashboard,
  Settings,
  LogOut,
  User,
} from 'lucide-react'
import { signout } from '@/app/auth/actions'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-1 group">
            <span className="text-2xl font-black text-motovotive-red tracking-tighter transition-all duration-300 group-hover:tracking-normal">
              MOTOVOTIVE
            </span>
            <div className="w-2 h-2 rounded-full bg-motovotive-orange mt-1.5 animate-pulse" />
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl text-white bg-motovotive-red shadow-md shadow-motovotive-red/20 transition-all hover:shadow-lg hover:shadow-motovotive-red/30"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-motovotive-red transition-all group"
          >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-motovotive-red" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate font-display">
                My Account
              </p>
              <p className="text-xs text-slate-500 truncate">
                Manage Profile
              </p>
            </div>
          </div>
          <form action={async () => {
            'use server'
            await signout()
          }}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg text-slate-500 hover:bg-red-50 hover:text-motovotive-red transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
