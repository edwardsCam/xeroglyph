const arrowSquare = (s) => {
  return {
    draw: ({ start, padding, height, color, flipped }) => {
      s.stroke(...color)

      const { x: x0, y: y0 } = start
      const xp0 = x0 + padding
      const yp0 = y0 + padding

      const x1 = x0 + height
      const y1 = y0 + height
      const xp1 = x1 - padding
      const yp1 = y1 - padding

      const midX = x0 + height / 2
      const midY = y0 + height / 2

      if (flipped) {
        s.line(xp1, yp0, xp0, yp1)
        s.line(midX, yp0, xp1, yp0)
        s.line(xp1, yp0, xp1, midY)
        s.line(xp0, midY, xp0, yp1)
        s.line(xp0, yp1, midX, yp1)
        s.line(
          (xp1 + midX + midX) / 3,
          (yp1 + midY + midY) / 3,
          (xp0 + midX + midX) / 3,
          (yp0 + midY + midY) / 3
        )
      } else {
        s.line(xp0, yp0, xp1, yp1)
        s.line(xp0, yp0, xp0, midY)
        s.line(xp0, yp0, midX, yp0)
        s.line(xp1, yp1, xp1, midY)
        s.line(xp1, yp1, midX, yp1)
        s.line(
          (xp0 + midX + midX) / 3,
          (yp1 + midY + midY) / 3,
          (xp1 + midX + midX) / 3,
          (yp0 + midY + midY) / 3
        )
      }
    },
  }
}

export default arrowSquare
