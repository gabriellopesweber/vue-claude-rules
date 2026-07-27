export default (value) => {
  if (!value) return true // let required handle empty
  return /[0-9]/.test(String(value))
}
