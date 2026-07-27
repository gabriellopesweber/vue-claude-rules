export default (value, args) => {
  if (!value) return true // let required handle empty
  return String(value) === String(args?.[0] ?? '')
}
