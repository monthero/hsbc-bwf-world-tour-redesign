const letters = (w: string) => w.replace(/[^\p{L}]/gu, '')
const isUpper = (w: string) => /\p{L}/u.test(w) && w === w.toUpperCase()

export const isSurnameWord = (w: string) => isUpper(w) && letters(w).length > 1

export const cleanName = (name: string) => name.replace(/\s+/g, ' ').trim()

export const nameIssue = (name: string): string | null => {
  const words = cleanName(name).split(' ').filter(Boolean)
  if (!words.length) return 'Enter a name'
  const marks = words.map(isSurnameWord)
  const first = marks.indexOf(true)
  const last = marks.lastIndexOf(true)
  if (first < 0) return 'Write the surname in UPPERCASE, e.g. YOO Tae-bin'
  if (words.length > 1 && marks.every(Boolean)) return 'Write the given name in normal case, e.g. YOO Tae-bin'
  if (marks.slice(first, last + 1).includes(false) || (first > 0 && last < words.length - 1))
    return 'Keep the UPPERCASE surname together at the start or the end'
  return null
}
