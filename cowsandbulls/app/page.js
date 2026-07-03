'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

export default function Home() {
  const router = useRouter()
  const [digits, setDigits] = useState(5)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createRoom() {
    setLoading(true)
    setError('')
    const code = generateRoomCode()
    const { error: err } = await supabase.from('rooms').insert({
      code,
      digits,
      status: 'waiting',
      player1_guesses: [],
      player2_guesses: [],
    })
    if (err) { setError('Could not create room. Try again.'); setLoading(false); return }
    localStorage.setItem(`cb_role_${code}`, 'player1')
    router.push(`/game/${code}`)
  }

  async function joinRoom() {
    setLoading(true)
    setError('')
    const code = joinCode.toUpperCase().trim()
    const { data, error: err } = await supabase.from('rooms').select('*').eq('code', code).single()
    if (err || !data) { setError('Room not found. Check the code.'); setLoading(false); return }
    if (data.status !== 'waiting') { setError('This game has already started.'); setLoading(false); return }
    localStorage.setItem(`cb_role_${code}`, 'player2')
    router.push(`/game/${code}`)
  }

  function playSolo() {
    router.push(`/solo?digits=${digits}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-stone-900">
            Cows <span className="text-pink-600">&amp;</span> Bulls
          </h1>
          <p className="text-stone-500 text-lg">Crack your opponent's number before they crack yours</p>
        </div>

        <div className="card">
          <p className="text-stone-500 text-sm font-medium mb-3">Number length</p>
          <div className="flex gap-3">
            {[4, 5].map(d => (
              <button
                key={d}
                onClick={() => setDigits(d)}
                className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
                  digits === d
                    ? 'bg-pink-600 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {d} digits
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold text-lg">Play vs a friend</h2>
          <button onClick={createRoom} disabled={loading} className="btn-primary w-full">
            Create a room
          </button>
          <div className="flex gap-2">
            <input
              className="bg-white border-2 border-stone-200 rounded-xl px-4 py-3 font-mono text-lg tracking-widest text-stone-900 focus:outline-none focus:border-pink-500 flex-1 uppercase"
              placeholder="Room code"
              maxLength={4}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinRoom()}
            />
            <button onClick={joinRoom} disabled={loading} className="btn-secondary">
              Join
            </button>
          </div>
          {error && <p className="text-rose-600 text-sm">{error}</p>}
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold text-lg">Play solo</h2>
          <p className="text-stone-500 text-sm">Guess the computer's number. No hints — pure deduction.</p>
          <button onClick={playSolo} className="btn-secondary w-full">
            Play vs computer
          </button>
        </div>

        <div className="text-center">
          <a href="/rules" className="text-pink-600 hover:text-pink-700 text-sm font-medium underline underline-offset-4">
            How to play
          </a>
        </div>

      </div>
    </main>
  )
}
