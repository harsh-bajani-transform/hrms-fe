import { useEffect, useState, type FormEvent } from 'react'
import { User as UserIcon, Lock, LogIn, Loader2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'react-hot-toast'
import { loginUser } from '../../services/authService'
import { useAuth, type User } from '../../../../context/AuthContext'
import { useDeviceInfo } from '../../../../hooks/useDeviceInfo'
import { log, logError } from '../../../../config/environment'

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const asRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null

const extractUserFromLoginResponse = (data: unknown): User | null => {
  if (!data) return null

  // Case 1: response.data is already the user object
  if (asRecord(data) && ('user_id' in data || 'id' in data)) {
    return data as User
  }

  // Case 2: response.data is an envelope with { data: user } or { user: user }
  if (asRecord(data) && 'data' in data && asRecord(data.data)) {
    return data.data as User
  }

  if (asRecord(data) && 'user' in data && asRecord(data.user)) {
    return data.user as User
  }

  return null
}

const LoginView = () => {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  // Frontend validation errors
  const [usernameError, setUsernameError] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')

  // Backend field-specific errors
  const [backendUsernameError, setBackendUsernameError] = useState<string>('')
  const [backendPasswordError, setBackendPasswordError] = useState<string>('')

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const navigate = useNavigate()
  const { login, user } = useAuth()
  const { device_id, device_type } = useDeviceInfo()

  // Redirect logged-in users away from login page
  useEffect(() => {
    if (user) {
      navigate({ to: '/dashboard', replace: true })
    }
  }, [user, navigate])

  const handleUsernameChange = (value: string): void => {
    setUsername(value)
    setBackendUsernameError('')

    if (!value.trim()) {
      setUsernameError('Please enter your email')
    } else if (!isValidEmail(value)) {
      setUsernameError('Please enter a valid email address')
    } else {
      setUsernameError('')
    }
  }

  const handlePasswordChange = (value: string): void => {
    setPassword(value)
    setBackendPasswordError('')

    if (!value.trim()) {
      setPasswordError('Please enter your password')
    } else if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters')
    } else {
      setPasswordError('')
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    // Final validation check
    if (usernameError || passwordError || !username || !password) {
      if (!username) setUsernameError('Please enter your email')
      if (!password) setPasswordError('Please enter your password')
      return
    }

    setIsLoading(true)

    try {
      const response = await loginUser(username, password, device_id, device_type)
      log('[LoginPage] Login successful')

      const extracted = extractUserFromLoginResponse(response.data)

      if (!extracted || (extracted.user_id == null && extracted.id == null)) {
        throw new Error('Invalid response format from backend')
      }

      if (extracted.is_active === 0 || extracted.is_active === false) {
        toast.error('Your account is inactive. Please contact your admin.', {
          duration: 5000,
        })
        return
      }

      login(extracted)
      toast.success('You are now logged in!', { duration: 4000 })
      navigate({ to: '/dashboard', replace: true })
    } catch (err: unknown) {
      logError('[LoginPage] Login failed:', err)

      const message = err instanceof Error ? err.message : 'Invalid credentials'

      if (message.toLowerCase().includes('email')) {
        setBackendUsernameError(message)
      } else if (message.toLowerCase().includes('password')) {
        setBackendPasswordError(message)
      } else {
        toast.error(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl">
        <div className="bg-[#1e40af] p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-3">Welcome Back</h1>
          <p className="text-blue-100 font-medium">Sign in to TFS Ops Tracker</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <UserIcon className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Enter email"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 ${usernameError || backendUsernameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'}`}
                />
              </div>
              {usernameError && (
                <p className="text-red-600 text-sm mt-1">{usernameError}</p>
              )}
              {!usernameError && backendUsernameError && (
                <p className="text-red-600 text-sm mt-1">
                  {backendUsernameError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 tracking-widest ${passwordError || backendPasswordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'}`}
                />
              </div>
              {passwordError && (
                <p className="text-red-600 text-sm mt-1">{passwordError}</p>
              )}
              {!passwordError && backendPasswordError && (
                <p className="text-red-600 text-sm mt-1">
                  {backendPasswordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 rounded-lg text-white gap-2 cursor-pointer ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginView
