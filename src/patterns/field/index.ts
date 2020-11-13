import { init as initProps, getProp, setProp } from 'utils/propConfig.ts'
import {
  Point,
  coordWithAngleAndDistance,
  distance,
  interpolate,
} from 'utils/math.ts'
import getCenter from 'utils/getCenter.ts'
import SimplexNoise from 'simplex-noise'
import shuffle from 'utils/shuffle.ts'

const _COLOR_SCHEMES_ = ['iceland', 'fieryFurnace', 'oceanscape'] as const
const _NOISE_MODE_ = ['perlin', 'simplex', 'curl', 'image'] as const
const _DRAW_MODE_ = ['arrows', 'streams', 'fluid'] as const
const _CONSTRAINT_MODE_ = ['none', 'circle'] as const
const _COLOR_MODE_ = ['random', 'sectors', 'monochrome'] as const

type ColorScheme = typeof _COLOR_SCHEMES_[number]
type NoiseMode = typeof _NOISE_MODE_[number]
type DrawMode = typeof _DRAW_MODE_[number]
type ConstraintMode = typeof _CONSTRAINT_MODE_[number]
type ColorMode = typeof _COLOR_MODE_[number]

type Bounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

type Shape = Point[]

type NoiseFn = (x: number, y: number) => number
type NumberConversionFn = (n: number) => number

type Props = {
  n: number
  noise: number
  distortion: number
  density: number
  continuation: number
  lineLength: number
  drawMode: DrawMode
  withArrows: boolean
  noiseMode: NoiseMode
  constraintMode: ConstraintMode
  constraintRadius: number
  maxWidth: number
  pepperStrength: number
  colorScheme: ColorScheme
  colorMode: ColorMode
  showImage: boolean
}

const coolColors = ['#172347', '#025385', '#0EF3C5', '#015268', '#F5EED2']
const hotColors = ['#801100', '#D73502', '#FAC000', '#A8A9AD', '#CB4446']
const oceanScapeColors = [
  '#c71585',
  '#4a2e76',
  '#365086',
  '#ff6edf',
  '#0AA9A1',
  '#D8F8F5',
]

export default (s) => {
  initProps('field', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    n: {
      type: 'number',
      default: 80,
      min: 3,
    },
    lineLength: {
      type: 'number',
      default: 3,
      min: 1,
    },
    noise: {
      type: 'number',
      default: 3,
      min: Number.NEGATIVE_INFINITY,
      step: 0.01,
    },
    distortion: {
      type: 'number',
      default: 0,
      min: 0,
      step: Math.PI / 5096,
    },
    density: {
      type: 'number',
      default: 1,
      min: 0,
      max: 1,
      step: 0.025,
    },
    continuation: {
      type: 'number',
      default: 1,
      min: 0,
      max: 1,
      step: 0.025,
      when: () => get('drawMode') === 'streams',
    },
    noiseMode: {
      type: 'dropdown',
      default: 'image',
      options: [..._NOISE_MODE_],
    },
    constraintMode: {
      type: 'dropdown',
      default: 'none',
      options: [..._CONSTRAINT_MODE_],
    },
    constraintRadius: {
      type: 'number',
      default: 375,
      min: 1,
      when: () => get('constraintMode') === 'circle',
    },
    maxWidth: {
      type: 'number',
      default: 1,
      min: 1,
    },
    pepperStrength: {
      type: 'number',
      default: 0,
      min: 0,
      max: 1,
      step: 0.05,
      when: () => get('drawMode') === 'streams',
    },
    drawMode: {
      type: 'dropdown',
      default: 'streams',
      options: [..._DRAW_MODE_],
      onChange: initialize,
    },
    withArrows: {
      type: 'boolean',
      default: true,
      when: () => get('drawMode') === 'arrows',
    },
    colorScheme: {
      type: 'dropdown',
      default: 'oceanscape',
      options: [..._COLOR_SCHEMES_],
      when: () => get('colorMode') !== 'monochrome',
    },
    colorMode: {
      type: 'dropdown',
      default: 'random',
      options: [..._COLOR_MODE_],
    },
    showImage: {
      type: 'boolean',
      default: false,
      when: () => get('noiseMode') === 'image',
    },
  })
  const get = (prop: string) => getProp('field', prop)
  const getProps = (): Props => ({
    n: get('n'),
    lineLength: get('lineLength'),
    noise: get('noise'),
    density: get('density'),
    continuation: get('continuation'),
    drawMode: get('drawMode'),
    noiseMode: get('noiseMode'),
    distortion: get('distortion'),
    constraintMode: get('constraintMode'),
    constraintRadius: get('constraintRadius'),
    withArrows: get('withArrows'),
    maxWidth: get('maxWidth'),
    pepperStrength: get('pepperStrength'),
    colorScheme: get('colorScheme'),
    colorMode: get('colorMode'),
    showImage: get('showImage'),
  })

  const drawArrow = (
    start: Point,
    angle: number,
    length: number,
    withTip?: boolean
  ) => {
    const p2 = coordWithAngleAndDistance(start, angle, length)
    s.line(start.x, start.y, p2.x, p2.y)

    if (withTip) {
      const tip1 = coordWithAngleAndDistance(
        p2,
        (angle + (Math.PI * 3) / 4) % (Math.PI * 2),
        length / 3
      )
      const tip2 = coordWithAngleAndDistance(
        p2,
        (angle - (Math.PI * 3) / 4) % (Math.PI * 2),
        length / 3
      )
      s.line(p2.x, p2.y, tip1.x, tip1.y)
      s.line(p2.x, p2.y, tip2.x, tip2.y)
    }
  }

  const getPointFromRC = (n: number, r: number, c: number): Point => {
    const center = getCenter()
    const totalLength = getTotalLen()
    const squareLen = getSquareLen(n, totalLength)
    return {
      x: interpolate(
        [0, n - 1],
        [center.x - totalLength / 2, center.x + totalLength / 2 - squareLen],
        c
      ),
      y: interpolate(
        [0, n - 1],
        [center.y - totalLength / 2, center.y + totalLength / 2 - squareLen],
        r
      ),
    }
  }

  const drawAsArrows = (props: Props, noiseFn: NoiseFn) => {
    s.stroke(255, 255, 255)
    s.strokeWeight(props.maxWidth)
    const { n, lineLength, withArrows, density } = props
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (Math.random() > density) continue
        const p: Point = getPointFromRC(n, r, c)
        drawArrow(p, noiseFn(p.x, p.y), lineLength, withArrows)
      }
    }
  }

  let points: Point[]
  let firstPoints: Point[]
  let timeouts: number[] = []

  const buildStreamLines = (props: Props, noiseFn: NoiseFn): Point[][] => {
    const lines: Point[][] = []
    const center = getCenter()
    const { minX, maxX, minY, maxY } = getBounds(undefined, center)
    const {
      n,
      density,
      constraintMode,
      constraintRadius,
      lineLength,
      continuation,
    } = props

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (Math.random() > density) continue

        const p = getPointFromRC(n, r, c)
        lines.push([])
        const circleConstraint = constraintMode === 'circle'
        if (circleConstraint && distance(p, center) >= constraintRadius) {
          continue
        }
        const inBounds = () =>
          circleConstraint
            ? p.x >= 0 &&
              p.x <= window.innerWidth &&
              p.y >= 0 &&
              p.y <= window.innerHeight
            : p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY
        while (Math.random() < continuation - 0.05 && inBounds()) {
          const angle = noiseFn(p.x, p.y)
          const nextP = coordWithAngleAndDistance(p, angle, lineLength)
          lines[lines.length - 1].push(nextP)
          p.x = nextP.x
          p.y = nextP.y
        }
      }
    }
    return lines
  }

  const getWidth = (maxWidth: number): number => Math.random() * maxWidth

  const getColor = (
    { colorMode, colorScheme }: Props,
    x: number,
    y: number
  ): string => {
    if (colorMode === 'monochrome') {
      return '#fff'
    }
    if (colorMode === 'random') {
      return randomColor(colorScheme)
    } else if (colorMode === 'sectors') {
      const colors = getColors(colorScheme)
      const colorNoise: number = s.noise(x / 200, y / 100)
      const quadrant = Math.floor(
        interpolate([0, 1], [0, colors.length - 1], colorNoise)
      )
      const alpha = interpolate([0, 1], [200, 255], Math.random())
      const alphaHex = Math.round(alpha).toString(16)
      return `${colors[quadrant]}${alphaHex}`
    } else {
      /*
      const xdomain: [number, number] = [minX, maxX - size]
      const ydomain: [number, number] = [minY, maxY - size]
      const xr = Math.floor(interpolate(xdomain, [23, 14], x))
      const xg = Math.floor(interpolate(xdomain, [35, 243], x))
      const xb = Math.floor(interpolate(xdomain, [71, 197], x))
      const yr = Math.floor(interpolate(ydomain, [23, 3], y))
      const yg = Math.floor(interpolate(ydomain, [35, 130], y))
      const yb = Math.floor(interpolate(ydomain, [71, 52], y))
      s.stroke((xr + yr) / 2, (xg + yg) / 2, (xb + yb) / 2)
      */
    }
    return ''
  }

  const getColors = (colorScheme: ColorScheme): string[] => {
    switch (colorScheme) {
      case 'iceland':
        return coolColors
      case 'fieryFurnace':
        return hotColors
      case 'oceanscape':
        return oceanScapeColors
    }
  }

  const randomColor = (colorScheme: ColorScheme): string => {
    const colors = getColors(colorScheme)
    return colors[Math.floor(Math.random() * (colors.length - 1))]
  }

  const drawAsStreams = (
    props: Props,
    noiseFn: NoiseFn,
    beforeDraw?: () => any
  ) => {
    const {
      constraintMode,
      constraintRadius,
      pepperStrength,
      colorScheme,
    } = props

    if (constraintMode === 'circle') {
      const center = getCenter()
      s.strokeWeight(2)
      s.circle(center.x, center.y, constraintRadius * 2)
    }

    const lines = buildStreamLines(props, noiseFn)
    if (beforeDraw) beforeDraw()

    shuffle(lines).forEach((line) => {
      timeouts.push(
        setTimeout(() => {
          const [firstPoint] = line
          if (!firstPoint) return
          const { x, y } = firstPoint

          s.strokeWeight(getWidth(props.maxWidth))
          s.stroke(getColor(props, x, y))

          s.beginShape()
          line.forEach(({ x, y }) => s.vertex(x, y))
          s.endShape()

          if (pepperStrength > 0) {
            line.forEach((point) => {
              if (Math.random() < pepperStrength) {
                s.push()
                s.noStroke()
                s.fill(`${randomColor(colorScheme)}AA`)
                s.circle(point.x, point.y, (Math.random() * props.maxWidth) / 3)
                s.pop()
              }
            })
          }
        })
      )
    })
  }

  const drawFlow = (props: Props, noiseFn: NoiseFn): void => {
    const { lineLength, maxWidth } = props
    points.forEach((p, i) => {
      const angle = noiseFn(p.x, p.y)
      const nextP = coordWithAngleAndDistance(p, angle, lineLength)
      points[i] = nextP

      const firstPoint = firstPoints[i]
      s.stroke(getColor(props, firstPoint.x, firstPoint.y))
      s.strokeWeight(maxWidth)
      s.line(p.x, p.y, nextP.x, nextP.y)
    })
  }

  const getTotalLen = (): number =>
    Math.min(window.innerHeight, window.innerWidth)
  const getSquareLen = (n: number, totalLength?: number): number =>
    (totalLength == null ? getTotalLen() : totalLength) / n

  const getBounds = (_totalLength?: number, _center?: Point): Bounds => {
    const totalLength = _totalLength == null ? getTotalLen() : _totalLength
    const center = _center || getCenter()
    return {
      minX: center.x - totalLength / 2,
      maxX: center.x + totalLength / 2,
      minY: center.y - totalLength / 2,
      maxY: center.y + totalLength / 2,
    }
  }

  const normalizeAngle: NumberConversionFn = (angle) =>
    s.map(angle, 0, 1, 0, Math.PI * 2)

  const perlinNoiseFn = (
    distortionFn: NumberConversionFn,
    noiseDamp: number
  ): NoiseFn => (x: number, y: number) => {
    const angle: number = s.noise(x * noiseDamp, y * noiseDamp)
    const distorted = distortionFn(angle)
    return normalizeAngle(distorted)
  }

  const simplexNoiseFn = (
    distortionFn: NumberConversionFn,
    noiseDamp: number
  ): NoiseFn => (x: number, y: number) =>
    normalizeAngle(distortionFn(simplex.noise2D(x * noiseDamp, y * noiseDamp)))

  const curlNoiseFn = (
    distortionFn: NumberConversionFn,
    noiseDamp: number
  ): NoiseFn => (x: number, y: number) => {
    const eps = 0.0001
    const eps2 = 2 * eps

    // x rate of change
    const x1: number = s.noise((x + eps) * noiseDamp, y * noiseDamp)
    const x2: number = s.noise((x - eps) * noiseDamp, y * noiseDamp)

    // x derivative
    var dx = (x1 - x2) / eps2

    // y rate of change
    const y1: number = s.noise(x * noiseDamp, (y + eps) * noiseDamp)
    const y2: number = s.noise(x * noiseDamp, (y - eps) * noiseDamp)

    // y derivative
    var dy = (y1 - y2) / eps2

    return distortionFn(Math.atan2(dx, dy))
  }

  const imageNoiseFn = (
    distortionFn: NumberConversionFn,
    noiseDamp: number
  ): NoiseFn => (x: number, y: number) => {
    const [r, g, b] = s.get(x, y)
    const avg = (r + g + b) / 3
    const angle = interpolate([0, 255], [0, Math.PI * noiseDamp], avg)
    return distortionFn(angle)
  }

  let simplex: SimplexNoise
  let img
  const images: string[] = [
    'spaghetti_memoirs.jpg',
    'cale.jpg',
    'marshall.jpg',
    'selfie.jpg',
    'sand_skiing.jpg',
  ]

  const clearTimeouts = () => {
    timeouts.forEach((timeout) => clearTimeout(timeout))
    timeouts = []
  }

  function initialize() {
    s.clear()
    clearTimeouts()
    simplex = new SimplexNoise()

    points = []
    firstPoints = []
    const props = getProps()
    const { n, density } = props

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (Math.random() > density) continue
        const p = getPointFromRC(n, r, c)
        points.push(p)
        firstPoints.push(p)
      }
    }
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.frameRate(60)
    initialize()
  }

  s.preload = () => {
    img = s.loadImage(
      `assets/${images[Math.floor(Math.random() * images.length)]}`
    )
  }

  let last: Props

  s.draw = () => {
    const props = getProps()
    if (
      (props.drawMode === 'arrows' || props.drawMode === 'streams') &&
      last &&
      Object.keys(last).every((prop) => last[prop] === props[prop])
    ) {
      return
    }

    clearTimeouts()

    clearTimeouts()

    // setProp('field', 'noise', Math.sin(s.frameCount / 5000) + 0.25)
    // setProp('field', 'distortion', interpolate([-1, 1], [0.75, 0], Math.sin(s.frameCount / 200)))
    const { distortion, noise, noiseMode, drawMode } = props
    const normalizedNoise = noise / 1000
    const distortionFn: NumberConversionFn = (angle) =>
      distortion == 0 ? angle : distortion * Math.floor(angle / distortion)
    let noiseFn: NoiseFn
    if (drawMode === 'arrows' || drawMode === 'streams') {
      s.clear()
    }
    s.noFill()
    switch (noiseMode) {
      case 'perlin': {
        noiseFn = perlinNoiseFn(distortionFn, normalizedNoise)
        break
      }
      case 'simplex': {
        noiseFn = simplexNoiseFn(distortionFn, normalizedNoise)
        break
      }
      case 'curl': {
        noiseFn = curlNoiseFn(distortionFn, normalizedNoise)
        break
      }
      case 'image': {
        const totalLength = getTotalLen()
        const { minX, minY } = getBounds(totalLength)
        // s.push()
        s.image(img, minX, minY, totalLength, totalLength)
        // s.filter(s.DILATE)
        // s.pop()
        noiseFn = imageNoiseFn(distortionFn, noise)
      }
    }
    switch (drawMode) {
      case 'arrows': {
        drawAsArrows(props, noiseFn)
        break
      }
      case 'streams': {
        drawAsStreams(props, noiseFn, () => {
          if (!props.showImage) s.clear()
        })
        break
      }
      case 'fluid': {
        s.push()
        s.noStroke()
        s.fill('rgba(0, 0, 0, 0.025)')
        s.rect(0, 0, window.innerWidth, window.innerHeight)
        s.pop()
        drawFlow(props, noiseFn)
        break
      }
    }

    last = props
  }
}
