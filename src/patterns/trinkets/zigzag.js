const zigzag = (s) => {
  const drawZig = (height, padding, start, isInverted, isBookend, dir) => {
    const { x: x0, y: y0 } = start
    const xp0 = x0 + padding
    const yp0 = y0 + padding

    const x1 = x0 + height
    const y1 = y0 + height
    const xp1 = x1 - padding
    const yp1 = y1 - padding

    const midX = x0 + height / 2
    const midY = y0 + height / 2
    switch (dir) {
      case 0: // west
        if (isBookend) {
          if (isInverted) {
            // 3, west inverted bookend
            s.line(midX, yp0, x1, yp1)
          } else {
            // 1, west upright bookend
            s.line(midX, yp1, x1, yp0)
          }
        } else if (isInverted) {
          // 2, west inverted mid
          const inflection = [midX, yp0]
          s.line(x0, yp1, ...inflection)
          s.line(...inflection, x1, yp1)
        } else {
          // 0, west upright mid
          const inflection = [midX, yp1]
          s.line(x0, yp0, ...inflection)
          s.line(...inflection, x1, yp0)
        }
        break
      case 1: // north
        if (isBookend) {
          if (isInverted) {
            // 7, north inverted bookend
            s.line(xp0, y1, xp1, midY)
          } else {
            // 5, north upright bookend
            s.line(xp0, midY, xp1, y1)
          }
        } else if (isInverted) {
          // 6, north inverted mid
          const inflection = [xp1, midY]
          s.line(xp0, y0, ...inflection)
          s.line(...inflection, xp0, y1)
        } else {
          // 4, north upright mid
          const inflection = [xp0, midY]
          s.line(xp1, y0, ...inflection)
          s.line(...inflection, xp1, y1)
        }
        break
      case 2: // east
        if (isBookend) {
          if (isInverted) {
            // 11, east inverted bookend
            s.line(x0, yp0, midX, yp1)
          } else {
            // 9, east upright bookend
            s.line(x0, yp1, midX, yp0)
          }
        } else if (isInverted) {
          // 10, east inverted mid
          const inflection = [midX, yp1]
          s.line(x0, yp0, ...inflection)
          s.line(...inflection, x1, yp0)
        } else {
          // 8, east upright mid
          const inflection = [midX, yp0]
          s.line(x0, yp1, ...inflection)
          s.line(...inflection, x1, yp1)
        }
        break
      case 3: // south
        if (isBookend) {
          if (isInverted) {
            // 15, south inverted bookend
            s.line(xp1, y0, xp0, midY)
          } else {
            // 13, south upright bookend
            s.line(xp0, y0, xp1, midY)
          }
        } else if (isInverted) {
          // 14, south inverted mid
          const inflection = [xp0, midY]
          s.line(xp1, y0, ...inflection)
          s.line(...inflection, xp1, y1)
        } else {
          // 12, south upright mid
          const inflection = [xp1, midY]
          s.line(xp0, y0, ...inflection)
          s.line(...inflection, xp0, y1)
        }
        break
    }
  }

  return {
    draw: ({ height, start, padding: _p, n, isInverted, dir, color }) => {
      if (n < 2) {
        console.error('Zigzag trinket does not support single tiles!')
        return
      }
      const padding = _p * height
      s.stroke(...color)

      switch (dir) {
        case 0: // west
          const startX = (n - 1) * height + start.x
          for (let i = 0; i < n; i++) {
            const x = startX - height * i
            const { y } = start
            if (i === 0) {
              drawZig(
                height,
                padding,
                {
                  x,
                  y,
                },
                !isInverted,
                true,
                2
              )
            } else if (i === n - 1) {
              drawZig(
                height,
                padding,
                {
                  x,
                  y,
                },
                isInverted,
                true,
                0
              )
            } else {
              drawZig(
                height,
                padding,
                {
                  x,
                  y,
                },
                isInverted,
                false,
                0
              )
            }
          }
          break
        case 1: // north
          const startY = (n - 1) * height + start.y
          for (let i = 0; i < n; i++) {
            if (i === 0) {
              drawZig(
                height,
                padding,
                {
                  x: start.x,
                  y: startY - height * i,
                },
                !isInverted,
                true,
                3
              )
            } else if (i === n - 1) {
              drawZig(
                height,
                padding,
                {
                  x: start.x,
                  y: startY - height * i,
                },
                isInverted,
                true,
                1
              )
            } else {
              drawZig(
                height,
                padding,
                {
                  x: start.x,
                  y: startY - height * i,
                },
                isInverted,
                false,
                1
              )
            }
          }
          break
        case 2: // east
          for (let i = 0; i < n; i++) {
            if (i === 0) {
              drawZig(
                height,
                padding,
                {
                  x: start.x + height * i,
                  y: start.y,
                },
                !isInverted,
                true,
                0
              )
            } else if (i === n - 1) {
              drawZig(
                height,
                padding,
                {
                  x: start.x + height * i,
                  y: start.y,
                },
                isInverted,
                true,
                2
              )
            } else {
              drawZig(
                height,
                padding,
                {
                  x: start.x + height * i,
                  y: start.y,
                },
                isInverted,
                false,
                2
              )
            }
          }
          break
        case 3: // south
          for (let i = 0; i < n; i++) {
            if (i === 0) {
              drawZig(
                height,
                padding,
                {
                  x: start.x,
                  y: start.y + height * i,
                },
                !isInverted,
                true,
                1
              )
            } else if (i === n - 1) {
              drawZig(
                height,
                padding,
                {
                  x: start.x,
                  y: start.y + height * i,
                },
                isInverted,
                true,
                3
              )
            } else {
              drawZig(
                height,
                padding,
                {
                  x: start.x,
                  y: start.y + height * i,
                },
                isInverted,
                false,
                3
              )
            }
          }
          break
      }
    },
  }
}

export default zigzag
