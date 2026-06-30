'use client'
import { useState } from 'react'
import { validateNumber } from '@/lib/game'

export default function NumberInput({ digits, onSubmit, label, buttonLabel = 'Submit', disabled = false }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    const err = validateNumber(value, digits)
    if (err) { setError(err); return }
    setError('')
    onSubmit(value)
    setValue('')
  }

  return (
    <div className="space-y-3">
      {label && <p className="text-stone-500 text-sm">{label}</p>}
      <input
        className="input-field"
        type="text"
        inputMode="numeric"
        maxLength={digits}
        placeholder={'_'.repeat(digits)}
        value={value}
        onChange={e => { setValue(e.target.value.replace(/\D/g, '')); setError('') }}
        onKeyDown={e => e.key === 'Enter' && !disabled && handleSubmit()}
        disabled={disabled}
      />
      {error && <p className="text-rose-600 text-sm text-center">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={disabled || value.length === 0}
        className="btn-primary w-full"
      >
        {buttonLabel}
      </button>
    </div>
  )
}
