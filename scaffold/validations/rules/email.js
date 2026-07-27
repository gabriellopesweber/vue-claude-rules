export default (value) => {
  if (!value) return true // Let 'required' handle empty strings
  const regex = /.+@.+\..+/
  return regex.test(String(value))
}
