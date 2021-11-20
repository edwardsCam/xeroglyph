import { init as initProps, getProp } from 'utils/propConfig'
import { interpolate, coinToss } from 'utils/math'
import shuffle from 'utils/shuffle'

type Props = {
  n: number
  base: number
  variance: number
  doShuffle: boolean
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
    shuffle: {
      type: 'boolean',
    },
  })
  const get = (prop: string) => getProp('beads', prop)
  const getProps = (): Props => ({
    n: get('n'),
    base: get('base'),
    variance: get('variance'),
    doShuffle: get('shuffle'),
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
    // @ts-ignore
    if (last && Object.keys(last).every((prop) => last[prop] === props[prop])) {
      return
    }

    s.clear()
    const { n, base, variance, doShuffle } = props
    const cols: number[] = []
    for (let c = 0; c < n; c++) {
      cols.push(c)
    }
    ;(doShuffle ? shuffle(cols) : cols).forEach((c) => {
      const inverted = coinToss()
      for (
        let r = inverted ? n - 1 : 0;
        inverted ? r >= 0 : r < n;
        inverted ? r-- : r++
      ) {
        const x = interpolate([0, n - 1], [50, window.innerWidth - 50], c)
        const y = interpolate([0, n - 1], [50, window.innerHeight - 50], r)
        const noise = s.noise(x, y) * variance
        const radius = Math.max(0, base + noise)

        s.fill(
          50, //interpolate([0, 1], [0, 5], Math.random()),
          interpolate([0, 1], [0, 8], Math.random()),
          interpolate([0, 1], [92, 100], Math.random())
        )
        s.stroke(
          0,
          interpolate([0, 1], [0, 8], Math.random()),
          interpolate([0, 1], [0, 8], Math.random())
        )
        s.circle(x, y, radius)
      }
    })
    last = props
  }
}
