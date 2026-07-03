// Score a guess against a secret number
export function scoreGuess(guess, secret) {
  let cows = 0, bulls = 0
  for (let i = 0; i < guess.length; i++) {
    if (secret.includes(guess[i])) cows++
    if (guess[i] === secret[i]) bulls++
  }
  return { cows, bulls }
}

export function validateNumber(val, digits) {
  if (!/^\d+$/.test(val)) return 'Numbers only'
  if (val.length !== digits) return `Must be exactly ${digits} digits`
  if (val[0] === '0') return 'Cannot start with 0'
  if (new Set(val).size !== digits) return 'All digits must be unique'
  return null
}

export function generateCandidates(digits) {
  const candidates = []
  const min = digits === 4 ? 1023 : 10234
  const max = digits === 4 ? 9876 : 98765
  for (let i = min; i <= max; i++) {
    const s = String(i)
    if (s.length === digits && new Set(s).size === digits) {
      candidates.push(s)
    }
  }
  return candidates
}

export function filterCandidates(candidates, guess, cows, bulls) {
  return candidates.filter(c => {
    const s = scoreGuess(guess, c)
    return s.cows === cows && s.bulls === bulls
  })
}

export function pickBestGuess(candidates) {
  if (candidates.length <= 2) return candidates[0]
  let bestGuess = null, bestWorst = Infinity
  const pool = candidates.length <= 20 ? candidates : candidates.slice(0, 400)
  for (const g of pool) {
    const buckets = {}
    for (const c of candidates) {
      const s = scoreGuess(g, c)
      const key = `${s.cows},${s.bulls}`
      buckets[key] = (buckets[key] || 0) + 1
    }
    const worst = Math.max(...Object.values(buckets))
    if (worst < bestWorst) { bestWorst = worst; bestGuess = g }
  }
  return bestGuess
}

export function generateSecret(digits) {
  const pool = '0123456789'.split('').sort(() => Math.random() - 0.5)
  const first = pool.find(d => d !== '0')
  const rest = pool.filter(d => d !== first).slice(0, digits - 1)
  return first + rest.join('')
}

export function analyseProbe(prevGuess, prevCows, prevBulls, newGuess, newCows, newBulls) {
  if (!prevGuess) return null
  const diffs = []
  for (let i = 0; i < newGuess.length; i++) {
    if (newGuess[i] !== prevGuess[i]) diffs.push(i)
  }
  const dc = newCows - prevCows
  const db = newBulls - prevBulls

  if (diffs.length === 1) {
    const pos = diffs[0], oldD = prevGuess[pos], newD = newGuess[pos]
    if (dc > 0 && db > 0) return `Swapping ${oldD}→${newD} at position ${pos+1}: ${newD} is in the secret AND in the right place.`
    if (dc > 0 && db === 0) return `Swapping ${oldD}→${newD} at position ${pos+1}: ${newD} is in the secret but wrong position.`
    if (dc < 0 && db === 0) return `Swapping ${oldD}→${newD} at position ${pos+1}: ${oldD} was in the secret; ${newD} is not.`
    if (dc < 0 && db < 0) return `Swapping ${oldD}→${newD} at position ${pos+1}: ${oldD} was correct there (a bull).`
    if (dc === 0 && db > 0) return `Swapping ${oldD}→${newD} at position ${pos+1}: ${newD} is correct there; ${oldD} was in the secret elsewhere.`
    if (dc === 0 && db < 0) return `Swapping ${oldD}→${newD} at position ${pos+1}: ${oldD} was the bull; ${newD} is still in the secret somewhere.`
    return `Swapping ${oldD}→${newD} at position ${pos+1}: no score change — they cancel each other out.`
  }

  if (diffs.length === 2 && newGuess[diffs[0]] === prevGuess[diffs[1]] && newGuess[diffs[1]] === prevGuess[diffs[0]]) {
    if (db > 0) return `Swapping positions ${diffs[0]+1} & ${diffs[1]+1}: at least one digit is now correctly placed.`
    if (db < 0) return `Swapping positions ${diffs[0]+1} & ${diffs[1]+1}: original positions were better.`
    return `Swapping positions ${diffs[0]+1} & ${diffs[1]+1}: no bull change — neither position correct either way.`
  }

  return null
}
