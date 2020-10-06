import { init as initProps, getProp, setProp } from 'utils/propConfig.ts'
import {
  Point,
  coordWithAngleAndDistance,
  distance,
  interpolate,
} from 'utils/math.ts'

import SimplexNoise from 'simplex-noise'

type DrawMode = 'arrows' | 'streams'
type ConstraintMode = 'none' | 'circle'

type NoiseFn = (x: number, y: number) => number

type Props = {
  n: number
  noise: number
  distortion: number
  density: number
  continuation: number
  lineLength: number
  drawMode: DrawMode
  withArrows: boolean
  noiseMode: 'perlin' | 'simplex'
  constraintMode: ConstraintMode
  constraintRadius: number
  maxWidth: number
  pepperStrength: number
  colorScheme: 'cool' | 'hot'
}

const coolColors = ['#172347', '#025385', '#0EF3C5', '#015268', '#F5EED2']
const hotColors = ['#801100', '#D73502', '#FAC000', '#A8A9AD', '#CB4446']

export default (s) => {
  initProps('field', {
    n: {
      type: 'number',
      default: 100,
      min: 3,
    },
    lineLength: {
      type: 'number',
      default: 10,
      min: 1,
    },
    noise: {
      type: 'number',
      default: 5,
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
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.025,
    },
    continuation: {
      type: 'number',
      default: 0.85,
      min: 0,
      max: 1,
      step: 0.025,
      when: () => get('drawMode') === 'streams',
    },
    drawMode: {
      type: 'dropdown',
      default: 'streams',
      options: ['arrows', 'streams'],
    },
    withArrows: {
      type: 'boolean',
      default: true,
      when: () => get('drawMode') === 'arrows',
    },
    noiseMode: {
      type: 'dropdown',
      default: 'perlin',
      options: ['perlin', 'simplex'],
    },
    constraintMode: {
      type: 'dropdown',
      default: 'none',
      options: ['none', 'circle'],
    },
    constraintRadius: {
      type: 'number',
      default: 100,
      min: 1,
      when: () => get('constraintMode') === 'circle',
    },
    maxWidth: {
      type: 'number',
      default: 8,
      min: 1,
    },
    pepperStrength: {
      type: 'number',
      default: 0.25,
      min: 0,
      max: 1,
      step: 0.05,
    },
    colorScheme: {
      type: 'dropdown',
      default: 'cool',
      options: ['cool', 'hot'],
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

  const getPointFromRC = (
    n: number,
    center: Point,
    totalLength: number,
    squareLen: number,
    r: number,
    c: number
  ): Point => ({
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
  })

  const inBoundsCircle = (p: Point, center: Point, maxDist: number): boolean =>
    distance(p, center) < maxDist

  const drawAsArrows = (
    props: Props,
    center: Point,
    totalLength: number,
    noiseFn: NoiseFn
  ) => {
    s.stroke(255, 255, 255)
    s.strokeWeight(props.maxWidth)
    const { n, lineLength, withArrows, density } = props
    const squareLen = totalLength / n
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (Math.random() > density) continue
        const p: Point = getPointFromRC(n, center, totalLength, squareLen, r, c)
        drawArrow(p, noiseFn(p.x, p.y), lineLength, withArrows)
      }
    }
  }

  const buildStreamLines = (
    props: Props,
    totalLength: number,
    center: Point,
    noiseFn: NoiseFn
  ): Point[][] => {
    const lines: Point[][] = []

    const minX = center.x - totalLength / 2
    const maxX = center.x + totalLength / 2
    const minY = center.y - totalLength / 2
    const maxY = center.y + totalLength / 2
    const {
      n,
      density,
      constraintMode,
      constraintRadius,
      lineLength,
      continuation,
    } = props
    const squareLen = totalLength / n

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (Math.random() > density) continue
        const p = getPointFromRC(n, center, totalLength, squareLen, r, c)
        lines.push([])
        if (
          constraintMode === 'circle' &&
          !inBoundsCircle(p, center, constraintRadius)
        ) {
          continue
        }
        while (
          Math.random() < continuation - 0.1 &&
          p.x >= minX &&
          p.x <= maxX &&
          p.y >= minY &&
          p.y <= maxY
        ) {
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

  const drawAsStreams = (
    props: Props,
    totalLength: number,
    center: Point,
    noiseFn: NoiseFn
  ) => {
    const {
      constraintMode,
      constraintRadius,
      pepperStrength,
      colorScheme,
    } = props

    if (constraintMode === 'circle') {
      s.noFill()
      s.strokeWeight(2)
      s.circle(center.x, center.y, constraintRadius * 2)
    }

    const lines = buildStreamLines(props, totalLength, center, noiseFn)

    // const minX = center.x - totalLength / 2
    // const maxX = center.x + totalLength / 2
    // const minY = center.y - totalLength / 2
    // const maxY = center.y + totalLength / 2
    // const size = totalLength / 3

    const colors = colorScheme === 'cool' ? coolColors : hotColors
    const randomColor = () =>
      colors[Math.floor(Math.random() * (colors.length - 1))]

    s.push()
    s.noFill()
    lines.forEach((line) => {
      s.strokeWeight(Math.random() * props.maxWidth)
      const a = 100 // Math.round(Math.random() + 99)
      if (a == 100) {
        s.stroke(randomColor())
      } else {
        s.stroke(`${randomColor()}${a}`)
      }

      // const firstPoint = line[0]
      // if (!firstPoint) return
      // const { x, y } = firstPoint
      // const xdomain: [number, number] = [minX, maxX - size]
      // const ydomain: [number, number] = [minY, maxY - size]
      // const xr = Math.floor(interpolate(xdomain, [23, 14], x))
      // const xg = Math.floor(interpolate(xdomain, [35, 243], x))
      // const xb = Math.floor(interpolate(xdomain, [71, 197], x))
      // const yr = Math.floor(interpolate(ydomain, [23, 3], y))
      // const yg = Math.floor(interpolate(ydomain, [35, 130], y))
      // const yb = Math.floor(interpolate(ydomain, [71, 52], y))
      // s.stroke((xr + yr) / 2, (xg + yg) / 2, (xb + yb) / 2)
      s.beginShape()
      line.forEach((point) => s.vertex(point.x, point.y))
      s.endShape()

      if (pepperStrength > 0) {
        line.forEach((point) => {
          if (Math.random() < pepperStrength) {
            s.push()
            s.noStroke()
            s.fill(`${randomColor()}90`)
            s.circle(point.x, point.y, (Math.random() * props.maxWidth) / 3)
            s.pop()
          }
        })
      }
    })
    s.pop()
  }

  let simplex: SimplexNoise

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.frameRate(60)
    simplex = new SimplexNoise()
  }

  let last: Props

  s.draw = () => {
    const props = getProps()
    if (last && Object.keys(last).every((prop) => last[prop] === props[prop]))
      return

    // setProp('field', 'noise', Math.sin(s.frameCount / 5000) + 0.25)
    // setProp('field', 'distortion', interpolate([-1, 1], [0.75, 0], Math.sin(s.frameCount / 200)))
    s.clear()
    const { distortion, noise, noiseMode, drawMode } = props
    const totalLength = Math.min(window.innerWidth, window.innerHeight)
    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }
    const normalizedNoise = noise / 1000
    const distortionFn = (angle: number): number =>
      distortion == 0 ? angle : distortion * Math.floor(angle / distortion)
    const minX = center.x - totalLength / 2
    const maxX = center.x + totalLength / 2
    const minY = center.y - totalLength / 2
    const maxY = center.y + totalLength / 2
    const noiseFn: NoiseFn =
      noiseMode == 'perlin'
        ? (x: number, y: number) => {
            let angle = s.noise(x * normalizedNoise, y * normalizedNoise)
            angle = interpolate([minX, maxX], [angle / 10, angle * 1.7], x)
            angle = interpolate([minY, maxY], [angle / 3, angle * 1.2], y)
            const distortedAngle = distortionFn(angle)
            return s.map(distortedAngle, 0, 1, 0, Math.PI * 2)
          }
        : (x: number, y: number) =>
            distortionFn(
              simplex.noise2D(x * normalizedNoise, y * normalizedNoise)
            )
    switch (drawMode) {
      case 'arrows': {
        drawAsArrows(props, center, totalLength, noiseFn)
        break
      }
      case 'streams': {
        drawAsStreams(props, totalLength, center, noiseFn)
        break
      }
    }

    last = props
  }
}
