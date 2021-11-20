import { init as initProps, getProp } from 'utils/propConfig'
import {
  coordWithAngleAndDistance,
  interpolate,
  progressAlongLine,
  randomInRange,
} from 'utils/math'
import { getBoundedSize, getCenter } from 'utils/window'

type Props = {
  n: number
  p: number
  speed: number
  radius: number
  randomness: number
  preventDuplicateTargets: boolean
}

export default (s) => {
  initProps('chaosGame', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    customPlacement: {
      type: 'func',
      labelFn: () => (isPlacing ? 'Finish placing' : 'Place your own dots'),
      callback: () => {
        isPlacing = !isPlacing
        s.clear()
        if (isPlacing) {
          points = []
          window.addEventListener('click', handleClick)
        } else {
          setFirstCursor()
          window.removeEventListener('click', handleClick)
        }
      },
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
      step: 0.01,
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
      min: 0.5,
      step: 0.5,
    },
    randomness: {
      type: 'number',
      default: 0,
      min: 0,
      step: 5,
      onChange: initialize,
    },
    'unique targets': {
      type: 'boolean',
      default: true,
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
    preventDuplicateTargets: get('unique targets'),
  })

  function handleClick(e: MouseEvent) {
    const p: Point = {
      x: e.clientX,
      y: e.clientY,
    }
    points.push(p)
    e.stopPropagation()
    s.circle(p.x, p.y, 10)
  }

  let points: Point[]
  let cursor: Point
  let lastTarget: Point
  let isPlacing: boolean

  function initialize() {
    s.clear()
    points = []
    const { n, randomness } = getProps()
    const size = getBoundedSize() / 2.1
    const center = getCenter()
    for (let i = 0; i < n; i++) {
      const theta = (Math.PI * 2 * i) / n + Math.PI / 2
      const p = coordWithAngleAndDistance(center, theta, size)
      points.push({
        x: p.x + randomInRange(-randomness, randomness),
        y: p.y + randomInRange(-randomness, randomness),
      })
    }
    // points.forEach((point) => s.circle(point.x, point.y, 10))
    setFirstCursor()
  }

  function setFirstCursor() {
    cursor = points[Math.floor(Math.random() * points.length)]
  }

  function iterate(p: number, preventDuplicateTargets: boolean) {
    let target: Point
    if (preventDuplicateTargets) {
      if (lastTarget == null) {
        target = points[Math.floor(Math.random() * points.length)]
      } else {
        do {
          target = points[Math.floor(Math.random() * points.length)]
        } while (target.x == lastTarget.x && target.y == lastTarget.y)
      }
    } else {
      target = points[Math.floor(Math.random() * points.length)]
    }
    lastTarget = target
    cursor = progressAlongLine(target, cursor, p)
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.colorMode(s.HSB, 100)
    s.noStroke()
    initialize()
  }

  s.draw = () => {
    const { p, speed, radius, preventDuplicateTargets } = getProps()

    let _speed = speed * 50
    while (!isPlacing && _speed--) {
      iterate(p, preventDuplicateTargets)
      s.fill(
        interpolate([0, 1], [80, 50], Math.random()),
        interpolate([0, 1], [0, 50], Math.random()),
        interpolate([0, 1], [80, 100], Math.random())
      )
      s.circle(cursor.x, cursor.y, radius)
    }
  }
}
