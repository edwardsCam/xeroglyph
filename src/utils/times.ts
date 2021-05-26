export default <T>(n: number, callback: (i: number) => T): T[] => {
  const results: any[] = []
  for (let i = 0; i < n; i++) {
    results.push(callback(i))
  }
  return results
}
