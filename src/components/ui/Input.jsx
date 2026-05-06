import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, hint, className = '', ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="form-label">{label}</label>}
      <input
        ref={ref}
        className={`
          w-full h-9 px-3 text-sm bg-white border rounded-lg
          text-gray-900 placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          transition-colors
          ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({ label, error, className = '', ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="form-label">{label}</label>}
      <textarea
        ref={ref}
        rows={3}
        className={`
          w-full px-3 py-2 text-sm bg-white border rounded-lg
          text-gray-900 placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-50 resize-none transition-colors
          ${error ? 'border-red-400' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
})

export default Input
