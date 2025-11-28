'use client'

import { login, verifyOtp, signInWithPassword, signInWithGoogle, resetPassword } from '../auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { Edit2, RefreshCw, Loader2, KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'forgot-password'>('email')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
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

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    const result = await signInWithGoogle()
    if (result?.error) {
      setLoading(false)
      setError(result.error)
    }
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

  const handlePasswordLogin = async (formData: FormData) => {
    setLoading(true)
    setError('')
    const result = await signInWithPassword(formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
    }
  }

  const handleResetPassword = async (formData: FormData) => {
    if (!email) return
    setLoading(true)
    setError('')
    setSuccessMessage('')
    
    const result = await resetPassword(formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccessMessage('Check your email for the password reset link')
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
    setPassword('')
    setError('')
    setSuccessMessage('')
    setTimeLeft(0)
  }

  const toggleAuthMethod = () => {
    setError('')
    setSuccessMessage('')
    if (step === 'password') {
      setStep('email')
    } else {
      setStep('password')
    }
  }

  const getFormAction = () => {
    if (step === 'forgot-password') return handleResetPassword
    if (step === 'password') return handlePasswordLogin
    if (step === 'otp') return handleVerifyOtp
    return handleSendOtp
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl transition-all duration-300">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
            {step === 'otp' ? 'Verify your email' : 
             step === 'forgot-password' ? 'Reset your password' :
             step === 'password' ? 'Sign in with password' : 'Sign in or Sign up'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            {step === 'otp' ? `We sent a code to ${email}` :
             step === 'forgot-password' ? 'Enter your email to receive a reset link' :
             step === 'password' ? 'Enter your password to sign in' : 'Enter your email to receive a verification code'}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {step !== 'forgot-password' && (
            <>
              <Button
                variant="outline"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full relative flex justify-center items-center gap-2 h-10"
              >
                {loading ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                   <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                   </svg>
                )}
                Sign in with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">
                    Or continue with
                  </span>
                </div>
              </div>
            </>
          )}

          <form 
            className="space-y-6" 
            action={getFormAction()}
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

            {/* Password Input */}
            {step === 'password' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('forgot-password')
                      setError('')
                      setSuccessMessage('')
                    }}
                    className="text-sm font-medium text-[#E60012] hover:text-[#be000f] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#E60012] sm:text-sm sm:leading-6"
                  placeholder="Enter your password"
                  autoFocus
                />
              </div>
            )}

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

          {successMessage && (
             <div className="flex items-center justify-center gap-2 text-green-600 text-sm text-center animate-in fade-in zoom-in-95 bg-green-50 p-3 rounded-md border border-green-200">
                <CheckCircle2 className="w-4 h-4" />
                {successMessage}
             </div>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={loading || (step === 'forgot-password' && !!successMessage)}
              className="group relative flex w-full justify-center rounded-md bg-[#E60012] px-3 py-2 text-sm font-semibold text-white hover:bg-[#be000f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E60012] transition-all duration-200 disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {step === 'forgot-password' ? 'Sending link...' : 'Signing in...'}
                </span>
              ) : (
                step === 'forgot-password' ? 'Send Reset Link' : 'Sign In'
              )}
            </Button>

            {step !== 'otp' && (
              <button
                type="button"
                onClick={step === 'forgot-password' ? () => setStep('password') : toggleAuthMethod}
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-[#E60012] transition-colors"
              >
                {step === 'forgot-password' ? (
                  <>
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </>
                ) : step === 'password' ? (
                  <>
                    <Mail className="w-4 h-4" />
                    Sign in with OTP
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Sign in with password
                  </>
                )}
              </button>
            )}
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
