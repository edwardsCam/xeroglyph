import { randomInRange } from './math'

export const randomColor = (): [number, number, number] => [
  randomInRange(0, 255, true),
  randomInRange(0, 255, true),
  randomInRange(0, 255, true),
]

export const sanitizeHex = (str: string): string =>
  str.startsWith('#') ? str : '#' + str

export const rgbToDecimal = (r: number, g: number, b: number): number => {
  const _r = r * 256 * 256
  const _g = g * 256
  const _b = b
  return _r + _g + _b
}
