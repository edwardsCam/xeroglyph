import { Point, progressAlongLine } from 'utils/math.ts'

export type Triangle = [Point, Point, Point]

export type Line = [Point, Point]

export type Grid = {
  s1: Line[]
  s2: Line[]
  s3: Line[]
}

export const _PATTERNS = ['Zectangle', 'Page 71'] as const

export type Props = {
  pattern: typeof _PATTERNS[number]
  len: number
  innerWeight: number
  borderWeight: number
  n: number
  degree: number
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

export const drawTriangle = (
  s: any,
  [p1, p2, p3]: Triangle,
  width: number = 1
): void => {
  s.push()
  s.strokeWeight(width)
  s.line(p1.x, p1.y, p2.x, p2.y)
  s.line(p2.x, p2.y, p3.x, p3.y)
  s.line(p3.x, p3.y, p1.x, p1.y)
  s.pop()
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
