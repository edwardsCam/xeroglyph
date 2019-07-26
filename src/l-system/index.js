const generate = (input, generationRules, n) => (
  n < 1 ? input : generate(
    input.split('').reduce((str, char) => (
      str + (generationRules[char] || char)
    ), ''),
    generationRules,
    n - 1
  )
)

export default generate
