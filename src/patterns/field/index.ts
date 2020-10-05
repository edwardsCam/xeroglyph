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
  alpha: number
  density: number
  continuation: number
  lineLength: number
  drawMode: DrawMode
  withArrows: boolean
  noiseMode: 'perlin' | 'simplex'
  constraintMode: ConstraintMode
  constraintRadius: number
  maxWidth: number
}

export default (s) => {
  initProps('field', {
    n: {
      type: 'number',
      default: 90,
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
      min: 0,
      step: 0.01,
    },
    distortion: {
      type: 'number',
      default: 0,
      min: 0,
      step: Math.PI / 2048,
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
      default: 0.9,
      min: 0,
      max: 1,
      step: 0.025,
      when: () => get('drawMode') === 'streams',
    },
    alpha: {
      type: 'number',
      default: 1,
      min: 0,
      max: 1,
      step: 0.01,
    },
    drawMode: {
      type: 'dropdown',
      default: 'streams',
      options: ['arrows', 'streams'],
    },
    withArrows: {
      type: 'boolean',
      default: false,
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
      default: 10,
      min: 1,
    },
  })
  const get = (prop: string) => getProp('field', prop)
  const getProps = (): Props => ({
    n: get('n'),
    lineLength: get('lineLength'),
    noise: get('noise'),
    alpha: get('alpha'),
    density: get('density'),
    continuation: get('continuation'),
    drawMode: get('drawMode'),
    noiseMode: get('noiseMode'),
    distortion: get('distortion'),
    constraintMode: get('constraintMode'),
    constraintRadius: get('constraintRadius'),
    withArrows: get('withArrows'),
    maxWidth: get('maxWidth'),
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
          Math.random() < continuation &&
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
    const { constraintMode, constraintRadius } = props

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

    const colors = ['#172347', '#025385', '#0EF3C5', '#015268', '#F5EED2']

    s.noFill()
    // const avg = (a: number, b: number): number => (a + b) / 2
    lines.forEach((line) => {
      s.beginShape()
      s.strokeWeight(Math.random() * props.maxWidth)
      s.stroke(colors[Math.floor(Math.random() * (colors.length - 1))])

      // const firstPoint = line[0]

      // if (!firstPoint) return

      // const colorX0 = '#48575e' // 23, 35, 71
      // const colorX1 = '#2d4a1a' // 14, 243, 197
      // const colorY1 = '#699b2c' // 3, 130, 52

      // const size = totalLength / 3
      // const xColorR = Math.floor(
      //   interpolate([minX, maxX - size], [23, 14], firstPoint.x)
      // )
      // const xColorG = Math.floor(
      //   interpolate([minX, maxX - size], [35, 243], firstPoint.x)
      // )
      // const xColorB = Math.floor(
      //   interpolate([minX, maxX - size], [71, 197], firstPoint.x)
      // )

      // const yColorR = Math.floor(
      //   interpolate([minX, maxX - size], [23, 3], firstPoint.y)
      // )
      // const yColorG = Math.floor(
      //   interpolate([minX, maxX - size], [35, 130], firstPoint.y)
      // )
      // const yColorB = Math.floor(
      //   interpolate([minX, maxX - size], [71, 52], firstPoint.y)
      // )
      // const color = [
      //   avg(xColorR, yColorR),
      //   avg(xColorG, yColorG),
      //   avg(xColorB, yColorB),
      // ]
      // s.stroke(...color)
      line.forEach((point) => {
        s.vertex(point.x, point.y)
      })
      s.endShape()
    })
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
    // setProp('field', 'alpha', Math.cos(s.frameCount / 100) / 2.2 + 0.5)
    // setProp('field', 'distortion', interpolate([-1, 1], [0.75, 0], Math.sin(s.frameCount / 200)))
    s.clear()
    const { distortion, noise, noiseMode, alpha, drawMode } = props
    s.stroke(`rgba(255, 255, 255, ${alpha})`)
    const totalLength = Math.min(window.innerWidth, window.innerHeight)
    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }
    const normalizedNoise = noise / 1000
    const distortionFn = (angle: number): number =>
      distortion == 0 ? angle : distortion * Math.floor(angle / distortion)
    const noiseFn: NoiseFn =
      noiseMode == 'perlin'
        ? (x: number, y: number) => {
            const angle = s.noise(x * normalizedNoise, y * normalizedNoise)
            return s.map(distortionFn(angle), 0, 1, 0, Math.PI * 2)
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
