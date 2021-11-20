import { defineGrid, extendHex, Hex } from 'honeycomb-grid'
import Scribble from '../p5.scribble'

export type HexData = {
  raw: Hex<{ size: number }>
  rectCorner: Point
  corners: Point[]
  center: Point
  apothem: number
  rectLen: number
  sideLen: number
}

export const hexGrid = (
  sideLen: number,
  width: number,
  height: number,
  orientation: 'pointy' | 'flat' = 'pointy'
): HexData[] => {
  const Hex = extendHex({
    size: sideLen,
    orientation,
    start: { x: 1000, y: 0 },
  })
  const Grid = defineGrid(Hex)
  const rect = Grid.rectangle({ width, height })
  return rect.map((hex) => {
    const rectCorner = hex.toPoint()
    const corners = hex.corners().map((corner) => corner.add(rectCorner))
    const apothem = (sideLen * Math.sqrt(3)) / 2
    const center: Point = {
      x: corners[2].x,
      y: corners[0].y + apothem / 2,
    }
    return {
      raw: hex,
      rectCorner: {
        x: rectCorner.x,
        y: rectCorner.y,
      },
      corners,
      center,
      apothem,
      rectLen: apothem * 2,
      sideLen,
    }
  }) as HexData[]
}

export const drawHex = (
  corners: Point[],
  s: any,
  scribble?: Scribble
): void => {
  const drawLine = (p1: Point, p2: Point, s: any, scribble?: Scribble) => {
    if (scribble) {
      scribble.scribbleLine(p1.x, p1.y, p2.x, p2.y)
    } else {
      s.line(p1.x, p1.y, p2.x, p2.y)
    }
  }

  corners.forEach((corner, i) => {
    const nextCorner = i === corners.length - 1 ? corners[0] : corners[i + 1]
    drawLine(corner, nextCorner, s, scribble)
  })
}

export const spaceHexes = (hexes: HexData[], spacing: number): HexData[] => {
  const clone = [...hexes]
  const addSpacing = (val: number, mult: number, skip = false): number =>
    val + mult * spacing + (skip ? spacing / 2 : 0)
  debugger
  return clone.map((hex) => {
    const { raw, center, corners, rectCorner } = hex
    const { x: xCol, y: yCol } = raw
    const isOddY = !!(yCol % 2)
    return {
      ...hex,
      center: {
        x: addSpacing(center.x, xCol, isOddY),
        y: addSpacing(center.y, yCol),
      },
      corners: corners.map((c) => ({
        x: addSpacing(c.x, xCol, isOddY),
        y: addSpacing(c.y, yCol),
      })),
      rectCorner: {
        x: addSpacing(rectCorner.x, xCol, isOddY),
        y: addSpacing(rectCorner.y, yCol),
      },
    }
  })
}
