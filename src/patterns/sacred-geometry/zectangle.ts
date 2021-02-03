// based on this reddit post: https://www.reddit.com/r/oddlysatisfying/comments/90t9oe/zectangles/

import {
  Props,
  drawHex,
  addTimeout,
  clearTimeouts,
  drawLine as _drawLine,
} from './common'
import { Point, progressAlongLine, distance } from 'utils/math'
import { HexData, hexGrid } from 'utils/hex'
import Scribble from '../../p5.scribble'

export default (s, props: Props) => {
  const drawLine = (p1: Point, p2: Point) => _drawLine(p1, p2, s, scribble)

  const drawSquare = (tl: Point, tr: Point, br: Point, bl: Point) => {
    s.push()
    s.strokeWeight(props.strokeWeight)
    drawLine(tl, tr)
    drawLine(tr, br)
    drawLine(br, bl)
    drawLine(bl, tl)
    s.pop()
  }

  const drawZexagon = (hex: HexData, degree: number, inverted: boolean) => {
    s.push()
    s.strokeWeight(props.strokeWeight)
    drawHex(hex.corners, s, scribble)

    if (degree === 0) return
    const p = 1 / degree
    if (p >= 1) return

    let corners: Point[] = [...hex.corners]
    const hexes: Point[][] = []
    while (true) {
      const size = distance(corners[0], corners[1])
      if (size < 1) break
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
      addTimeout(() => {
        s.push()
        s.strokeWeight(props.strokeWeight)
        drawHex(hex, s, scribble)
        s.pop()
      }, i * 10)
    })
    s.pop()
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
    // drawSquare(topLeft, topRight, botRight, botLeft)

    if (degree === 0) return
    const p = 1 / degree
    if (p >= 1) return

    let corners: [Point, Point, Point, Point] = [
      topLeft,
      topRight,
      botRight,
      botLeft,
    ]
    const squares: [Point, Point, Point, Point][] = []
    while (true) {
      const size = distance(corners[0], corners[1])
      if (size < 1) break
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
      addTimeout(() => {
        drawSquare(...square)
      }, i * 50)
    })
  }

  clearTimeouts()

  const { len, degree, shape, roughness } = props
  if (len === 0) return

  let scribble: Scribble
  if (roughness > 0) {
    scribble = new Scribble(s)
    scribble.roughness = roughness
  }

  s.push()
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
        addTimeout(() => {
          const x = c * len
          const y = r * len
          const inverted = !((r + c) % 2)
          drawZectangle({ x, y }, len, degree, inverted)
        })
      })
  } else if (shape === 'hex') {
    const hexLen = len / Math.sqrt(3)
    const rows = Math.ceil(window.innerHeight / hexLen)
    const cols = Math.ceil(window.innerWidth / hexLen)
    const hexes = hexGrid(hexLen, cols, rows)
    hexes.forEach((hex, i) => {
      addTimeout(() => {
        drawZexagon(hex, degree, !(i % 2))
      })
    })
  }
  s.pop()
}
