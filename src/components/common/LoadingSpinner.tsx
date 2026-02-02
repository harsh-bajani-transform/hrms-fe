export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'

export interface LoadingSpinnerProps {
  size?: SpinnerSize
  message?: string
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
}

const LoadingSpinner = ({ size = 'md', message = '' }: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full border-blue-500 border-t-transparent ${sizeClasses[size]}`}
      />
      {message ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      ) : null}
    </div>
  )
}

export default LoadingSpinner
