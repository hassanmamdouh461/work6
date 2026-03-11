import React, { useCallback, useEffect, useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'
import type { Application as SplineApp } from '@splinetool/runtime'
import { AnimatePresence, motion } from 'framer-motion'

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SPLINE_URL = 'https://prod.spline.design/ixhHIo59KNe4UVcd/scene.splinecode'
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
  color: '#111111',
  transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
}
const labelResting = {
  y: 14,
  scale: 1,
  color: '#9ca3af',
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
          'w-full rounded-xl border bg-white/50 px-4 pt-6 pb-2',
          'text-sm text-gray-900 outline-none',
          'transition-all duration-200 backdrop-blur-sm',
          focused
            ? 'border-gray-900/50 bg-white/70 shadow-[0_0_0_3px_rgba(0,0,0,0.08)]'
            : 'border-gray-300/50 hover:border-gray-400/70 hover:bg-white/60'
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
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
              Account recovery
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
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
            whileHover={{ scale: 1.02, backgroundColor: '#1a1a1a' }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'pointer-events-auto',
              'mt-1 w-full rounded-xl py-3.5 px-6',
              'text-sm font-bold tracking-wide text-white bg-black',
              'transition-all duration-300',
              'shadow-[0_4px_20px_rgba(0,0,0,0.22)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.32)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2'
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
              className="pointer-events-auto font-semibold text-gray-900 underline-offset-2 transition-colors hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-900 rounded"
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
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
              {isSignUp ? 'Get started' : 'Welcome back'}
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
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
                className="pointer-events-auto text-xs text-gray-400 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-900 rounded"
              >
                Forgot password?
              </button>
            </motion.div>
          )}

          <motion.button
            type="submit"
            variants={fieldVariants}
            custom={6}
            whileHover={{ scale: 1.02, backgroundColor: '#1a1a1a' }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'pointer-events-auto',
              'mt-1 w-full rounded-xl py-3.5 px-6',
              'text-sm font-bold tracking-wide text-white bg-black',
              'transition-all duration-300',
              'shadow-[0_4px_20px_rgba(0,0,0,0.22)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.32)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2'
            )}
          >
            {isSignUp ? 'Create Account →' : 'Sign In →'}
          </motion.button>

          <motion.div variants={fieldVariants} custom={7} className="flex items-center gap-3">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] uppercase tracking-widest text-gray-400">or</span>
            <span className="h-px flex-1 bg-gray-200" />
          </motion.div>

          <motion.p
            variants={fieldVariants}
            custom={8}
            className="text-center text-xs text-gray-500"
          >
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={handleSignUpToggle}
              className="pointer-events-auto font-semibold text-gray-900 underline-offset-2 transition-colors hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-900 rounded"
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
    <div className="relative h-screen w-full overflow-hidden bg-[#f0f0f0]">

      {/* ── Spline canvas — z-0, always receives mouse events ── */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          {!splineReady && (
            <motion.div
              key="loader"
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#f0f0f0]"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1.5, ease: 'easeInOut' } }}
            >
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gray-400" />
                <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-gray-600 [animation-direction:reverse] [animation-duration:700ms]" />
              </div>
              <p className="animate-pulse text-[10px] uppercase tracking-[0.3em] text-gray-400">
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
                'rounded-2xl border border-gray-200/80',
                'bg-white/75 backdrop-blur-2xl',
                'shadow-[0_8px_40px_rgba(0,0,0,0.18),0_2px_0_rgba(255,255,255,1)_inset]'
              )}
            >
              <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/90 to-transparent" />

              <div className="p-8">
                <AuthForm
                  mode={authMode}
                  onToggle={() => setAuthMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
                  onForgotPassword={() => setAuthMode('forgotPassword')}
                  onPasswordFocus={handlePasswordFocus}
                  onPasswordBlur={handlePasswordBlur}
                />
              </div>

              <div className="absolute inset-x-0 bottom-0 h-px rounded-b-2xl bg-gradient-to-r from-transparent via-black/[0.05] to-transparent" />
            </motion.div>

          </motion.div>

        </div>
      </div>
    </div>
  )
}

export default AuthPage
