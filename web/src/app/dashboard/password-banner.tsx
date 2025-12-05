'use client'

import { useState } from 'react'
import { AlertTriangle, X, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '@/app/auth/actions'

export function PasswordBanner({ hasPassword }: { hasPassword: boolean }) {
  const [isVisible, setIsVisible] = useState(!hasPassword)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isVisible) return null

  const handleUpdatePassword = async (formData: FormData) => {
    setLoading(true)
    setError('')
    const result = await updatePassword(formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
    } else {
      setIsOpen(false)
      setIsVisible(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-white border border-orange-100 p-4 mb-6 rounded-xl relative shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-white p-2 rounded-full shadow-sm">
          <Shield className="h-6 w-6 text-motovotive-orange" aria-hidden="true" />
        </div>
        <div className="ml-4 flex-1 md:flex md:justify-between items-center">
          <div>
             <h3 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wide">Secure Your Account</h3>
             <p className="text-sm text-slate-600 mt-1">
               Your account is currently using a temporary login method. Set a password to enable secure login.
             </p>
          </div>
          <div className="mt-3 md:ml-6 md:mt-0">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="whitespace-nowrap bg-motovotive-orange hover:bg-motovotive-red border-none shadow-orange-500/20 shadow-lg text-white font-bold rounded-full text-xs h-9 px-6">
                  Set Password
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl font-bold">Set Account Password</DialogTitle>
                  <DialogDescription>
                    Create a strong password to secure your account and enable password login.
                  </DialogDescription>
                </DialogHeader>
                <form action={handleUpdatePassword} className="space-y-5 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      placeholder="Enter new password"
                      className="rounded-xl border-slate-200 focus:ring-motovotive-orange"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg">{error}</p>
                  )}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="rounded-full">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="rounded-full bg-motovotive-orange hover:bg-motovotive-red border-none">
                      {loading ? 'Saving...' : 'Save Password'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            type="button"
            className="rounded-full p-1 inline-flex text-slate-400 hover:text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setIsVisible(false)}
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
