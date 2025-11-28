'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
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
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg relative animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <p className="text-sm text-yellow-700">
            Your account is currently using a temporary login method. Set a password to secure your account.
          </p>
          <p className="mt-3 text-sm md:ml-6 md:mt-0">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <button className="whitespace-nowrap font-medium text-yellow-700 hover:text-yellow-600 underline">
                  Set Password
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Account Password</DialogTitle>
                  <DialogDescription>
                    Create a strong password to secure your account and enable password login.
                  </DialogDescription>
                </DialogHeader>
                <form action={handleUpdatePassword} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      placeholder="Enter new password"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Password'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            type="button"
            className="bg-yellow-50 rounded-md inline-flex text-yellow-500 hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
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
