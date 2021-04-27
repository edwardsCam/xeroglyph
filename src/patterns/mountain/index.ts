import { init as initProps, getProp } from 'utils/propConfig'
import { interpolate, Point, randomInRange } from 'utils/math'

type Props = {
  n: number
  spikiness: number
  symmetric: boolean
  curveTightness: number
  clearOnDraw: boolean
  widthPercent: number
  showMountain: boolean
  showStars: boolean
  starDensityX: number
  starDensityY: number
  starDensityFalloff: number
  starXWiggle: number
}

export default (s) => {
  initProps('mountain', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    n: {
      type: 'number',
      default: 40,
      min: 1,
    },
    spikiness: {
      type: 'number',
      default: 200,
      min: 0,
      step: 10,
    },
    symmetric: {
      type: 'boolean',
      default: false,
    },
    curveTightness: {
      type: 'number',
      min: -5,
      max: 5,
      step: 0.2,
      default: 0,
    },
    'clear on draw': {
      type: 'boolean',
      default: true,
    },
    'width (%)': {
      type: 'number',
      default: 50,
      min: 0,
      max: 100,
    },
    'show mountain': {
      type: 'boolean',
      default: true,
    },
    'show stars': {
      type: 'boolean',
      default: true,
    },
    'star density (x)': {
      type: 'number',
      default: 100,
      min: 1,
      when: () => get('show stars'),
    },
    'star density (y)': {
      type: 'number',
      default: 500,
      min: 1,
      when: () => get('show stars'),
    },
    starDensityFalloff: {
      type: 'number',
      default: 100,
      min: 0,
      when: () => get('show stars'),
    },
    starXWiggle: {
      type: 'number',
      default: 10,
      min: 0,
      when: () => get('show stars'),
    },
  })

  let last: Props | undefined

  const get = (prop: string) => getProp('mountain', prop)
  const getProps = (): Props => ({
    n: get('n'),
    spikiness: get('spikiness'),
    symmetric: get('symmetric'),
    clearOnDraw: get('clear on draw'),
    widthPercent: get('width (%)'),
    showMountain: get('show mountain'),
    showStars: get('show stars'),
    starDensityX: get('star density (x)'),
    starDensityY: get('star density (y)'),
    starDensityFalloff: get('starDensityFalloff'),
    starXWiggle: get('starXWiggle'),
    curveTightness: get('curveTightness'),
  })

  const getXposAt = (
    i: number,
    { widthPercent, n }: Props,
    _minX?: number,
    _step?: number
  ): number => {
    if (_minX == null || _step == null) {
      const halfPoint = window.innerWidth / 2
      const width = Math.floor((window.innerWidth * widthPercent) / 100)
      const halfWidth = width / 2
      const step = halfWidth / n
      const minX = halfPoint - halfWidth
      return minX + step * i
    } else {
      return _minX + _step * i
    }
  }

  const buildMtn = (props: Props): Point[] => {
    const points: Point[] = []
    const halfPoint = window.innerWidth / 2
    const width = Math.floor((window.innerWidth * props.widthPercent) / 100)
    const halfWidth = width / 2
    const step = halfWidth / props.n
    const minX = halfPoint - halfWidth

    for (let i = 0; i <= props.n; i++) {
      const x = getXposAt(i, props, minX, step)
      const yPreference = interpolate(
        [0, props.n],
        [window.innerHeight, 200],
        i
      )
      const variance = interpolate([0, props.n], [0, 1], i)
      // const noise = s.noise(x, yPreference) - 0.5
      const noise = randomInRange(-1, 1)
      const y = yPreference + noise * props.spikiness * variance
      points.push({ x, y })
      if (i === 0) points.push({ x, y })
    }

    for (let i = 1; i <= props.n; i++) {
      const x = getXposAt(i + props.n, props, minX, step)
      if (props.symmetric) {
        const y = points[props.n - i].y
        points.push({ x, y })
      } else {
        const yPreference = interpolate(
          [0, props.n],
          [200, window.innerHeight],
          i
        )
        const variance = interpolate([0, props.n], [1, 0], i)
        // const noise = s.noise(x, yPreference) - 0.5
        const noise = randomInRange(-1, 1)
        const y = yPreference + noise * props.spikiness * variance
        points.push({ x, y })
        if (i === props.n) points.push({ x, y })
      }
    }

    return points
  }

  const drawMtn = (props: Props): void => {
    const points = buildMtn(props)
    s.beginShape()
    s.curveTightness(props.curveTightness)
    points.forEach(({ x, y }) => s.curveVertex(x, y))
    s.endShape()
  }

  const drawBorealis = (props: Props): void => {
    s.push()
    const { innerWidth } = window
    const halfPoint = innerWidth / 2
    const step = innerWidth / props.starDensityX
    for (let x = 0; x < innerWidth; x += step) {
      const distFromCenter = Math.abs(halfPoint - x)
      const centerOffset = interpolate([0, halfPoint], [1, 0], distFromCenter)
      const r = randomInRange(0, 0.2)
      const a = r + centerOffset / 5
      s.stroke(`rgba(255, 255, 255, ${a})`)
      s.strokeWeight(randomInRange(0.2, 1.5))
      s.line(x, 0, x, window.innerHeight)
    }
    s.pop()
  }

  const drawStars = (props: Props): void => {
    s.push()
    s.noStroke()
    const { innerWidth } = window
    const step = innerWidth / props.starDensityX
    for (let x = 0; x < innerWidth; x += step) {
      const verticalDensity = s.noise(x) * props.starDensityY * 6
      drawStarLine(x, verticalDensity, props)
    }
    s.pop()
  }

  const drawStarLine = (x: number, density: number, props: Props): void => {
    const { innerHeight } = window
    let j = innerHeight
    const d = innerHeight / density
    while (j > 0) {
      const p = interpolate([innerHeight, 0], [0, 1], j)
      const pureJump = interpolate([0, 1], [d, d * props.starDensityFalloff], p)
      const random = s.noise(x / 100)
      const jump = Math.max(1, pureJump + random * d)
      j -= jump
      const xWithWiggle = x + randomInRange(-1, 1) * props.starXWiggle
      const a = randomInRange(0.2, 0.6)
      const color = `rgba(255, 255, 255, ${a})`
      s.fill(color)
      s.circle(xWithWiggle, j, randomInRange(0.5, 4))
    }
  }

  function initialize() {
    s.clear()
    last = undefined
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  s.draw = () => {
    const props = getProps()
    if (last && Object.keys(last).every((prop) => last[prop] === props[prop])) {
      return
    }
    if (props.clearOnDraw) s.clear()

    s.fill('#000f')
    s.stroke('#ffff')
    if (props.showStars) {
      drawBorealis(props)
      drawStars(props)
    }
    if (props.showMountain) {
      drawMtn(props)
    }

    last = props
  }
}
