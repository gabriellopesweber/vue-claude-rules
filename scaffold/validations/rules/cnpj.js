export default (value) => {
  if (!value) return true
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1+$/.test(digits)) return false
  let sum = 0
  let pos = 5
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * pos--
    if (pos < 2) pos = 9
  }
  let rem = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (rem !== parseInt(digits[12])) return false
  sum = 0
  pos = 6
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * pos--
    if (pos < 2) pos = 9
  }
  rem = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return rem === parseInt(digits[13])
}
