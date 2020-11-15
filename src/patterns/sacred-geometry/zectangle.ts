// based on this reddit post: https://www.reddit.com/r/oddlysatisfying/comments/90t9oe/zectangles/

import { Props } from './common'
import { Point, progressAlongLine, distance } from 'utils/math'

let timeouts: NodeJS.Timeout[] = []

export default (s, props: Props) => {
  const drawSquare = (tl: Point, tr: Point, br: Point, bl: Point) => {
    s.line(tl.x, tl.y, tr.x, tr.y)
    s.line(tr.x, tr.y, br.x, br.y)
    s.line(br.x, br.y, bl.x, bl.y)
    s.line(bl.x, bl.y, tl.x, tl.y)
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
      let c1: Point
      let c2: Point
      let c3: Point
      let c4: Point
      if (inverted) {
        c1 = progressAlongLine(corners[1], corners[0], p)
        c2 = progressAlongLine(corners[2], corners[1], p)
        c3 = progressAlongLine(corners[3], corners[2], p)
        c4 = progressAlongLine(corners[0], corners[3], p)
      } else {
        c1 = progressAlongLine(corners[0], corners[1], p)
        c2 = progressAlongLine(corners[1], corners[2], p)
        c3 = progressAlongLine(corners[2], corners[3], p)
        c4 = progressAlongLine(corners[3], corners[0], p)
      }
      corners = [c1, c2, c3, c4]
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

  const { len, degree } = props
  if (len === 0) return
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
          // drawZectangle(
          //   { x, y },
          //   len,
          //   Math.min(25, ((r * c) / 5) + 1.5),
          //   inverted
          // )
        }, 0)
      )
    })
}
