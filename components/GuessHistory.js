'use client'
import { analyseProbe } from '@/lib/game'

export default function GuessHistory({ guesses, digits, showAnalysis = false }) {
  if (!guesses || guesses.length === 0) {
    return (
      <div className="text-center text-stone-400 py-8 text-sm">
        No guesses yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {guesses.map((g, i) => {
        const probe = showAnalysis && i > 0
          ? analyseProbe(
              guesses[i-1].guess, guesses[i-1].cows, guesses[i-1].bulls,
              g.guess, g.cows, g.bulls
            )
          : null
        return (
          <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl tracking-widest text-stone-900">
                {g.guess.split('').join(' ')}
              </span>
              <div className="flex gap-2">
                <span className="badge-cow">{g.cows} cow{g.cows !== 1 ? 's' : ''}</span>
                <span className="badge-bull">{g.bulls} bull{g.bulls !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {probe && (
              <p className="text-xs text-stone-500">{probe}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
