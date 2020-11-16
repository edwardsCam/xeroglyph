// based on this reddit post: https://www.reddit.com/r/oddlysatisfying/comments/90t9oe/zectangles/

import { Props } from './common'
import { Point, progressAlongLine, distance } from 'utils/math'
import { HexData, hexGrid } from 'utils/hex'

let timeouts: NodeJS.Timeout[] = []

export default (s, props: Props) => {
  const drawSquare = (tl: Point, tr: Point, br: Point, bl: Point) => {
    s.line(tl.x, tl.y, tr.x, tr.y)
    s.line(tr.x, tr.y, br.x, br.y)
    s.line(br.x, br.y, bl.x, bl.y)
    s.line(bl.x, bl.y, tl.x, tl.y)
  }

  const drawHex = (corners: Point[]): void => {
    corners.forEach((corner, i) => {
      const nextCorner = i === corners.length - 1 ? corners[0] : corners[i + 1]
      s.line(corner.x, corner.y, nextCorner.x, nextCorner.y)
    })
  }

  const drawZexagon = (hex: HexData, degree: number, inverted: boolean) => {
    drawHex(hex.corners)

    if (degree === 0) return
    const p = 1 / degree
    if (p >= 1) return

    let corners: Point[] = [...hex.corners]
    const minLen = len / (degree * 2)
    const hexes: Point[][] = []
    while (true) {
      const size = distance(corners[0], corners[1])
      if (size < minLen) break

      if (inverted) {
        corners = [
          progressAlongLine(corners[1], corners[0], p),
          progressAlongLine(corners[2], corners[1], p),
          progressAlongLine(corners[3], corners[2], p),
          progressAlongLine(corners[4], corners[3], p),
          progressAlongLine(corners[5], corners[4], p),
          progressAlongLine(corners[0], corners[5], p),
        ]
      } else {
        corners = [
          progressAlongLine(corners[0], corners[1], p),
          progressAlongLine(corners[1], corners[2], p),
          progressAlongLine(corners[2], corners[3], p),
          progressAlongLine(corners[3], corners[4], p),
          progressAlongLine(corners[4], corners[5], p),
          progressAlongLine(corners[5], corners[0], p),
        ]
      }
      hexes.push(corners)
    }
    hexes.forEach((hex, i) => {
      timeouts.push(
        setTimeout(() => {
          drawHex(hex)
        }, i * 10)
      )
    })
  }

  const drawZectangle = (
    corner: Point,
    len: number,
    degree: number,
    inverted: boolean
  ) => {
    const topLeft = corner
    const topRight: Point = {
      x: corner.x + len,
      y: corner.y,
    }
    const botRight: Point = {
      x: corner.x + len,
      y: corner.y + len,
    }
    const botLeft: Point = {
      x: corner.x,
      y: corner.y + len,
    }
    drawSquare(topLeft, topRight, botRight, botLeft)

    if (degree === 0) return
    const p = 1 / degree
    if (p >= 1) return

    let corners: [Point, Point, Point, Point] = [
      topLeft,
      topRight,
      botRight,
      botLeft,
    ]
    const minLen = len / (degree * 2)
    const squares: [Point, Point, Point, Point][] = []
    while (true) {
      const size = distance(corners[0], corners[1])
      if (size < minLen) break
      if (inverted) {
        corners = [
          progressAlongLine(corners[1], corners[0], p),
          progressAlongLine(corners[2], corners[1], p),
          progressAlongLine(corners[3], corners[2], p),
          progressAlongLine(corners[0], corners[3], p),
        ]
      } else {
        corners = [
          progressAlongLine(corners[0], corners[1], p),
          progressAlongLine(corners[1], corners[2], p),
          progressAlongLine(corners[2], corners[3], p),
          progressAlongLine(corners[3], corners[0], p),
        ]
      }
      squares.push(corners)
    }
    squares.forEach((square, i) => {
      timeouts.push(
        setTimeout(() => {
          drawSquare(...square)
        }, i * 50)
      )
    })
  }

  timeouts.forEach((timeout) => clearTimeout(timeout))
  timeouts = []

  const { len, degree, shape } = props
  if (len === 0) return

  if (shape === 'square') {
    const rows = Math.ceil(window.innerHeight / len)
    const cols = Math.ceil(window.innerWidth / len)
    const points: { r: number; c: number }[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        points.push({ r, c })
      }
    }

    points
      .sort((a, b) => a.r * a.c - b.r * b.c)
      .forEach(({ r, c }) => {
        timeouts.push(
          setTimeout(() => {
            const x = c * len
            const y = r * len
            const inverted = !((r + c) % 2)
            drawZectangle({ x, y }, len, degree, inverted)
          }, 0)
        )
      })
  } else if (shape === 'hex') {
    const hexLen = len / Math.sqrt(3)
    const rows = Math.ceil(window.innerHeight / hexLen)
    const cols = Math.ceil(window.innerWidth / hexLen)
    const hexes = hexGrid(hexLen, cols, rows)
    hexes.forEach((hex, i) => {
      timeouts.push(
        setTimeout(() => {
          drawZexagon(hex, degree, !(i % 2))
        }, 0)
      )
    })
  }
}
