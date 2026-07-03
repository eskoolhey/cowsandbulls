'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { scoreGuess, generateCandidates, filterCandidates, pickBestGuess } from '@/lib/game'
import NumberInput from '@/components/NumberInput'
import GuessHistory from '@/components/GuessHistory'
import { TrainingToggle, OpponentTrainingNotice } from '@/components/TrainingMode'

function derivePhase(room, role) {
  if (!room || !role) return 'loading'
  if (room.status === 'won') return 'won'
  if (room.status === 'waiting') return role === 'player1' ? 'waiting' : 'setup'
  // status is 'setup' or 'playing'
  const myReady = role === 'player1' ? room.player1_ready : room.player2_ready
  if (!myReady) return 'setup'
  if (room.status === 'playing') return 'playing'
  // both not ready yet but room is setup
  return 'setup'
}

export default function GamePage() {
  const router = useRouter()
  const { roomCode } = useParams()
  const code = roomCode?.toUpperCase()

  const [room, setRoom] = useState(null)
  const [role, setRole] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [trainingMode, setTrainingModeLocal] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const channelRef = useRef(null)

  // Derive everything from room + role — no separate phase state
  const phase = derivePhase(room, role)
  const digits = room?.digits || 5
  const myGuessesKey = role === 'player1' ? 'player1_guesses' : 'player2_guesses'
  const theirGuessesKey = role === 'player1' ? 'player2_guesses' : 'player1_guesses'
  const mySecretKey = role === 'player1' ? 'player1_secret' : 'player2_secret'
  const theirSecretKey = role === 'player1' ? 'player2_secret' : 'player1_secret'
  const myReadyKey = role === 'player1' ? 'player1_ready' : 'player2_ready'
  const theirReadyKey = role === 'player1' ? 'player2_ready' : 'player1_ready'
  const myTrainingKey = role === 'player1' ? 'player1_training' : 'player2_training'
  const theirTrainingKey = role === 'player1' ? 'player2_training' : 'player1_training'
  const myGuesses = room?.[myGuessesKey] || []
  const theirGuesses = room?.[theirGuessesKey] || []
  const isMyTurn = room?.current_turn === role
  const theirTrainingMode = room?.[theirTrainingKey] === true

  let candidates = generateCandidates(digits)
  for (const g of myGuesses) {
    candidates = filterCandidates(candidates, g.guess, g.cows, g.bulls)
  }
  const suggestion = candidates.length > 0 ? pickBestGuess(candidates) : null

  // Step 1: get role from localStorage
  useEffect(() => {
    const r = localStorage.getItem(`cb_role_${code}`)
    if (!r) { router.push('/'); return }
    setRole(r)
  }, [code, router])

  // Step 2: load room + subscribe when role is ready
  useEffect(() => {
    if (!role) return

    async function init() {
      // Load initial room
      const { data, error: err } = await supabase
        .from('rooms').select('*').eq('code', code).single()
      if (err || !data) { setError('Room not found.'); return }

      // If player2 is joining a waiting room, transition it to setup
      if (data.status === 'waiting' && role === 'player2') {
        const { data: updated } = await supabase
          .from('rooms').update({ status: 'setup' })
          .eq('code', code).select().single()
        setRoom(updated || data)
      } else {
        setRoom(data)
      }
    }

    init()

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`room-${code}-${role}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
        payload => { setRoom(payload.new) }
      )
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [role, code])

  async function submitSecret(val) {
    const theirReady = room?.[theirReadyKey]
    const update = {
      [mySecretKey]: val,
      [myReadyKey]: true,
    }
    // If opponent already submitted their secret, start the game
    if (theirReady) {
      update.status = 'playing'
      update.current_turn = 'player1'
    }
    const { data } = await supabase
      .from('rooms').update(update).eq('code', code).select().single()
    if (data) setRoom(data)
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
    const { data } = await supabase
      .from('rooms').update(update).eq('code', code).select().single()
    if (data) setRoom(data)
    setShowSuggestion(false)
  }

  async function toggleTrainingMode() {
    const next = !trainingMode
    setTrainingModeLocal(next)
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
    const iWon = room?.winner === role
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

        {/* Waiting for opponent to also submit their secret */}
        {phase === 'setup' && room?.[myReadyKey] && !room?.[theirReadyKey] && (
          <div className="card text-center py-4">
            <p className="text-stone-500 text-sm">Number locked! Waiting for opponent to pick theirs…</p>
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

            {isMyTurn && (
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
                    <p className="text-stone-400 text-xs">{candidates.length} candidates remaining</p>
                  </div>
                )}
              </div>
            )}

            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-stone-900">Your guesses</h2>
                {trainingMode && (
                  <button onClick={() => setShowAnalysis(a => !a)} className="text-xs font-semibold text-pink-600 hover:text-pink-700">
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
