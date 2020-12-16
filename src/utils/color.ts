import { randomInRange } from './math'

export const randomColor = (): [number, number, number] => [
  randomInRange(0, 255, true),
  randomInRange(0, 255, true),
  randomInRange(0, 255, true),
]
