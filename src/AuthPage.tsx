import React, { useCallback, useEffect, useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'
import type { Application as SplineApp } from '@splinetool/runtime'
import { AnimatePresence, motion } from 'framer-motion'

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SPLINE_URL = 'https://prod.spline.design/3obkoKV092xJzQGR/scene.splinecode'
const SPLINE_PASSWORD_OBJECT = 'Password'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AuthMode = 'signin' | 'signup' | 'forgotPassword'

// ─── UTILS ────────────────────────────────────────────────────────────────────

const cn = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(' ')

// ─── ANIMATION VARIANTS ───────────────────────────────────────────────────────

/** Card entrance: spring pop without hardcoded delay. Controlled by splineReady */
const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 20,
    },
  },
}

interface FormCustom { dir: number; firstMount: boolean }

const formSwitchVariants = {
  hidden: ({ dir }: FormCustom) => ({
    opacity: 0,
    x: dir > 0 ? 52 : -52,
    filter: 'blur(4px)',
  }),
  visible: ({ firstMount }: FormCustom) => ({
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      duration: firstMount ? 0.55 : 0.42,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: firstMount ? 0.75 : 0,
    },
  }),
  exit: ({ dir }: FormCustom) => ({
    opacity: 0,
    x: dir < 0 ? 52 : -52,
    filter: 'blur(4px)',
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, delay: 0.05 * i, ease: 'easeOut' as const },
  }),
}

// ─── FLOATING INPUT ───────────────────────────────────────────────────────────

interface FloatingInputProps {
  id: string
  label: string
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFocus?: () => void
  onBlur?: () => void
  index: number
  autoComplete?: string
}

const labelFloated = {
  y: 0,
  scale: 0.72,
  color: '#e5e7eb',
  transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
}
const labelResting = {
  y: 14,
  scale: 1,
  color: '#6b7280',
  transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  id, label, type, value, onChange, onFocus, onBlur, index, autoComplete,
}) => {
  const [focused, setFocused] = useState(false)
  const isFloated = focused || value.length > 0

  const handleFocus = () => {
    setFocused(true)
    onFocus?.()
  }
  const handleBlur = () => {
    setFocused(false)
    onBlur?.()
  }

  return (
    <motion.div
      className="relative"
      variants={fieldVariants}
      custom={index}
    >
      <motion.label
        htmlFor={id}
        className="pointer-events-auto absolute left-4 top-0 origin-left select-none text-sm font-medium uppercase tracking-widest"
        animate={isFloated ? labelFloated : labelResting}
        initial={labelResting}
      >
        {label}
      </motion.label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete={autoComplete}
        className={cn(
          'pointer-events-auto',
          'w-full rounded-xl border bg-white/5 px-4 pt-6 pb-2',
          'text-sm text-gray-100 outline-none',
          'transition-all duration-200 backdrop-blur-sm',
          focused
            ? 'border-white/30 bg-white/10 shadow-[0_0_0_3px_rgba(255,255,255,0.07)]'
            : 'border-white/10 hover:border-white/20 hover:bg-white/8'
        )}
      />
    </motion.div>
  )
}

// ─── AUTH FORM ────────────────────────────────────────────────────────────────

interface AuthFormProps {
  mode: AuthMode
  onToggle: () => void
  onForgotPassword: () => void
  onPasswordFocus: () => void
  onPasswordBlur: () => void
}

const AuthForm: React.FC<AuthFormProps> = ({
  mode, onToggle, onForgotPassword, onPasswordFocus, onPasswordBlur,
}) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [direction, setDirection] = useState<1 | -1>(1)
  const [isFirstMount, setIsFirstMount] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setIsFirstMount(false), 2200)
    return () => clearTimeout(t)
  }, [])

  const isSignUp = mode === 'signup'
  const isForgot = mode === 'forgotPassword'

  useEffect(() => { setName(''); setEmail(''); setPassword(''); setResetEmail('') }, [mode])

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault() }

  const handleSignUpToggle = () => {
    setDirection(isSignUp ? -1 : 1)
    onToggle()
  }

  const handleForgotClick = () => {
    setDirection(1)
    onForgotPassword()
  }

  const handleBackToSignIn = () => {
    setDirection(-1)
    onToggle()
  }

  const formCustom: FormCustom = { dir: direction, firstMount: isFirstMount }

  return (
    <AnimatePresence mode="popLayout" custom={formCustom}>
      {isForgot ? (
        <motion.form
          key="forgotPassword"
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5"
          custom={formCustom}
          variants={formSwitchVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div variants={fieldVariants} custom={0} className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
              Account recovery
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Reset Password
            </h1>
          </motion.div>

          <motion.div
            variants={fieldVariants}
            custom={1}
            className="h-px w-full bg-gradient-to-r from-transparent via-gray-300/70 to-transparent"
          />

          <motion.p
            variants={fieldVariants}
            custom={2}
            className="text-xs leading-relaxed text-gray-500"
          >
            Enter your email and we’ll send you a link to reset your password.
          </motion.p>

          <motion.div className="flex flex-col gap-4" initial="hidden" animate="visible">
            <FloatingInput
              id="reset-email" label="Email" type="email"
              value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
              autoComplete="email" index={3}
            />
          </motion.div>

          <motion.button
            type="submit"
            variants={fieldVariants}
            custom={4}
            whileHover={{ scale: 1.02, backgroundColor: '#2d2d3a' }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'pointer-events-auto',
              'mt-1 w-full rounded-xl py-3.5 px-6',
              'text-sm font-bold tracking-wide text-white bg-[#1c1c28]',
              'transition-all duration-300 border border-white/10',
              'shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.6)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
            )}
          >
            Send Reset Link →
          </motion.button>

          <motion.p
            variants={fieldVariants}
            custom={5}
            className="text-center text-xs text-gray-500"
          >
            <button
              type="button"
              onClick={handleBackToSignIn}
              className="pointer-events-auto font-semibold text-gray-300 underline-offset-2 transition-colors hover:text-white hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded"
            >
              ← Back to Sign In
            </button>
          </motion.p>
        </motion.form>
      ) : (
        <motion.form
          key={mode}
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5"
          custom={formCustom}
          variants={formSwitchVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div variants={fieldVariants} custom={0} className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
              {isSignUp ? 'Get started' : 'Welcome back'}
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h1>
          </motion.div>

          <motion.div
            variants={fieldVariants}
            custom={1}
            className="h-px w-full bg-gradient-to-r from-transparent via-gray-300/70 to-transparent"
          />

          <motion.div className="flex flex-col gap-4" initial="hidden" animate="visible">
            {isSignUp && (
              <FloatingInput
                id="name" label="Full Name" type="text"
                value={name} onChange={(e) => setName(e.target.value)}
                autoComplete="name" index={2}
              />
            )}
            <FloatingInput
              id="email" label="Email" type="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" index={3}
            />
            <FloatingInput
              id="password" label="Password" type="password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onFocus={onPasswordFocus} onBlur={onPasswordBlur}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              index={4}
            />
          </motion.div>

          {!isSignUp && (
            <motion.div variants={fieldVariants} custom={5} className="-mt-2 text-right">
              <button
                type="button"
                onClick={handleForgotClick}
                className="pointer-events-auto text-xs text-gray-500 transition-colors hover:text-gray-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded"
              >
                Forgot password?
              </button>
            </motion.div>
          )}

          <motion.button
            type="submit"
            variants={fieldVariants}
            custom={6}
            whileHover={{ scale: 1.02, backgroundColor: '#2d2d3a' }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'pointer-events-auto',
              'mt-1 w-full rounded-xl py-3.5 px-6',
              'text-sm font-bold tracking-wide text-white bg-[#1c1c28]',
              'transition-all duration-300 border border-white/10',
              'shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.6)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
            )}
          >
            {isSignUp ? 'Create Account →' : 'Sign In →'}
          </motion.button>

          <motion.div variants={fieldVariants} custom={7} className="flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-widest text-gray-600">or</span>
            <span className="h-px flex-1 bg-white/10" />
          </motion.div>

          <motion.div variants={fieldVariants} custom={8} className="grid grid-cols-2 gap-3">
            {/* Google */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.97 }}
              className="pointer-events-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </motion.button>

            {/* GitHub */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.97 }}
              className="pointer-events-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub
            </motion.button>
          </motion.div>

          <motion.p
            variants={fieldVariants}
            custom={9}
            className="text-center text-xs text-gray-500"
          >
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={handleSignUpToggle}
              className="pointer-events-auto font-semibold text-gray-300 underline-offset-2 transition-colors hover:text-white hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded"
            >
              {isSignUp ? 'Sign In' : 'Create one'}
            </button>
          </motion.p>
        </motion.form>
      )}
    </AnimatePresence>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('signin')
  const [splineReady, setSplineReady] = useState(false)
  const splineRef = useRef<SplineApp | null>(null)

  useEffect(() => {
    document.title = '3D Login page'
  }, [])

  const handleSplineLoad = useCallback((app: SplineApp) => {
    splineRef.current = app
    
    // الحل السحري: هنستنى ثانيتين كاملين عشان الروبوت يخلص حركة الكاميرا بتاعته ويظهر كامل
    setTimeout(() => {
      setSplineReady(true)
    }, 500)
  }, [])

  const handlePasswordFocus = useCallback(() => {
    splineRef.current?.emitEvent('keyDown', SPLINE_PASSWORD_OBJECT)
  }, [])

  const handlePasswordBlur = useCallback(() => {
    splineRef.current?.emitEventReverse('keyDown', SPLINE_PASSWORD_OBJECT)
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-[#111119] via-[#1a1a2e] to-[#16213e]">

      {/* ── Spline canvas — z-0, always receives mouse events ── */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          {!splineReady && (
            <motion.div
              key="loader"
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#111119] via-[#1a1a2e] to-[#16213e]"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1.5, ease: 'easeInOut' } }}
            >
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gray-500" />
                <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-gray-400 [animation-direction:reverse] [animation-duration:700ms]" />
              </div>
              <p className="animate-pulse text-[10px] uppercase tracking-[0.3em] text-gray-600">
                Loading
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Spline
          scene={SPLINE_URL}
          onLoad={handleSplineLoad}
          className="h-full w-full"
          style={{ background: 'transparent' }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-end">
        <div className="w-full max-w-[90rem] mx-auto flex items-center justify-end h-full pr-8 md:pr-16 lg:pr-24">

          <motion.div
            className="w-full max-w-sm flex-shrink-0"
            variants={cardVariants}
            initial="hidden"
            animate={splineReady ? "visible" : "hidden"} 
          >
            {/* Glass card — layout enables liquid morph height transition */}
            <motion.div
              layout
              className={cn(
                'pointer-events-none relative overflow-hidden',
                'rounded-2xl border border-white/10',
                'bg-black/30 backdrop-blur-2xl',
                'shadow-[0_8px_60px_rgba(0,0,0,0.6),0_2px_0_rgba(255,255,255,0.05)_inset]'
              )}
            >
              <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="p-8">
                <AuthForm
                  mode={authMode}
                  onToggle={() => setAuthMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
                  onForgotPassword={() => setAuthMode('forgotPassword')}
                  onPasswordFocus={handlePasswordFocus}
                  onPasswordBlur={handlePasswordBlur}
                />
              </div>

              <div className="absolute inset-x-0 bottom-0 h-px rounded-b-2xl bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
            </motion.div>

          </motion.div>

        </div>
      </div>
    </div>
  )
}

export default AuthPage
