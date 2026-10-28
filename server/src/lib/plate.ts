// Canonical plate form: Thai letters + Arabic digits only, no separators (e.g. "กก1234").
// Same form as the insurer's value, so DB lookups compare like with like.
export function normalizePlate(input: string): string {
  return input
    .replace(/[​-‍﻿]/g, "")                                   // 1. zero-width chars from copy/paste
    .replace(/[๐-๙]/g, d => String(d.charCodeAt(0) - 0x0E50))      // 2. Thai digits ๐-๙ -> 0-9
    .replace(/[\s\-.]/g, "")                                                 // 3. spaces, dashes, dots
}

export type ParsedPlate = { plate: string; province?: string }

// Strict: the WHOLE message must be a plate, so chat that merely mentions one returns null.
// Shape: optional leading digit + 1-3 Thai consonants + 1-4 digits.
export function parsePlate(text: string): ParsedPlate | null {
  const plate = normalizePlate(text)
  if (!/^\d?[ก-ฮ]{1,3}\d{1,4}$/.test(plate)) return null
  return { plate }   // province comes later
}
