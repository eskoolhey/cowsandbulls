'use client'
import { useRouter } from 'next/navigation'

export default function RulesPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">

        <button onClick={() => router.push('/')} className="text-stone-500 hover:text-stone-800 text-sm">
          ← Back
        </button>

        <h1 className="text-4xl font-bold text-stone-900">How to play</h1>

        <div className="card space-y-4">
          <h2 className="font-semibold text-lg text-stone-900">The basics</h2>
          <p className="text-stone-600 leading-relaxed">
            Each player secretly picks a number with all unique digits — 0 through 9,
            no repeats, and it can't start with zero. You can choose 4 or 5 digits long.
          </p>
          <p className="text-stone-600 leading-relaxed">
            Once both players are ready, you take turns guessing each other's number.
            After every guess, you're told how close you got using two pieces of information:
            cows and bulls.
          </p>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-lg text-stone-900">Cows and bulls explained</h2>

          <div className="flex items-start gap-3">
            <span className="badge-cow shrink-0">Cow</span>
            <p className="text-stone-600 text-sm pt-0.5">
              The total number of digits in your guess that also appear somewhere in the secret number — regardless of position.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="badge-bull shrink-0">Bull</span>
            <p className="text-stone-600 text-sm pt-0.5">
              The number of digits in your guess that are both correct and in the exact right position. Bulls are always counted within cows — a bull is a cow that's also placed correctly.
            </p>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-lg text-stone-900">Example</h2>
          <p className="text-stone-600 text-sm">Secret number: <span className="font-mono text-stone-900 font-semibold">4271</span></p>
          <p className="text-stone-600 text-sm">Your guess: <span className="font-mono text-stone-900 font-semibold">1234</span></p>
          <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm text-stone-600">
            <p><span className="font-mono font-semibold">2</span> is in the secret, and it's in the correct position (3rd digit) → counts as a cow and a bull</p>
            <p><span className="font-mono font-semibold">1</span> is in the secret but in the wrong position → counts as a cow only</p>
            <p><span className="font-mono font-semibold">4</span> is in the secret but in the wrong position → counts as a cow only</p>
            <p><span className="font-mono font-semibold">3</span> doesn't appear in the secret at all</p>
          </div>
          <p className="text-stone-600 text-sm">
            Result: <span className="badge-cow mr-2">3 cows</span><span className="badge-bull">1 bull</span>
          </p>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-lg text-stone-900">Training mode</h2>
          <p className="text-stone-600 leading-relaxed">
            Want help thinking through your guesses? Turn on Training Mode during a game to unlock two tools: a button that analyses what each guess revealed, and a button that suggests a strong next guess based on your own guess history.
          </p>
          <p className="text-stone-600 leading-relaxed">
            In 2-player games, training mode is visible to your opponent whenever it's switched on — so it's always a fair, transparent choice for both players.
          </p>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold text-lg text-stone-900">Winning</h2>
          <p className="text-stone-600 leading-relaxed">
            You win the moment your guess scores all bulls — meaning every digit is correct and in the right position. In a head-to-head game, the first player to do this wins.
          </p>
        </div>

        <button onClick={() => router.push('/')} className="btn-primary w-full">
          Start playing
        </button>

      </div>
    </main>
  )
}
