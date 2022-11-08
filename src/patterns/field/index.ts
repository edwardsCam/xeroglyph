import { init as initProps, getProp } from 'utils/propConfig'
import {
  coordWithAngleAndDistance,
  thetaFromTwoPoints,
  distance,
  interpolate,
  randomInRange,
} from 'utils/math'
import { sanitizeHex } from 'utils/color'
import SimplexNoise from 'simplex-noise'
import shuffle from 'utils/shuffle'
import pushpop from 'utils/pushpop'
import chunk from 'utils/chunk'
import {
  Props,
  _COLOR_SCHEMES_,
  _NOISE_MODE_,
  _DRAW_MODE_,
  _CONSTRAINT_MODE_,
  _COLOR_MODE_,
  _LINE_SORT_,
  ColorScheme,
} from './props'
import { getRandomImage } from '../images'

const CANVAS_MODIFIER = 1
const CANVAS_WIDTH = window.innerWidth * CANVAS_MODIFIER
const CANVAS_HEIGHT = window.innerHeight * CANVAS_MODIFIER
const CHUNK_SIZE = 3

const center: Point = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
}

type NoiseFn = (
  x: number,
  y: number
) => {
  angle?: number
  color?: [number, number, number]
}
type NumberConversionFn = (n: number) => number

const coolColors = ['#314B99', '#058FE6', '#0FFFCF', '#0296BF', '#FFF8DB']
const hotColors = ['#801100', '#D73502', '#FAC000', '#A8A9AD', '#CB4446']
const oceanScapeColors = [
  '#FF1CAC',
  '#9F63FF',
  '#6696FF',
  '#ff6edf',
  '#0FFFF3',
  '#DEFFFC',
]

const getPointFromRC = (
  r: number,
  c: number,
  xVariance: number,
  yVariance: number,
  maxN: number,
  imgBoundaries: ImgBoundaries,
  { noiseMode }: Props
): Point => {
  const xSalt = randomInRange(0, xVariance)
  const ySalt = randomInRange(0, yVariance)
  if (noiseMode === 'image') {
    const { x, y, width, height } = imgBoundaries
    return {
      x: interpolate([0, maxN], [x, x + width], c) + xSalt,
      y: interpolate([0, maxN], [y, y + height], r) + ySalt,
    }
  } else {
    return {
      x: interpolate([0, maxN], [0, CANVAS_WIDTH], c) + xSalt,
      y: interpolate([0, maxN], [0, CANVAS_HEIGHT], r) + ySalt,
    }
  }
}

const getWidth = (
  minWidth: number,
  maxWidth: number,
  random: boolean,
  progress: number
): number =>
  random
    ? interpolate([0, 1], [minWidth, maxWidth], Math.random())
    : interpolate([0, 1], [maxWidth, minWidth], progress)

const getColors = (colorScheme: ColorScheme): string[] => {
  switch (colorScheme) {
    case 'iceland':
      return coolColors
    case 'fiery furnace':
      return hotColors
    case 'oceanscape':
      return oceanScapeColors
  }
}

const randomColor = (colorScheme: ColorScheme): string => {
  const colors = getColors(colorScheme)
  return colors[Math.floor(Math.random() * (colors.length - 1))]
}

type ImgBoundaries = { x: number; y: number; width: number; height: number }

const imageBoundaries = (img: any): ImgBoundaries => {
  const height = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT)
  const aspect = img.width / img.height
  const width = height * aspect
  const x = center.x - width / 2
  const y = center.y - height / 2
  return { x, y, width, height }
}

export default (s) => {
  initProps('field', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    n: {
      type: 'number',
      default: 120,
      min: 3,
    },
    Noise: {
      type: 'number',
      default: 2,
      min: Number.NEGATIVE_INFINITY,
      step: 0.01,
      when: () => get('Noise Mode') !== 'vortex',
    },
    'Vortex Strength': {
      type: 'number',
      default: 1,
      min: Number.NEGATIVE_INFINITY,
      step: 0.01,
      when: () => {
        const noiseMode = get('Noise Mode')
        return noiseMode === 'vortex' || noiseMode === 'wavy'
      },
    },
    'Simplex Strength': {
      type: 'number',
      default: 0.25,
      min: Number.NEGATIVE_INFINITY,
      step: 0.05,
      when: () => get('Noise Mode') === 'wavy',
    },
    'Noise Mode': {
      type: 'dropdown',
      default: _NOISE_MODE_[0],
      options: [..._NOISE_MODE_],
    },
    'Draw Mode': {
      type: 'dropdown',
      default: _DRAW_MODE_[0],
      options: [..._DRAW_MODE_],
      onChange: initialize,
    },
    Distortion: {
      type: 'number',
      default: 0,
      min: 0,
      step: 0.01,
    },
    Continuation: {
      type: 'number',
      default: 1,
      min: 0,
      max: 1,
      step: 0.025,
      when: () => {
        const drawMode = get('Draw Mode')
        return drawMode === 'streams' || drawMode === 'outlines'
      },
    },
    'Min Width': {
      type: 'number',
      default: 2,
      min: 1,
    },
    'Max Width': {
      type: 'number',
      default: 6,
      min: 1,
    },
    'Random Width': {
      type: 'boolean',
      default: true,
    },
    'Square Cap': {
      type: 'boolean',
      default: false,
      when: () => get('Draw Mode') === 'streams',
    },
    'Avoidance Radius': {
      type: 'number',
      default: 2,
      step: 0.5,
      min: Number.NEGATIVE_INFINITY,
    },
    'Dot Skip': {
      type: 'number',
      default: 0,
      min: 0,
      when: () => get('Draw Mode') === 'dots',
    },
    'Constraint Mode': {
      type: 'dropdown',
      default: _CONSTRAINT_MODE_[0],
      options: [..._CONSTRAINT_MODE_],
    },
    'Constraint Radius': {
      type: 'number',
      default: Math.floor(Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2.2),
      min: 1,
      when: () => get('Constraint Mode') === 'circle',
    },
    'Allow growth outside constraint': {
      type: 'boolean',
      default: false,
    },
    'Rect X size': {
      type: 'number',
      default: CANVAS_WIDTH,
      min: 1,
      when: () => get('Constraint Mode') === 'rect',
    },
    'Rect Y size': {
      type: 'number',
      default: CANVAS_HEIGHT,
      min: 1,
      when: () => get('Constraint Mode') === 'rect',
    },
    'Color Mode': {
      type: 'dropdown',
      default: _COLOR_MODE_[0],
      options: [..._COLOR_MODE_],
    },
    'Color Scheme': {
      type: 'dropdown',
      default: _COLOR_SCHEMES_[0],
      options: [..._COLOR_SCHEMES_],
      when: () => {
        const mode = get('Color Mode')
        return mode === 'random from scheme' || mode === 'sectors'
      },
    },
    Color: {
      type: 'string',
      default: 'ffffff',
      when: () => get('Color Mode') === 'monochrome',
    },
    'Show Image': {
      type: 'boolean',
      default: false,
      when: () => get('Noise Mode') === 'image',
    },
    'Outline Width': {
      type: 'number',
      default: 3,
      when: () => get('Draw Mode') === 'outlines',
    },
    'Line Length': {
      type: 'number',
      default: 4,
      min: 1,
    },
    'Min Line Length': {
      type: 'number',
      default: 4,
      min: 0,
    },
    'Line Sort': {
      type: 'dropdown',
      default: _LINE_SORT_[0],
      options: [..._LINE_SORT_],
    },
    Background: {
      type: 'string',
      default: '#fffff7',
    },
  })
  const get = (prop: string) => getProp('field', prop)
  const getProps = (): Props => ({
    allowGrowthOutsideRadius: get('Allow growth outside constraint'),
    avoidanceRadius: get('Avoidance Radius'),
    background: get('Background'),
    colorMode: get('Color Mode'),
    colorScheme: get('Color Scheme'),
    constraintMode: get('Constraint Mode'),
    constraintRadius: get('Constraint Radius'),
    continuation: get('Continuation'),
    distortion: get('Distortion'),
    dotSkip: get('Dot Skip'),
    drawMode: get('Draw Mode'),
    lineLength: get('Line Length'),
    lineSort: get('Line Sort'),
    maxWidth: get('Max Width'),
    minLineLength: get('Min Line Length'),
    minWidth: get('Min Width'),
    monochromeColor: get('Color'),
    n: get('n'),
    noise: get('Noise'),
    vortexStrength: get('Vortex Strength'),
    simplexStrength: get('Simplex Strength'),
    noiseMode: get('Noise Mode'),
    outlineWidth: get('Outline Width'),
    randomWidths: get('Random Width'),
    rectXSize: get('Rect X size'),
    rectYSize: get('Rect Y size'),
    showImage: get('Show Image'),
    squareCap: get('Square Cap'),
  })

  let points: Point[]
  let firstPoints: Point[]
  let timeouts: NodeJS.Timeout[] = []
  let simplex: SimplexNoise
  let img
  let imgColorData = {}

  const buildStreamLines = (props: Props, noiseFn: NoiseFn): Point[][] => {
    const lines: Point[][] = []
    const {
      n,
      constraintMode,
      constraintRadius,
      noiseMode,
      rectXSize,
      rectYSize,
      lineLength,
      continuation,
      minLineLength,
    } = props

    const xVariance = CANVAS_WIDTH / (n - 1)
    const yVariance = CANVAS_HEIGHT / (n - 1)
    const imgBoundaries = imageBoundaries(img)
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const p = getPointFromRC(
          r,
          c,
          xVariance,
          yVariance,
          n - 1,
          imgBoundaries,
          props
        )
        if (constraintMode === 'circle') {
          if (distance(p, center) >= constraintRadius) {
            continue
          }
        } else if (constraintMode === 'rect') {
          if (
            Math.abs(center.x - p.x) * 2 >= rectXSize ||
            Math.abs(center.y - p.y) * 2 >= rectYSize
          ) {
            continue
          }
        }

        lines.push([])
        const last = lines.length - 1
        while (
          Math.random() < continuation - 0.01 &&
          inBounds(p, imgBoundaries, props)
        ) {
          const { angle, color } = noiseFn(p.x, p.y)
          if (angle == null) break

          if (color && noiseMode === 'image') {
            const _x = Math.floor(p.x)
            const _y = Math.floor(p.y)
            if (!imgColorData[_x]) {
              imgColorData[_x] = {}
            }
            const [r, g, b] = color
            const colorData = s.color(`rgb(${r}, ${g}, ${b})`)
            imgColorData[_x][_y] = [
              s.hue(colorData),
              s.saturation(colorData),
              s.brightness(colorData),
            ]
          }
          const nextP = coordWithAngleAndDistance(p, angle, lineLength)
          lines[last].push(nextP)
          p.x = nextP.x
          p.y = nextP.y
        }
      }
    }
    return minLineLength > 0
      ? lines.filter((line) => line.length >= minLineLength)
      : lines
  }

  const setColor = (
    { colorMode, colorScheme, monochromeColor }: Props,
    x: number,
    y: number,
    type: 'stroke' | 'fill',
    {
      angle,
      progress,
    }: {
      angle?: number
      progress?: number
    }
  ): void => {
    const interpolateColor = (val: number) => {
      const salt = interpolate(
        [0, CANVAS_WIDTH + CANVAS_HEIGHT],
        [-40, 40],
        x + y
      )
      const domain: [number, number] = [0, 1]
      setFn(
        Math.floor(interpolate(domain, [173, 57], val) + salt),
        Math.floor(interpolate(domain, [14, 30], val)),
        Math.floor(interpolate(domain, [65, 100], val))
      )
    }

    const setFn =
      type === 'stroke'
        ? (...args) => s.stroke(...args)
        : (...args) => s.fill(...args)
    if (colorMode === 'monochrome') {
      setFn(sanitizeHex(monochromeColor))
    } else if (colorMode === 'random from scheme') {
      setFn(randomColor(colorScheme))
    } else if (colorMode === 'sectors') {
      const colors = getColors(colorScheme)
      const colorNoise: number = s.noise(x / 200, y / 100)
      const quadrant = Math.floor(
        interpolate([0, 1], [0, colors.length - 1], colorNoise)
      )
      setFn(`${colors[quadrant]}`)
    } else if (colorMode === 'angular' && angle != null) {
      interpolateColor(Math.sin(angle / 2 + Math.PI / 2))
    } else if (colorMode === 'gradual' && progress != null) {
      interpolateColor(progress)
    } else if (colorMode === 'image') {
      const colorData = getImageColorAtPixel({ x, y })
      type === 'stroke' ? s.stroke(colorData) : s.fill(colorData)
    } else if (colorMode === 'random') {
      setFn(
        Math.floor(interpolate([0, 1], [0, 360], Math.random())),
        Math.floor(interpolate([0, 1], [70, 100], Math.random())),
        Math.floor(interpolate([0, 1], [70, 100], Math.random()))
      )
    }
  }

  const drawStreams = (
    props: Props,
    noiseFn: NoiseFn,
    beforeDraw?: () => any
  ) => {
    const {
      minWidth,
      maxWidth,
      avoidanceRadius,
      colorMode,
      drawMode,
      dotSkip,
      lineSort,
      minLineLength,
      randomWidths,
    } = props

    const drawnPoints: {
      point: Point
      width: number
    }[] = []

    const isClaimed = (
      p: Point,
      pIdx: number,
      pointWidth: number,
      line: Point[]
    ): boolean =>
      drawnPoints.some(({ point: otherPoint, width: otherPointWidth }) => {
        if (
          p.x < 10 ||
          p.y < 10 ||
          p.x > CANVAS_WIDTH - 10 ||
          p.y > CANVAS_HEIGHT - 10
        ) {
          return true
        }
        const dist = distance(p, otherPoint)
        const avgWidth = (pointWidth + otherPointWidth) / 2
        const trueDist = dist - avgWidth
        if (trueDist > avoidanceRadius) return false

        const found = line.findIndex(
          ({ x, y }) => x === otherPoint.x && y === otherPoint.y
        )
        if (found >= 0) {
          return trueDist < 0 && Math.abs(pIdx - found) >= 3
        }
        return true
      })

    const constructChoppedLines = (
      line: Point[],
      strokeWeight: number
    ): Point[][] => {
      const choppedLines: Point[][] = []
      let cursor = 0
      while (cursor < line.length) {
        const sliced = line.slice(cursor)
        let breakFlag = false
        choppedLines.push([])
        const lastIdx = choppedLines.length - 1
        sliced.forEach((p, i) => {
          cursor = i + 1
          if (breakFlag) return
          if (avoidanceRadius > 0 && isClaimed(p, i, strokeWeight, line)) {
            breakFlag = true
            return
          }
          drawnPoints.push({
            point: p,
            width: strokeWeight,
          })
          choppedLines[lastIdx].push(p)
        })
      }
      return minLineLength > 0
        ? choppedLines.filter((line) => line.length > minLineLength)
        : choppedLines
    }

    const isAngularColorMode = colorMode === 'angular'

    const lines = buildStreamLines(props, noiseFn)
    if (beforeDraw) beforeDraw()

    let sortedLines: Point[][]
    switch (lineSort) {
      case 'long': {
        sortedLines = lines.sort((a, b) => b.length - a.length)
        break
      }
      case 'short': {
        sortedLines = lines.sort((a, b) => a.length - b.length)
        break
      }
      case 'quadratic': {
        sortedLines = lines.sort((a, b) => {
          if (a.length < 1) return 1
          if (b.length < 1) return -1
          return a[0].x * a[0].y - b[0].x * b[0].y
        })
        break
      }
      case 'random': {
        sortedLines = shuffle(lines)
        break
      }
      case 'none': {
        sortedLines = lines
        break
      }
    }

    chunk(sortedLines, CHUNK_SIZE).forEach((chunk, chunkIndex) => {
      const f = (line: Point[], _lineIndex: number) => {
        const lineIndex = chunkIndex * CHUNK_SIZE + _lineIndex

        const [firstPoint] = line
        if (!firstPoint) return

        const progress = lineIndex / (sortedLines.length - 1)
        const strokeWeight = getWidth(
          minWidth,
          maxWidth,
          randomWidths,
          progress
        )
        if (drawMode !== 'dots') s.strokeWeight(strokeWeight)
        setColor(
          props,
          firstPoint.x,
          firstPoint.y,
          drawMode === 'dots' ? 'fill' : 'stroke',
          { progress: Math.min(1, (2 * lineIndex) / sortedLines.length) }
        )

        const drawDot = (p: Point, i: number) => {
          if (i % (dotSkip + 1)) return
          s.circle(
            p.x,
            p.y,
            getWidth(minWidth, maxWidth, randomWidths, progress)
          )
        }

        const choppedLines = constructChoppedLines(line, strokeWeight)
        if (drawMode === 'outlines') {
          choppedLines.forEach((line) => {
            const queue: Point[] = []
            const stack: Point[] = []
            line.forEach((p, i) => {
              if (i > 0) {
                const prev = line[i - 1]
                const theta = thetaFromTwoPoints(p, prev)
                const p1 = coordWithAngleAndDistance(
                  prev,
                  theta - Math.PI / 2,
                  strokeWeight / 2
                )
                const p2 = coordWithAngleAndDistance(
                  prev,
                  theta + Math.PI / 2,
                  strokeWeight / 2
                )
                queue.push(p1)
                stack.push(p2)
              }
            })
            s.strokeWeight(props.outlineWidth)
            s.beginShape()
            line.forEach(() => {
              const p = queue.shift()
              if (!p) return
              s.vertex(p.x, p.y)
            })
            line.forEach(() => {
              const p = stack.pop()
              if (!p) return
              s.vertex(p.x, p.y)
            })
            s.endShape(s.CLOSE)
          })
        } else {
          if (drawMode === 'dots') s.noStroke()
          choppedLines.forEach((line) => {
            if (!isAngularColorMode && drawMode !== 'dots') s.beginShape()
            line.forEach((p, i) => {
              if (isAngularColorMode) {
                if (i > 0) {
                  const prev = line[i - 1]
                  const theta = thetaFromTwoPoints(prev, p)
                  setColor(
                    props,
                    p.x,
                    p.y,
                    drawMode === 'dots' ? 'fill' : 'stroke',
                    { angle: theta }
                  )
                  if (drawMode === 'dots') {
                    drawDot(p, i)
                  } else {
                    const d = distance(prev, p)
                    const extrapolated = coordWithAngleAndDistance(
                      prev,
                      theta,
                      d * 1.25
                    )
                    s.line(prev.x, prev.y, extrapolated.x, extrapolated.y)
                  }
                }
              } else {
                if (drawMode === 'dots') {
                  drawDot(p, i)
                } else {
                  s.vertex(p.x, p.y)
                }
              }
            })
            if (!isAngularColorMode && drawMode !== 'dots') s.endShape()
          })
        }
      }
      timeouts.push(
        setTimeout(() => {
          chunk.forEach(f)
        })
      )
    })
  }

  const drawFluid = (props: Props, noiseFn: NoiseFn): void => {
    const { lineLength, minWidth, maxWidth, randomWidths } = props
    points.forEach((p, i) => {
      const angle = noiseFn(p.x, p.y)
      if (angle == null) return

      const nextP = coordWithAngleAndDistance(p, angle, lineLength)
      points[i] = nextP

      const firstPoint = firstPoints[i]
      setColor(props, firstPoint.x, firstPoint.y, 'stroke', {
        angle: thetaFromTwoPoints(p, nextP),
      })
      s.strokeWeight(
        getWidth(minWidth, maxWidth, randomWidths, i / (points.length - 1))
      )
      s.line(p.x, p.y, nextP.x, nextP.y)
    })
  }

  const inBounds = (
    p: Point,
    imgBoundaries: ImgBoundaries,
    {
      constraintMode,
      constraintRadius,
      rectXSize,
      rectYSize,
      allowGrowthOutsideRadius,
      noiseMode,
    }: Props
  ): boolean => {
    if (allowGrowthOutsideRadius) {
      return p.x >= 0 && p.x <= CANVAS_WIDTH && p.y >= 0 && p.y <= CANVAS_HEIGHT
    }
    if (noiseMode === 'image') {
      if (p.x < imgBoundaries.x) return false
      if (p.x > imgBoundaries.x + imgBoundaries.width) return false
      if (p.y < imgBoundaries.y) return false
      if (p.y > imgBoundaries.y + imgBoundaries.height) return false
    }
    if (constraintMode === 'circle') {
      return distance(p, center) < constraintRadius
    }

    return (
      Math.abs(center.x - p.x) * 2 < rectXSize &&
      Math.abs(center.y - p.y) * 2 < rectYSize
    )
  }

  const getImageColorAtPixel = ({ x, y }: Point): [number, number, number] =>
    imgColorData[Math.floor(x)][Math.floor(y)]

  const normalizeAngle: NumberConversionFn = (angle) =>
    s.map(angle, 0, 1, 0, Math.PI * 2)

  const perlinNoiseFn =
    (distortionFn: NumberConversionFn, noiseDamp: number): NoiseFn =>
    (x: number, y: number) => {
      const normalizedNoise = noiseDamp / 1000
      const angle: number = s.noise(x * normalizedNoise, y * normalizedNoise)
      const distorted = distortionFn(angle)
      return {
        angle: normalizeAngle(distorted),
      }
    }

  const simplexNoiseFn =
    (distortionFn: NumberConversionFn, noiseDamp: number): NoiseFn =>
    (x: number, y: number) => {
      const normalizedNoise = noiseDamp / 1000
      return {
        angle: normalizeAngle(
          distortionFn(
            simplex.noise2D(x * normalizedNoise, y * normalizedNoise)
          )
        ),
      }
    }

  const curlNoiseFn =
    (distortionFn: NumberConversionFn, noiseDamp: number): NoiseFn =>
    (x: number, y: number) => {
      const normalizedNoise = noiseDamp / 1000
      const eps = 0.0001
      const eps2 = 2 * eps

      // x rate of change
      const x1: number = s.noise(
        (x + eps) * normalizedNoise,
        y * normalizedNoise
      )
      const x2: number = s.noise(
        (x - eps) * normalizedNoise,
        y * normalizedNoise
      )

      // x derivative
      var dx = (x1 - x2) / eps2

      // y rate of change
      const y1: number = s.noise(
        x * normalizedNoise,
        (y + eps) * normalizedNoise
      )
      const y2: number = s.noise(
        x * normalizedNoise,
        (y - eps) * normalizedNoise
      )

      // y derivative
      var dy = (y1 - y2) / eps2

      return {
        angle: distortionFn(Math.atan2(dx, dy)),
      }
    }

  const vortexNoiseFn =
    (distortionFn: NumberConversionFn, vortexStrength: number): NoiseFn =>
    (x: number, y: number) => {
      const t = thetaFromTwoPoints({ x, y }, center)
      return {
        angle: distortionFn(t + vortexStrength),
      }
    }

  const wavyNoiseFn =
    (
      distortionFn: NumberConversionFn,
      noise: number,
      vortexStrength: number,
      simplexStrength: number
    ): NoiseFn =>
    (x: number, y: number) => {
      const sin = Math.sin(x * noise * 0.01)
      const cos = Math.cos(y * noise * 0.01)
      const t = thetaFromTwoPoints({ x, y }, center)
      const { angle: _simplex = 0 } =
        simplexNoiseFn(distortionFn, noise)(x, y) || 0
      return {
        angle: distortionFn(
          sin + cos + t * vortexStrength + _simplex * simplexStrength
        ),
      }
    }

  const imageNoiseFn =
    (distortionFn: NumberConversionFn, noiseDamp: number): NoiseFn =>
    (x: number, y: number) => {
      const [r, g, b] = s.get(x, y)
      const avg = (r + g + b) / 3
      const angle = interpolate([0, 255], [0, Math.PI * noiseDamp], avg)
      return {
        angle: distortionFn(angle),
        color: [r, g, b],
      }
    }

  const clearTimeouts = () => {
    timeouts.forEach((timeout) => clearTimeout(timeout))
    timeouts = []
  }

  function initialize() {
    s.clear()
    clearTimeouts()
    s.colorMode(s.HSB)
    simplex = new SimplexNoise()

    const props = getProps()
    const { n, drawMode } = props
    points = []
    firstPoints = []

    if (drawMode === 'fluid') {
      const xVariance = CANVAS_WIDTH / (n - 1)
      const yVariance = CANVAS_HEIGHT / (n - 1)
      const imgBoundaries = imageBoundaries(img)
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const p = getPointFromRC(
            r,
            c,
            xVariance,
            yVariance,
            n - 1,
            imgBoundaries,
            props
          )
          points.push(p)
          firstPoints.push(p)
        }
      }
    }

    last = undefined
  }

  s.setup = () => {
    s.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
    s.frameRate(60)
    initialize()
  }

  s.preload = () => {
    img = s.loadImage(getRandomImage())
  }

  let last: Props | undefined

  s.draw = () => {
    const props = getProps()
    if (
      props.drawMode !== 'fluid' &&
      last &&
      // @ts-ignore
      Object.keys(last).every((prop) => last[prop] === props[prop])
    ) {
      return
    }

    clearTimeouts()

    const {
      distortion,
      noise,
      noiseMode,
      drawMode,
      squareCap,
      vortexStrength,
      simplexStrength,
    } = props
    const distortionFn: NumberConversionFn = (angle) =>
      distortion == 0 ? angle : distortion * Math.floor(angle / distortion)
    let noiseFn: NoiseFn
    if (drawMode !== 'fluid') {
      s.clear()
    }
    s.noFill()
    s.strokeCap(squareCap ? s.SQUARE : s.ROUND)
    s.strokeJoin(s.ROUND)
    switch (noiseMode) {
      case 'perlin': {
        noiseFn = perlinNoiseFn(distortionFn, noise)
        break
      }
      case 'simplex': {
        noiseFn = simplexNoiseFn(distortionFn, noise)
        break
      }
      case 'curl': {
        noiseFn = curlNoiseFn(distortionFn, noise)
        break
      }
      case 'image': {
        const { x, y, width, height } = imageBoundaries(img)
        s.image(img, x, y, width, height)
        noiseFn = imageNoiseFn(distortionFn, noise)
        break
      }
      case 'vortex': {
        noiseFn = vortexNoiseFn(distortionFn, vortexStrength)
        break
      }
      case 'wavy': {
        noiseFn = wavyNoiseFn(
          distortionFn,
          noise,
          vortexStrength,
          simplexStrength
        )
        break
      }
    }
    switch (drawMode) {
      case 'dots':
      case 'outlines':
      case 'streams': {
        drawStreams(props, noiseFn, () => {
          if (props.showImage) return

          s.clear()
          pushpop(s, () => {
            s.fill(sanitizeHex(props.background))
            s.noStroke()
            s.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
          })
        })
        break
      }
      case 'fluid': {
        pushpop(s, () => {
          s.noStroke()
          s.fill('rgba(0, 0, 0, 0.025)')
          s.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        })
        drawFluid(props, noiseFn)
        break
      }
    }

    last = props
  }
}
