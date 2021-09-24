type CharAndString = {
  [char: string]: string
}

export const generate = (
  input: string,
  generationRules: CharAndString,
  n: number
) => {
  if (n < 1) return input
  return generate(
    input
      .split('')
      .reduce((str, char) => str + (generationRules[char] || char), ''),
    generationRules,
    n - 1
  )
}

export const parseRules = (str: string): CharAndString => {
  const split = str.trim().split('\n')
  return split.reduce((obj, line) => {
    const [char = '', rule = ''] = line.split(':')
    if (!char) return obj
    return {
      ...obj,
      [char.trim()]: rule.trim(),
    }
  }, {} as CharAndString)
}
