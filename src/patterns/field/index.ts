import { init as initProps, getProp } from 'utils/propConfig'
import {
  Point,
  coordWithAngleAndDistance,
  thetaFromTwoPoints,
  distance,
  interpolate,
} from 'utils/math'
import { sanitizeHex } from 'utils/color'
import SimplexNoise from 'simplex-noise'
import shuffle from 'utils/shuffle'
import pushpop from 'utils/pushpop'
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

/*
const CANVAS_WIDTH = 3500
const CANVAS_HEIGHT = 1750
/*/
const CANVAS_WIDTH = window.innerWidth
const CANVAS_HEIGHT = window.innerHeight
//*/

const center: Point = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
}

type NoiseFn = (x: number, y: number) => number | null
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

const inBounds = (
  p: Point,
  {
    constraintMode,
    constraintRadius,
    rectXSize,
    rectYSize,
    allowGrowthOutsideRadius,
  }: Props
): boolean => {
  if (allowGrowthOutsideRadius) {
    return p.x >= 0 && p.x <= CANVAS_WIDTH && p.y >= 0 && p.y <= CANVAS_HEIGHT
  }

  if (constraintMode === 'circle') {
    return distance(p, center) < constraintRadius
  } else {
    return (
      Math.abs(center.x - p.x) * 2 < rectXSize &&
      Math.abs(center.y - p.y) * 2 < rectYSize
    )
  }
}

const getPointFromRC = (n: number, r: number, c: number): Point => ({
  x: interpolate([0, n - 1], [0, CANVAS_WIDTH], c),
  y: interpolate([0, n - 1], [0, CANVAS_HEIGHT], r),
})

const buildStreamLines = (props: Props, noiseFn: NoiseFn): Point[][] => {
  const lines: Point[][] = []
  const {
    n,
    density,
    constraintMode,
    constraintRadius,
    rectXSize,
    rectYSize,
    lineLength,
    continuation,
    minLineLength,
  } = props

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (Math.random() > density) continue
      const p = getPointFromRC(n, r, c)
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
      while (Math.random() < continuation - 0.01 && inBounds(p, props)) {
        const angle = noiseFn(p.x, p.y)
        if (angle == null) break

        const nextP = coordWithAngleAndDistance(p, angle, lineLength)
        lines[lines.length - 1].push(nextP)
        p.x = nextP.x
        p.y = nextP.y
      }
    }
  }
  return lines.filter((line) => line.length >= minLineLength)
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
    'Line Length': {
      type: 'number',
      default: 6,
      min: 1,
    },
    Noise: {
      type: 'number',
      default: 1.4,
      min: Number.NEGATIVE_INFINITY,
      step: 0.01,
    },
    Distortion: {
      type: 'number',
      default: 0,
      min: 0,
      step: 0.01,
    },
    Density: {
      type: 'number',
      default: 1,
      min: 0,
      max: 1,
      step: 0.025,
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
      default: 5,
      min: 1,
    },
    'Random Width': {
      type: 'boolean',
      default: false,
    },
    'Avoidance Radius': {
      type: 'number',
      default: 3,
      min: Number.NEGATIVE_INFINITY,
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
    'Dot Skip': {
      type: 'number',
      default: 2,
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
      default: Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2.5,
      min: 1,
      when: () => get('Constraint Mode') === 'circle',
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
    'Allow growth outside constraint': {
      type: 'boolean',
      default: false,
    },
    'Square Cap': {
      type: 'boolean',
      default: false,
      when: () => get('Draw Mode') === 'streams',
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
    'Min Line Length': {
      type: 'number',
      default: 5,
      min: 0,
    },
    'Line Sort': {
      type: 'dropdown',
      default: _LINE_SORT_[0],
      options: [..._LINE_SORT_],
    },
    Background: {
      type: 'string',
      default: '#000',
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
    density: get('Density'),
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
        [-65, 65],
        x + y
      )
      const domain: [number, number] = [0, 1]
      setFn(
        Math.floor(interpolate(domain, [215, 269], val) + salt),
        Math.floor(interpolate(domain, [62, 51], val)),
        Math.floor(interpolate(domain, [90, 100], val))
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
      const alpha = interpolate([0, 1], [200, 255], Math.random())
      const alphaHex = Math.round(alpha).toString(16)
      setFn(`${colors[quadrant]}${alphaHex}`)
    } else if (colorMode === 'angular' && angle != null) {
      interpolateColor(Math.sin(angle / 2 + Math.PI / 2))
    } else if (colorMode === 'gradual' && progress != null) {
      interpolateColor(progress)
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
      pointWidth: number,
      avoidanceRadius: number,
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
        if (line.includes(otherPoint)) return false
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
        sliced.forEach((p, i) => {
          cursor = i + 1
          if (breakFlag) return
          if (isClaimed(p, strokeWeight, avoidanceRadius, line)) {
            breakFlag = true
            return
          }
          drawnPoints.push({
            point: p,
            width: strokeWeight,
          })
          choppedLines[choppedLines.length - 1].push(p)
        })
      }
      const filteredByLength = choppedLines.filter(
        (line) => line.length > minLineLength
      )
      return filteredByLength
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

    sortedLines.forEach((line, lineIndex) => {
      timeouts.push(
        setTimeout(() => {
          const [firstPoint] = line
          if (!firstPoint) return

          const strokeWeight = getWidth(
            minWidth,
            maxWidth,
            randomWidths,
            lineIndex / (sortedLines.length - 1)
          )
          s.strokeWeight(strokeWeight)
          setColor(
            props,
            firstPoint.x,
            firstPoint.y,
            drawMode === 'dots' ? 'fill' : 'stroke',
            { progress: lineIndex / sortedLines.length }
          )

          const drawDot = (p: Point, i: number) => {
            if (i % (dotSkip + 1)) return
            s.noStroke()
            s.circle(
              p.x,
              p.y,
              getWidth(
                minWidth,
                maxWidth,
                randomWidths,
                lineIndex / (sortedLines.length - 1)
              )
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

  const normalizeAngle: NumberConversionFn = (angle) =>
    s.map(angle, 0, 1, 0, Math.PI * 2)

  const perlinNoiseFn =
    (distortionFn: NumberConversionFn, noiseDamp: number): NoiseFn =>
    (x: number, y: number) => {
      const angle: number = s.noise(x * noiseDamp, y * noiseDamp)
      const distorted = distortionFn(angle)
      return normalizeAngle(distorted)
    }

  const simplexNoiseFn =
    (distortionFn: NumberConversionFn, noiseDamp: number): NoiseFn =>
    (x: number, y: number) => {
      return normalizeAngle(
        distortionFn(simplex.noise2D(x * noiseDamp, y * noiseDamp))
      )
    }

  const curlNoiseFn =
    (distortionFn: NumberConversionFn, noiseDamp: number): NoiseFn =>
    (x: number, y: number) => {
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

  const imageNoiseFn =
    (distortionFn: NumberConversionFn, noiseDamp: number): NoiseFn =>
    (x: number, y: number) => {
      const [r, g, b] = s.get(x, y)
      const avg = (r + g + b) / 3
      const angle = interpolate([0, 255], [0, Math.PI * noiseDamp], avg)
      return distortionFn(angle)
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
      Object.keys(last).every((prop) => last[prop] === props[prop])
    ) {
      return
    }

    clearTimeouts()

    // setProp('field', 'noise', Math.sin(s.frameCount / 5000) + 0.25)
    // setProp('field', 'distortion', interpolate([-1, 1], [0.75, 0], Math.sin(s.frameCount / 200)))
    const { distortion, noise, noiseMode, drawMode, squareCap } = props
    const normalizedNoise = noise / 1000
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
        const totalLength = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT)
        const aspect = img.width / img.height
        const width = totalLength * aspect
        const x = center.x - width / 2
        const y = center.y - totalLength / 2
        s.image(img, x, y, width, totalLength)
        noiseFn = imageNoiseFn(distortionFn, noise)
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
