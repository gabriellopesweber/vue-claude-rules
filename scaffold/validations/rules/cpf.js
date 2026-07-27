export default (value) => {
  if (!value) return true
  const d = value.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const check = (slice, factor) => {
    const sum = [...slice].reduce((acc, n, i) => acc + parseInt(n) * (factor - i), 0)
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }
  return check(d.slice(0, 9), 10) === parseInt(d[9]) &&
    check(d.slice(0, 10), 11) === parseInt(d[10])
}
