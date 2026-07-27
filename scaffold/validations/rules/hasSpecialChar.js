export default (value) => {
  if (!value) return true // let required handle empty
  return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/]/.test(String(value))
}
