'use client'

export function TrainingToggle({ active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
        active ? 'bg-pink-50 border-pink-300' : 'bg-white border-stone-200 hover:bg-stone-50'
      }`}
    >
      <span className={`font-medium text-sm ${active ? 'text-pink-700' : 'text-stone-600'}`}>
        Training mode
      </span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        active ? 'bg-pink-600 text-white' : 'bg-stone-100 text-stone-400'
      }`}>
        {active ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}

export function OpponentTrainingNotice({ visible }) {
  if (!visible) return null
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
      <p className="text-amber-700 text-xs font-medium">
        Your opponent has training mode turned on
      </p>
    </div>
  )
}
