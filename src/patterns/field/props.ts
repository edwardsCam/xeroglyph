export const _COLOR_SCHEMES_ = [
  'oceanscape',
  'iceland',
  'fiery furnace',
] as const
export const _NOISE_MODE_ = ['simplex', 'perlin', 'curl', 'image'] as const
export const _DRAW_MODE_ = ['streams', 'outlines', 'dots', 'fluid'] as const
export const _CONSTRAINT_MODE_ = ['rect', 'circle'] as const
export const _COLOR_MODE_ = [
  'sectors',
  'angular',
  'random from scheme',
  'random',
  'monochrome',
] as const
export const _LINE_SORT_ = [
  'long',
  'short',
  'random',
  'quadratic',
  'none',
] as const

export type ColorScheme = typeof _COLOR_SCHEMES_[number]
export type NoiseMode = typeof _NOISE_MODE_[number]
export type DrawMode = typeof _DRAW_MODE_[number]
export type ConstraintMode = typeof _CONSTRAINT_MODE_[number]
export type ColorMode = typeof _COLOR_MODE_[number]
export type LineSort = typeof _LINE_SORT_[number]

export type Props = {
  allowGrowthOutsideRadius: boolean
  avoidanceRadius: number
  background: string
  colorMode: ColorMode
  colorScheme: ColorScheme
  constraintMode: ConstraintMode
  constraintRadius: number
  continuation: number
  density: number
  distortion: number
  dotSkip: number
  drawMode: DrawMode
  lineLength: number
  lineSort: LineSort
  maxWidth: number
  minLineLength: number
  minWidth: number
  monochromeColor: string
  n: number
  noise: number
  noiseMode: NoiseMode
  outlineWidth: number
  randomWidths: boolean
  rectXSize: number
  rectYSize: number
  showImage: boolean
  squareCap: boolean
}
