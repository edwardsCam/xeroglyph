import { init as initProps, getProp } from 'utils/propConfig.ts'
import {
  Point,
  progressAlongLine,
  coordWithAngleAndDistance,
  randomInRange,
} from 'utils/math.ts'
import { getBoundedSize, getCenter } from 'utils/window.ts'

type Props = {
  n: number
  p: number
  speed: number
  radius: number
  randomness: number
}

export default (s) => {
  initProps('chaosGame', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    n: {
      type: 'number',
      default: 4,
      min: 3,
      onChange: initialize,
    },
    p: {
      type: 'number',
      default: 0.44,
      min: 0,
      max: 1,
      step: 0.02,
      onChange: initialize,
    },
    speed: {
      type: 'number',
      default: 2,
      min: 1,
    },
    'dot size': {
      type: 'number',
      default: 2,
      min: 1,
    },
    randomness: {
      type: 'number',
      default: 0,
      min: 0,
      step: 5,
      onChange: initialize,
    },
  })
  const get = (prop: string) => getProp('chaosGame', prop)
  const getProps = (): Props => ({
    n: get('n'),
    p: get('p'),
    speed: get('speed'),
    radius: get('dot size'),
    randomness: get('randomness'),
  })

  let points: Point[]
  let cursor: Point

  function initialize() {
    s.clear()
    points = []
    const { n, randomness } = getProps()
    const size = getBoundedSize() / 2
    const center = getCenter()
    for (let i = 0; i < n; i++) {
      const theta = (Math.PI * 2 * i) / n
      const p = coordWithAngleAndDistance(center, theta, size)
      points.push({
        x: p.x + randomInRange(-randomness, randomness),
        y: p.y + randomInRange(-randomness, randomness),
      })
    }
    // points.forEach((point) => s.circle(point.x, point.y, 10))
    cursor = points[Math.floor(Math.random() * points.length)]
  }

  function iterate(p: number) {
    const target = points[Math.floor(Math.random() * points.length)]
    cursor = progressAlongLine(target, cursor, p)
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.fill('white')
    s.noStroke()
    initialize()
  }

  s.draw = () => {
    const { p, speed, radius } = getProps()

    let _speed = speed * 50
    while (_speed--) {
      iterate(p)
      s.circle(cursor.x, cursor.y, radius)
    }
  }
}
