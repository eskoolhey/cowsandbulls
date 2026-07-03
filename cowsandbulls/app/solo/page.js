'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  generateSecret, scoreGuess,
  generateCandidates, filterCandidates, pickBestGuess
} from '@/lib/game'
import NumberInput from '@/components/NumberInput'
import GuessHistory from '@/components/GuessHistory'
import { TrainingToggle } from '@/components/TrainingMode'

function SoloGame() {
  const router = useRouter()
  const params = useSearchParams()
  const digits = parseInt(params.get('digits') || '5')

  const [secret] = useState(() => generateSecret(digits))
  const [guesses, setGuesses] = useState([])
  const [candidates, setCandidates] = useState(() => generateCandidates(digits))
  const [won, setWon] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [trainingMode, setTrainingMode] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)

  function handleGuess(val) {
    const { cows, bulls } = scoreGuess(val, secret)
    const newGuess = { guess: val, cows, bulls }
    const newGuesses = [...guesses, newGuess]
    setGuesses(newGuesses)
    setCandidates(prev => filterCandidates(prev, val, cows, bulls))
    if (bulls === digits) setWon(true)
    setShowSuggestion(false)
  }

  const suggestion = !won && candidates.length > 0 ? pickBestGuess(candidates) : null

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">

        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-stone-500 hover:text-stone-800 text-sm">← Home</button>
          <h1 className="text-2xl font-bold text-stone-900">Vs computer</h1>
          <span className="text-stone-400 text-sm">{digits} digits</span>
        </div>

        {!won && (
          <TrainingToggle active={trainingMode} onToggle={() => setTrainingMode(t => !t)} />
        )}

        {won ? (
          <div className="card text-center space-y-4">
            <h2 className="text-2xl font-bold text-pink-600">You cracked it!</h2>
            <p className="text-stone-500">in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}</p>
            <div className="font-mono text-4xl tracking-widest text-stone-900">{secret.split('').join(' ')}</div>
            <button onClick={() => router.push('/')} className="btn-primary w-full">Play again</button>
          </div>
        ) : (
          <div className="card space-y-4">
            <NumberInput
              digits={digits}
              onSubmit={handleGuess}
              label="Enter your guess"
              buttonLabel="Guess"
            />
            {!won && !revealed && (
              <button
                onClick={() => setRevealed(true)}
                className="text-stone-400 hover:text-stone-600 text-sm w-full text-center transition-colors"
              >
                Give up & reveal number
              </button>
            )}
            {revealed && (
              <div className="text-center">
                <p className="text-stone-500 text-sm mb-1">The number was</p>
                <p className="font-mono text-3xl tracking-widest text-rose-600">{secret.split('').join(' ')}</p>
              </div>
            )}
          </div>
        )}

        {trainingMode && !won && (
          <div className="card space-y-3">
            <button onClick={() => setShowSuggestion(s => !s)} className="btn-secondary w-full">
              {showSuggestion ? 'Hide' : 'Suggest my next guess'}
            </button>
            {showSuggestion && suggestion && (
              <div className="space-y-1 pt-1">
                <p className="text-stone-400 text-xs uppercase tracking-wider">Suggested next guess</p>
                <p className="font-mono text-2xl tracking-widest text-pink-600">{suggestion.split('').join(' ')}</p>
                <p className="text-stone-400 text-xs">{candidates.length} candidates remaining</p>
              </div>
            )}
          </div>
        )}

        {guesses.length > 0 && (
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-stone-700">Your guesses</h2>
              {trainingMode && (
                <button
                  onClick={() => setShowAnalysis(a => !a)}
                  className="text-xs font-semibold text-pink-600 hover:text-pink-700"
                >
                  {showAnalysis ? 'Hide analysis' : 'Analyse guesses'}
                </button>
              )}
            </div>
            <GuessHistory guesses={guesses} digits={digits} showAnalysis={trainingMode && showAnalysis} />
          </div>
        )}

      </div>
    </main>
  )
}

export default function SoloPage() {
  return (
    <Suspense>
      <SoloGame />
    </Suspense>
  )
}
