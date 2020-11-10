import { init as initProps, getProp } from 'utils/propConfig.ts'
import { interpolate, Point } from 'utils/math.ts'

type Props = {
  n: number
  spikiness: number
  symmetric: boolean
  clearOnDraw: boolean
  widthPercent: number
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
      default: 50,
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
      default: true,
    },
    'clear on draw': {
      type: 'boolean',
      default: false,
    },
    'width (%)': {
      type: 'number',
      default: 50,
      min: 0,
      max: 100,
    },
  })

  let last: Props

  const get = (prop: string) => getProp('mountain', prop)
  const getProps = (): Props => ({
    n: get('n'),
    spikiness: get('spikiness'),
    symmetric: get('symmetric'),
    clearOnDraw: get('clear on draw'),
    widthPercent: get('width (%)'),
  })

  const buildMtn = ({
    n,
    spikiness,
    symmetric,
    widthPercent,
  }: Props): Point[] => {
    const points: Point[] = []
    const halfPoint = window.innerWidth / 2
    const width = Math.floor((window.innerWidth * widthPercent) / 100)
    const halfWidth = width / 2
    const step = halfWidth / n
    const minX = halfPoint - halfWidth

    for (let i = 0; i <= n; i++) {
      const x = minX + step * i
      const yPreference = interpolate([0, n], [window.innerHeight, 200], i)
      const variance = interpolate([0, n], [0, 1], i)
      const noise = s.noise(x, yPreference) - 0.5
      const y = yPreference + noise * spikiness * variance
      points.push({ x, y })
    }

    for (let i = 0; i <= n; i++) {
      const x = halfPoint + step * i
      if (symmetric) {
        const y = points[n - i].y
        points.push({ x, y })
      } else {
        const yPreference = interpolate([0, n], [200, window.innerHeight], i)
        const variance = interpolate([0, n], [1, 0], i)
        const noise = s.noise(x, yPreference) - 0.5
        const y = yPreference + noise * spikiness * variance
        points.push({ x, y })
      }
    }

    return points
  }

  const drawMtn = (props: Props): void => {
    const points = buildMtn(props)
    s.beginShape()
    points.forEach(({ x, y }) => s.vertex(x, y))
    s.endShape()
  }

  function initialize() {
    s.clear()
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
    drawMtn(props)

    last = props
  }
}
