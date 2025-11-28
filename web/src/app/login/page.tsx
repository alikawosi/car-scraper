'use client'

import { login, verifyOtp } from '../auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect, useRef } from 'react'
import { Edit2, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [canResend, setCanResend] = useState(false)
  
  // Timer logic
  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timerId)
    } else if (step === 'otp') {
      setCanResend(true)
    }
  }, [timeLeft, step])

  const startTimer = () => {
    setTimeLeft(60)
    setCanResend(false)
  }

  const handleSendOtp = async (formData: FormData) => {
    setLoading(true)
    setError('')
    const result = await login(formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
    } else {
      setStep('otp')
      startTimer()
    }
  }

  const handleResend = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('email', email)
    
    const result = await login(formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
    } else {
      startTimer()
    }
  }

  const handleVerifyOtp = async (formData: FormData) => {
    setLoading(true)
    setError('')
    formData.append('email', email)
    const result = await verifyOtp(formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
    }
  }

  const handleEditEmail = () => {
    setStep('email')
    setToken('')
    setError('')
    setTimeLeft(0)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl transition-all duration-300">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
            {step === 'email' ? 'Sign in or Sign up' : 'Verify your email'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            {step === 'email' 
              ? 'Enter your email to receive a verification code' 
              : `We sent a code to ${email}`}
          </p>
        </div>

        <form 
          className="mt-8 space-y-6" 
          action={step === 'email' ? handleSendOtp : handleVerifyOtp}
        >
          <div className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2 relative">
              <Label htmlFor="email-address">Email address</Label>
              <div className="relative">
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={step === 'otp'}
                  className={cn(
                    "relative block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#E60012] sm:text-sm sm:leading-6 transition-colors",
                    step === 'otp' && "bg-slate-50 text-slate-500 pr-10"
                  )}
                  placeholder="Email address"
                />
                {step === 'otp' && (
                  <button
                    type="button"
                    onClick={handleEditEmail}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#E60012] transition-colors p-1"
                    title="Edit email"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* OTP Input Section */}
            {step === 'otp' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <Label htmlFor="token">Verification Code</Label>
                <div className="relative">
                  <Input
                    id="token"
                    name="token"
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="relative block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#E60012] sm:text-sm sm:leading-6 pr-24"
                    placeholder="123456"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs font-medium">
                    {timeLeft > 0 ? (
                      <span className="text-slate-400 tabular-nums">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading}
                        className="flex items-center gap-1 text-[#E60012] hover:text-[#be000f] transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Resend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-[#E60012] px-3 py-2 text-sm font-semibold text-white hover:bg-[#be000f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E60012] transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {step === 'email' ? 'Sending...' : 'Verifying...'}
                </span>
              ) : (
                step === 'email' ? 'Send Code' : 'Verify & Login'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
