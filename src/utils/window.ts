import { Point } from 'utils/math.ts'

export const getCenter = (): Point => ({
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
})

export const getBoundedSize = (): number =>
  Math.min(window.innerHeight, window.innerWidth)
