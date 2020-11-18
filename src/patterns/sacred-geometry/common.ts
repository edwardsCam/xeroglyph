import { Point, progressAlongLine, Line } from 'utils/math.ts'
import Scribble from '../../p5.scribble'

export type Triangle = [Point, Point, Point]

export type Grid = {
  s1: Line[]
  s2: Line[]
  s3: Line[]
}

export const _PATTERNS = [
  'Zectangle',
  'Snowflake',
  'Arrows',
  'Page 71',
] as const
export const _ZECTANGLE_SHAPES = ['square', 'hex'] as const

let timeouts: number[] = []
export const addTimeout = (fn: Function, timeout: number = 0) => {
  timeouts.push(setTimeout(fn, timeout))
}
export const clearTimeouts = () => {
  timeouts.forEach((timeout) => clearTimeout(timeout))
  timeouts = []
}

export type Props = {
  pattern: typeof _PATTERNS[number]
  len: number
  innerWeight: number
  strokeWeight: number
  n: number
  degree: number
  shape: typeof _ZECTANGLE_SHAPES[number]
  roughness: number
}

export const getCenter = (): Point => ({
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
})

export const getHeight = (len: number): number => (len * Math.sqrt(3)) / 2

export const getTriangle = (
  leftmostPoint: Point,
  len: number,
  inverted: boolean = false
): Triangle => {
  const h = getHeight(len)
  const { x, y } = leftmostPoint
  if (inverted) {
    const p2 = {
      x: x + len,
      y,
    }
    const p3 = {
      x: x + len / 2,
      y: y + h,
    }
    return [leftmostPoint, p2, p3]
  } else {
    const p2 = {
      x: x + len / 2,
      y: y - h,
    }
    const p3 = {
      x: x + len,
      y,
    }
    return [leftmostPoint, p2, p3]
  }
}

export const getTriangleGrid = ([p1, p2, p3]: Triangle, n: number): Grid => {
  const grid: Grid = {
    s1: [],
    s2: [],
    s3: [],
  }
  for (let i = 1; i <= n; i++) {
    const g1 = progressAlongLine(p1, p2, i / 6)
    const g2 = progressAlongLine(p1, p3, i / 6)
    grid.s1.push([g1, g2])
  }
  for (let i = 1; i <= n; i++) {
    const g1 = progressAlongLine(p2, p3, i / 6)
    const g2 = progressAlongLine(p2, p1, i / 6)
    grid.s2.push([g1, g2])
  }
  for (let i = 1; i <= n; i++) {
    const g1 = progressAlongLine(p3, p1, i / 6)
    const g2 = progressAlongLine(p3, p2, i / 6)
    grid.s3.push([g1, g2])
  }
  return grid
}

export const drawHex = (
  corners: Point[],
  s: any,
  scribble?: Scribble
): void => {
  corners.forEach((corner, i) => {
    const nextCorner = i === corners.length - 1 ? corners[0] : corners[i + 1]
    drawLine(corner, nextCorner, s, scribble)
  })
}

export const drawLine = (p1: Point, p2: Point, s: any, scribble?: Scribble) => {
  if (scribble) {
    scribble.scribbleLine(p1.x, p1.y, p2.x, p2.y)
  } else {
    s.line(p1.x, p1.y, p2.x, p2.y)
  }
}
