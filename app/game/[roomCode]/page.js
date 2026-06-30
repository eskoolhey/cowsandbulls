'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { scoreGuess, generateCandidates, filterCandidates, pickBestGuess } from '@/lib/game'
import NumberInput from '@/components/NumberInput'
import GuessHistory from '@/components/GuessHistory'
import { TrainingToggle, OpponentTrainingNotice } from '@/components/TrainingMode'

export default function GamePage() {
  const router = useRouter()
  const { roomCode } = useParams()
  const code = roomCode?.toUpperCase()

  const [room, setRoom] = useState(null)
  const [role, setRole] = useState(null)
  const [phase, setPhase] = useState('loading')
  const [winner, setWinner] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [trainingMode, setTrainingModeState] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)

  const digits = room?.digits || 5
  const myGuessesKey = role === 'player1' ? 'player1_guesses' : 'player2_guesses'
  const theirGuessesKey = role === 'player1' ? 'player2_guesses' : 'player1_guesses'
  const mySecretKey = role === 'player1' ? 'player1_secret' : 'player2_secret'
  const theirSecretKey = role === 'player1' ? 'player2_secret' : 'player1_secret'
  const myTurnKey = role === 'player1' ? 'player1_ready' : 'player2_ready'
  const theirTurnKey = role === 'player1' ? 'player2_ready' : 'player1_ready'
  const myTrainingKey = role === 'player1' ? 'player1_training' : 'player2_training'
  const theirTrainingKey = role === 'player1' ? 'player2_training' : 'player1_training'

  const myGuesses = room?.[myGuessesKey] || []
  const theirGuesses = room?.[theirGuessesKey] || []
  const isMyTurn = room?.current_turn === role
  const theirTrainingMode = room?.[theirTrainingKey] === true

  // Local deduction aid: candidates consistent with MY OWN guesses & their scores only
  let candidates = []
  if (digits) {
    candidates = generateCandidates(digits)
    for (const g of myGuesses) {
      candidates = filterCandidates(candidates, g.guess, g.cows, g.bulls)
    }
  }
  const suggestion = candidates.length > 0 ? pickBestGuess(candidates) : null

  useEffect(() => {
    const r = localStorage.getItem(`cb_role_${code}`)
    if (!r) { router.push('/'); return }
    setRole(r)
  }, [code, router])

  const loadRoom = useCallback(async () => {
    const { data, error: err } = await supabase.from('rooms').select('*').eq('code', code).single()
    if (err || !data) { setError('Room not found.'); return }
    setRoom(data)
    updatePhase(data, role)
  }, [code, role])

  function updatePhase(data, r) {
    if (!r) return
    if (data.status === 'waiting' && r === 'player1') { setPhase('waiting'); return }
    if (data.status === 'waiting' && r === 'player2') {
      supabase.from('rooms').update({ status: 'setup' }).eq('code', code)
      setPhase('setup'); return
    }
    if (data.status === 'setup') {
      const myReady = data[r === 'player1' ? 'player1_ready' : 'player2_ready']
      setPhase(myReady ? 'playing' : 'setup')
      return
    }
    if (data.status === 'playing') {
      const myReady = data[r === 'player1' ? 'player1_ready' : 'player2_ready']
      if (!myReady) { setPhase('setup'); return }
      setPhase('playing')
    }
    if (data.status === 'won') {
      setWinner(data.winner)
      setPhase('won')
    }
  }

  useEffect(() => {
    if (!role) return
    loadRoom()
    const channel = supabase
      .channel(`room-${code}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
        payload => {
          setRoom(payload.new)
          updatePhase(payload.new, role)
          if (payload.new.status === 'won') {
            setWinner(payload.new.winner)
            setPhase('won')
          }
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [role, code, loadRoom])

  async function submitSecret(val) {
    const update = {
      [mySecretKey]: val,
      [myTurnKey]: true,
    }
    const bothReady = room?.[theirTurnKey] === true
    if (bothReady) {
      update.status = 'playing'
      update.current_turn = 'player1'
    }
    await supabase.from('rooms').update(update).eq('code', code)
    setPhase('playing')
  }

  async function submitGuess(val) {
    if (!isMyTurn) return
    const theirSecret = room?.[theirSecretKey]
    if (!theirSecret) return

    const { cows, bulls } = scoreGuess(val, theirSecret)
    const newGuess = { guess: val, cows, bulls }
    const newMyGuesses = [...myGuesses, newGuess]

    const won = bulls === digits
    const update = {
      [myGuessesKey]: newMyGuesses,
      current_turn: role === 'player1' ? 'player2' : 'player1',
    }
    if (won) {
      update.status = 'won'
      update.winner = role
    }
    await supabase.from('rooms').update(update).eq('code', code)
    setShowSuggestion(false)
  }

  async function toggleTrainingMode() {
    const next = !trainingMode
    setTrainingModeState(next)
    await supabase.from('rooms').update({ [myTrainingKey]: next }).eq('code', code)
  }

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (phase === 'loading') return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-stone-400">Loading game…</p>
    </main>
  )

  if (error) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card text-center space-y-4">
        <p className="text-rose-600">{error}</p>
        <button onClick={() => router.push('/')} className="btn-secondary">Go home</button>
      </div>
    </main>
  )

  if (phase === 'won') {
    const iWon = winner === role
    const theirSecret = room?.[theirSecretKey]
    const myS = room?.[mySecretKey]
    return (
      <main className="min-h-screen flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="card text-center space-y-4">
            <h2 className={`text-3xl font-bold ${iWon ? 'text-pink-600' : 'text-rose-600'}`}>
              {iWon ? 'You won!' : 'You lost!'}
            </h2>
            <div className="space-y-2 text-sm text-stone-500">
              <p>Your number: <span className="font-mono text-stone-900 text-lg tracking-widest">{myS?.split('').join(' ')}</span></p>
              <p>Their number: <span className="font-mono text-stone-900 text-lg tracking-widest">{theirSecret?.split('').join(' ')}</span></p>
            </div>
            <button onClick={() => router.push('/')} className="btn-primary w-full">Play again</button>
          </div>
          <div className="card space-y-3">
            <h3 className="font-semibold text-stone-900">Your guesses ({myGuesses.length})</h3>
            <GuessHistory guesses={myGuesses} digits={digits} />
          </div>
          <div className="card space-y-3">
            <h3 className="font-semibold text-stone-900">Their guesses ({theirGuesses.length})</h3>
            <GuessHistory guesses={theirGuesses} digits={digits} />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">

        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-stone-500 hover:text-stone-800 text-sm">← Home</button>
          <button onClick={copyCode} className="font-mono text-lg font-bold text-pink-600 hover:text-pink-700 transition-colors">
            {code} {copied ? '✓' : ''}
          </button>
          <span className="text-stone-400 text-sm">{digits} digits</span>
        </div>

        {phase === 'waiting' && (
          <div className="card text-center space-y-4">
            <h2 className="text-xl font-semibold text-stone-900">Waiting for opponent…</h2>
            <p className="text-stone-500 text-sm">Share this code with your friend:</p>
            <button onClick={copyCode} className="font-mono text-4xl font-bold text-pink-600 hover:text-pink-700 transition-colors">
              {code}
            </button>
            <p className="text-stone-400 text-xs">{copied ? 'Copied!' : 'Tap to copy'}</p>
          </div>
        )}

        {phase === 'setup' && (
          <div className="card space-y-4">
            <h2 className="text-xl font-semibold text-stone-900">Pick your secret number</h2>
            <p className="text-stone-500 text-sm">
              {digits} unique digits, no leading zero. Your opponent will try to guess this.
            </p>
            <NumberInput
              digits={digits}
              onSubmit={submitSecret}
              label="Your secret number (opponent can't see this)"
              buttonLabel="Lock it in"
            />
          </div>
        )}

        {phase === 'playing' && (
          <>
            <div className={`card text-center py-3 ${isMyTurn ? 'border-pink-300 bg-pink-50' : 'border-stone-200'}`}>
              {isMyTurn
                ? <p className="text-pink-700 font-semibold">Your turn to guess</p>
                : <p className="text-stone-500">Opponent is guessing…</p>
              }
            </div>

            <OpponentTrainingNotice visible={theirTrainingMode} />

            <TrainingToggle active={trainingMode} onToggle={toggleTrainingMode} />

            {isMyTurn && room?.[theirSecretKey] && (
              <div className="card space-y-4">
                <NumberInput
                  digits={digits}
                  onSubmit={submitGuess}
                  label="Guess their number"
                  buttonLabel="Guess"
                />
              </div>
            )}

            {trainingMode && isMyTurn && (
              <div className="card space-y-3">
                <button onClick={() => setShowSuggestion(s => !s)} className="btn-secondary w-full">
                  {showSuggestion ? 'Hide' : 'Suggest my next guess'}
                </button>
                {showSuggestion && suggestion && (
                  <div className="space-y-1 pt-1">
                    <p className="text-stone-400 text-xs uppercase tracking-wider">Suggested next guess</p>
                    <p className="font-mono text-2xl tracking-widest text-pink-600">{suggestion.split('').join(' ')}</p>
                    <p className="text-stone-400 text-xs">{candidates.length} candidates remaining, based on your guesses so far</p>
                  </div>
                )}
              </div>
            )}

            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-stone-900">Your guesses</h2>
                {trainingMode && (
                  <button
                    onClick={() => setShowAnalysis(a => !a)}
                    className="text-xs font-semibold text-pink-600 hover:text-pink-700"
                  >
                    {showAnalysis ? 'Hide analysis' : 'Analyse guesses'}
                  </button>
                )}
              </div>
              <GuessHistory guesses={myGuesses} digits={digits} showAnalysis={trainingMode && showAnalysis} />
            </div>

            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-stone-500">Opponent's guesses</h2>
                <span className="text-stone-400 text-sm">{theirGuesses.length} so far</span>
              </div>
              <GuessHistory guesses={theirGuesses} digits={digits} />
            </div>
          </>
        )}

      </div>
    </main>
  )
}
