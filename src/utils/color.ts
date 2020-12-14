import { randomInRange } from './math'

export const randomColor = (): [number, number, number] => [
  Math.floor(randomInRange(0, 255)),
  Math.floor(randomInRange(0, 255)),
  Math.floor(randomInRange(0, 255)),
]
