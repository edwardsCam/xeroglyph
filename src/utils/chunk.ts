const chunk = <T>(list: T[], chunkSize: number): T[][] => {
  if (chunkSize === 0) return []
  const chunks: T[][] = []

  for (let i = 0; i < list.length; i += chunkSize) {
    const sliced = list.slice(i, i + chunkSize)
    chunks.push(sliced)
  }

  return chunks
}

export default chunk
