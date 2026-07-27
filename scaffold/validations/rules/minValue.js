export default (value, args) => {
  if (value === null || value === undefined || value === '') return true // let required handle empty
  const min = Number(args[0])
  if (isNaN(min)) return true
  return Number(value) >= min
}
