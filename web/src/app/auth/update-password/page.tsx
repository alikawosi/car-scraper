'use client'

import { updatePassword } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Loader2, Lock } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdatePassword = async (formData: FormData) => {
    setLoading(true)
    setError('')
    
    const result = await updatePassword(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // Success redirect is handled in the action
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl transition-all duration-300">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Lock className="h-6 w-6 text-[#E60012]" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Please enter your new password below.
          </p>
        </div>

        <form action={handleUpdatePassword} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="relative block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#E60012] sm:text-sm sm:leading-6"
              placeholder="Enter your new password"
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-md bg-[#E60012] px-3 py-2 text-sm font-semibold text-white hover:bg-[#be000f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E60012] transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </span>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

