// -------------------------------------------------------------------------------------
// Input masks (shared by the time & datetime widgets)
// -------------------------------------------------------------------------------------

/**
 * Mask raw input into a time string: keep digits only, cap at 4 (HH:mm) or 6 (HH:mm:ss),
 * and insert the ':' separators. Typing "1430" -> "14:30"; deleting reflows naturally.
 */
export const maskTime = (raw: string, seconds = false): string => {
  const digits = raw.replace(/\D/g, '').slice(0, seconds ? 6 : 4)
  const parts = [digits.slice(0, 2)]
  if (digits.length > 2) parts.push(digits.slice(2, 4))
  if (seconds && digits.length > 4) parts.push(digits.slice(4, 6))
  return parts.join(':')
}
