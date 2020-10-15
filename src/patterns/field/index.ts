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
type ColorMode = 'random' | 'sectors'

type Bounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

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
  noiseMode: 'perlin' | 'simplex' | 'curl'
  constraintMode: ConstraintMode
  constraintRadius: number
  maxWidth: number
  pepperStrength: number
  colorScheme: 'cool' | 'hot'
  colorMode: ColorMode
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
      default: 2,
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
      default: 'curl',
      options: ['perlin', 'simplex', 'curl'],
    },
    constraintMode: {
      type: 'dropdown',
      default: 'circle',
      options: ['none', 'circle'],
    },
    constraintRadius: {
      type: 'number',
      default: 375,
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
    colorMode: {
      type: 'dropdown',
      default: 'sectors',
      options: ['random', 'sectors'],
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
    totalLength: number,
    squareLen: number,
    r: number,
    c: number
  ): Point => {
    const center = getCenter()
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

  const inBoundsCircle = (p: Point, maxDist: number): boolean =>
    distance(p, getCenter()) < maxDist

  const drawAsArrows = (
    props: Props,
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
        const p: Point = getPointFromRC(n, totalLength, squareLen, r, c)
        drawArrow(p, noiseFn(p.x, p.y), lineLength, withArrows)
      }
    }
  }

  const buildStreamLines = (
    props: Props,
    totalLength: number,
    noiseFn: NoiseFn
  ): Point[][] => {
    const lines: Point[][] = []

    const { minX, maxX, minY, maxY } = getBounds(totalLength)
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
        const p = getPointFromRC(n, totalLength, squareLen, r, c)
        lines.push([])
        if (constraintMode === 'circle' && !inBoundsCircle(p, constraintRadius))
          continue
        while (
          Math.random() < continuation - 0.05 &&
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
    noiseFn: NoiseFn
  ) => {
    const {
      constraintMode,
      constraintRadius,
      pepperStrength,
      colorScheme,
      colorMode,
    } = props

    if (constraintMode === 'circle') {
      const center = getCenter()
      s.noFill()
      s.strokeWeight(2)
      s.circle(center.x, center.y, constraintRadius * 2)
    }

    const lines = buildStreamLines(props, totalLength, noiseFn)

    // const size = totalLength / 3
    // const { minX, maxX, minY, maxY } = getBounds(totalLength)

    const noiseDampX = 300
    const noiseDampY = 200
    const colors = colorScheme === 'cool' ? coolColors : hotColors
    const randomColor = () =>
      colors[Math.floor(Math.random() * (colors.length - 1))]

    s.push()
    s.noFill()
    lines.forEach((line) => {
      const [firstPoint] = line
      if (!firstPoint) return
      const { x, y } = firstPoint

      s.strokeWeight(/*Math.random() * */ props.maxWidth)
      if (colorMode === 'random') {
        s.stroke(randomColor())
      } else if (colorMode === 'sectors') {
        const colorNoise: number = s.noise(x / noiseDampX, y / noiseDampY)
        const quadrant = Math.floor(
          interpolate([0, 1], [0, colors.length - 1], colorNoise)
        )
        const alpha = interpolate([0, 1], [200, 255], Math.random())
        const alphaHex = Math.round(alpha).toString(16)
        s.stroke(`${colors[quadrant]}${alphaHex}`)
      } else {
        // const xdomain: [number, number] = [minX, maxX - size]
        // const ydomain: [number, number] = [minY, maxY - size]
        // const xr = Math.floor(interpolate(xdomain, [23, 14], x))
        // const xg = Math.floor(interpolate(xdomain, [35, 243], x))
        // const xb = Math.floor(interpolate(xdomain, [71, 197], x))
        // const yr = Math.floor(interpolate(ydomain, [23, 3], y))
        // const yg = Math.floor(interpolate(ydomain, [35, 130], y))
        // const yb = Math.floor(interpolate(ydomain, [71, 52], y))
        // s.stroke((xr + yr) / 2, (xg + yg) / 2, (xb + yb) / 2)
      }

      s.beginShape()
      line.forEach(({ x, y }) => s.vertex(x, y))
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

  const getCenter = (): Point => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  })

  const getBounds = (totalLength: number): Bounds => {
    const center = getCenter()
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
    totalLength: number,
    distortionFn: NumberConversionFn,
    noise: number
  ): NoiseFn => (x: number, y: number) => {
    const { minX, maxX, minY, maxY } = getBounds(totalLength)
    let angle: number = s.noise(x * noise, y * noise)
    angle = interpolate([minX, maxX], [angle / 10, angle * 1.7], x)
    angle = interpolate([minY, maxY], [angle / 3, angle * 1.2], y)
    return normalizeAngle(distortionFn(angle))
  }

  const simplexNoiseFn = (
    distortionFn: NumberConversionFn,
    noise: number
  ): NoiseFn => (x: number, y: number) =>
    normalizeAngle(distortionFn(simplex.noise2D(x * noise, y * noise)))

  const curlNoiseFn = (
    distortionFn: NumberConversionFn,
    noise: number
  ): NoiseFn => (x: number, y: number) => {
    const eps = 0.0001
    const eps2 = 2 * eps

    // x rate of change
    const x1: number = s.noise((x + eps) * noise, y * noise)
    const x2: number = s.noise((x - eps) * noise, y * noise)

    // x derivative
    var dx = (x1 - x2) / eps2

    // y rate of change
    const y1: number = s.noise(x * noise, (y + eps) * noise)
    const y2: number = s.noise(x * noise, (y - eps) * noise)

    // y derivative
    var dy = (y1 - y2) / eps2

    return distortionFn(Math.atan2(dx, dy))
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
    const normalizedNoise = noise / 1000
    const distortionFn: NumberConversionFn = (angle) =>
      distortion == 0 ? angle : distortion * Math.floor(angle / distortion)
    let noiseFn: NoiseFn
    switch (noiseMode) {
      case 'perlin': {
        noiseFn = perlinNoiseFn(totalLength, distortionFn, normalizedNoise)
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
    }
    switch (drawMode) {
      case 'arrows': {
        drawAsArrows(props, totalLength, noiseFn)
        break
      }
      case 'streams': {
        drawAsStreams(props, totalLength, noiseFn)
        break
      }
    }

    last = props
  }
}
