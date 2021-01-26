import { init as initProps, getProp } from 'utils/propConfig.ts'
import { interpolate, Point } from 'utils/math.ts'

type Props = {
  n: number
  base: number
  variance: number
}

export default (s) => {
  initProps('beads', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    n: {
      type: 'number',
      default: 50,
      min: 3,
    },
    base: {
      type: 'number',
      default: 5,
      step: 0.25,
      min: Number.NEGATIVE_INFINITY,
    },
    variance: {
      type: 'number',
      default: 30,
      min: 0,
    },
  })
  const get = (prop: string) => getProp('beads', prop)
  const getProps = (): Props => ({
    n: get('n'),
    base: get('base'),
    variance: get('variance'),
  })

  let last: Props | undefined

  function initialize() {
    s.clear()
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.colorMode(s.HSB, 100)
    initialize()
  }

  s.draw = () => {
    const props = getProps()
    if (last && Object.keys(last).every((prop) => last[prop] === props[prop])) {
      return
    }

    s.clear()
    const { n, base, variance } = props
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const x = interpolate([0, n - 1], [50, window.innerWidth - 50], c)
        const y = interpolate([0, n - 1], [50, window.innerHeight - 50], r)
        const noise = s.noise(x, y) * variance
        const radius = Math.max(0, base + noise)

        // s.fill(interpolate([0, 1], [0, 30], Math.random()), interpolate([0, 1], [10, 50], Math.random()), 100)
        s.circle(x, y, radius)
      }
    }
    last = props
  }
}
