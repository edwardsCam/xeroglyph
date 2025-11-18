export const _COLOR_SCHEMES_ = [
  'tangerine',
  'iceland',
  'oceanscape',
  'fiery furnace',
] as const
export const _NOISE_MODE_ = [
  'wavy',
  'simplex',
  'vortex',
  'curl',
  'perlin',
  'image',
] as const
export const _DRAW_MODE_ = ['streams', 'dots', 'outlines', 'fluid'] as const
export const _CONSTRAINT_MODE_ = ['rect', 'circle'] as const
export const _COLOR_MODE_ = [
  'random from scheme',
  'sectors',
  'angular',
  'random',
  'monochrome',
  'gradual',
  'image',
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
  avoidanceRadius: number
  background: string
  colorMode: ColorMode
  colorScheme: ColorScheme
  constraintMode: ConstraintMode
  constraintRadius: number
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
  squareCapPercent: number
  vortexStrength: number
  simplexStrength: number
}
