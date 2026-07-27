export default (value) => {
  if (value === null || value === undefined || value === '') {
    return false
  }
  if (Array.isArray(value) && value.length === 0) {
    return false
  }
  return true
}
