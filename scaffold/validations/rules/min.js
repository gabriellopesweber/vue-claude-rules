export default (value, args) => {
  if (!value) return true // let required handle empty
  const minLength = Number(args[0])
  if (isNaN(minLength)) return true
  return String(value).length >= minLength
}
