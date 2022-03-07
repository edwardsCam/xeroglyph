import {
  Props,
  addTimeout,
  clearTimeouts,
  drawLine as _drawLine,
} from './common'
import { progressAlongLine, distance } from 'utils/math'
import { HexData, hexGrid, drawHex, spaceHexes } from 'utils/hex'
import pushpop from 'utils/pushpop'
import Scribble from '../../p5.scribble'

export default (s, props: Props) => {
  const drawLine = (p1: Point, p2: Point) => _drawLine(p1, p2, s, scribble)

  const drawSquare = (tl: Point, tr: Point, br: Point, bl: Point) => {
    pushpop(s, () => {
      s.strokeWeight(props.strokeWeight)
      drawLine(tl, tr)
      drawLine(tr, br)
      drawLine(br, bl)
      drawLine(bl, tl)
    })
  }

  const drawZexagon = (
    hex: HexData,
    degree: number,
    max: number,
    inverted: boolean
  ) => {
    pushpop(s, () => {
      s.strokeWeight(props.strokeWeight)
      drawHex(hex.corners, s, scribble)

      if (degree === 0) return
      const p = 1 / degree
      if (p >= 1) return

      let corners: Point[] = [...hex.corners]
      const hexes: Point[][] = []
      let count = -1
      while (++count < max) {
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
          pushpop(s, () => {
            s.strokeWeight(props.strokeWeight)
            drawHex(hex, s, scribble)
          })
        }, i * 10)
      })
    })
  }

  const drawZectangle = (
    corner: Point,
    len: number,
    degree: number,
    max: number,
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
    let count = -1
    while (count++ < max) {
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

  const { len, degree, shape, roughness, max, spacing } = props
  if (len === 0) return

  let scribble: Scribble
  if (roughness > 0) {
    scribble = new Scribble(s)
    scribble.roughness = roughness
  }

  pushpop(s, () => {
    if (shape === 'square') {
      const rows = Math.ceil(window.innerHeight / (len + spacing))
      const cols = Math.ceil(window.innerWidth / (len + spacing))
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
            const x = c * len + spacing * c
            const y = r * len + spacing * r
            const inverted = !((r + c) % 2)
            drawZectangle({ x, y }, len, degree, max, inverted)
          })
        })
    } else if (shape === 'hex') {
      const hexLen = len / Math.sqrt(3)
      const rows = Math.ceil(window.innerHeight / hexLen)
      const cols = Math.ceil(window.innerWidth / hexLen)
      const hexes = spaceHexes(hexGrid(hexLen, cols, rows), props.spacing)
      hexes.forEach((hex, i) => {
        addTimeout(() => {
          drawZexagon(hex, degree, max, !(i % 2))
        })
      })
    }
  })
}
