export default (value, args) => {
  if (value === null || value === undefined || value === '') return true // let required handle empty
  const max = Number(args[0])
  if (isNaN(max)) return true
  return Number(value) <= max
}
