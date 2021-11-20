import { init as initProps, getProp } from 'utils/propConfig'
import { interpolate, interpolateSmooth, randomInRange } from 'utils/math'
import shuffle from 'utils/shuffle'
import pushpop from 'utils/pushpop'

type Props = {
  clearOnDraw: boolean
  spotlightCount: number
  showLines: number
  spotlightBrambliness: number
  starDensityY: number
  starDensityX: number
  starDensityFalloff: number
  starXWiggle: number
}

const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight

export default (s) => {
  initProps('starscape', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    'clear on draw': {
      type: 'boolean',
      default: true,
    },
    'show lines': {
      type: 'boolean',
      default: true,
    },
    spotlights: {
      type: 'number',
      default: 500,
      min: 1,
    },
    brambliness: {
      type: 'number',
      min: 0,
      default: 2,
      step: 0.5,
    },
    'star density (x)': {
      type: 'number',
      default: 200,
      min: 5,
      step: 5,
    },
    'star density (y)': {
      type: 'number',
      default: 300,
      min: 5,
      step: 5,
    },
    starDensityFalloff: {
      type: 'number',
      default: 100,
      min: 0,
    },
    starXWiggle: {
      type: 'number',
      default: 4,
      min: 0,
    },
  })

  let last: Props | undefined
  let timeouts: NodeJS.Timeout[] = []

  const get = (prop: string) => getProp('starscape', prop)
  const getProps = (): Props => ({
    clearOnDraw: get('clear on draw'),
    showLines: get('show lines'),
    spotlightCount: get('spotlights'),
    starDensityY: get('star density (y)'),
    starDensityX: get('star density (x)'),
    starDensityFalloff: get('starDensityFalloff'),
    starXWiggle: get('starXWiggle'),
    spotlightBrambliness: get('brambliness'),
  })

  const halfPoint = (): number => WIDTH / 2

  const distFromCenter = (x: number): number =>
    Math.abs(halfPoint() - x) * Math.sqrt(2)

  const steps = (n: number): number[] => {
    const plusOne = n + 1
    const step = WIDTH / plusOne
    const result: number[] = []
    for (let i = 1; i <= n; i++) result.push(step * i)
    return result
  }

  const drawSpotlights = (props: Props): void => {
    pushpop(s, () => {
      shuffle(steps(props.spotlightCount)).forEach((x) => {
        timeouts.push(
          setTimeout(() => {
            drawSpotlight(x, props)
          }, Math.floor(Math.random() * 50))
        )
      })
    })
  }

  const drawSpotlight = (x: number, { spotlightBrambliness }: Props) => {
    pushpop(s, () => {
      const centerOffset = interpolateSmooth(
        [0, halfPoint()],
        [1, 0],
        distFromCenter(x)
      )
      const _h = randomInRange(38, 46, true)
      const _s = randomInRange(62, 65, true)
      const _b = randomInRange(68, 72, true)
      const _a = randomInRange(0, 30) + centerOffset * 40
      s.stroke(_h, _s, _b, _a)
      s.strokeWeight(randomInRange(0.1, 1.5))
      s.noFill()

      const n = randomInRange(3, 50, true)
      const randomX = (): number =>
        x + randomInRange(-spotlightBrambliness, spotlightBrambliness)
      s.beginShape()
      s.vertex(randomX(), 0)
      const step = HEIGHT / n
      for (let i = 1; i < n - 1; i++) {
        s.vertex(randomX(), i * step)
      }
      s.vertex(randomX(), HEIGHT)

      s.endShape()
    })
  }

  const drawStars = (props: Props): void => {
    pushpop(s, () => {
      s.noStroke()
      const _halfPoint = halfPoint()
      shuffle(steps(props.starDensityX)).forEach((x) => {
        const centerOffset = interpolateSmooth(
          [0, _halfPoint],
          [0, 1],
          distFromCenter(x)
        )
        const verticalDensity =
          s.noise(x) * props.starDensityY * 10 * centerOffset
        timeouts.push(
          setTimeout(() => {
            drawStarLine(x, verticalDensity, props)
          }, Math.floor(Math.random() * 50))
        )
      })
    })
  }

  const drawStarLine = (
    x: number,
    density: number,
    { starDensityFalloff, starXWiggle }: Props
  ): void => {
    let j = HEIGHT
    const d = HEIGHT / density
    const dots: {
      color: [number, number, number, number]
      point: Point
      radius: number
    }[] = []
    while (j > 0) {
      const p = interpolate([HEIGHT, 0], [0, 1], j)
      const pureJump = interpolate([0, 1], [d, d + d * starDensityFalloff], p)
      const random = s.noise(x / 100)
      const jump = Math.max(1, pureJump + random * d)
      j -= jump
      const xWithWiggle = x + randomInRange(-1, 1) * starXWiggle
      const _h = randomInRange(47, 53, true)
      const _s = randomInRange(10, 50, true)
      const _b = randomInRange(93, 100, true)
      const _a = randomInRange(40, 99, true)
      dots.push({
        color: [_h, _s, _b, _a],
        point: {
          x: xWithWiggle,
          y: j,
        },
        radius: randomInRange(0.5, 4),
      })
    }
    dots.forEach((dot) => {
      timeouts.push(
        setTimeout(() => {
          s.fill(...dot.color)
          s.circle(dot.point.x, dot.point.y, dot.radius)
        }, Math.floor(Math.random() * 700))
      )
    })
  }

  const clearTimeouts = () => {
    timeouts.forEach((timeout) => clearTimeout(timeout))
    timeouts = []
  }

  function initialize() {
    s.clear()
    clearTimeouts()
    last = undefined
  }

  s.setup = () => {
    s.createCanvas(WIDTH, HEIGHT)
    s.colorMode(s.HSB, 100)
    initialize()
  }

  s.draw = () => {
    const props = getProps()
    // @ts-ignore
    if (last && Object.keys(last).every((prop) => last[prop] === props[prop])) {
      return
    }

    clearTimeouts()
    if (props.clearOnDraw) s.clear()

    pushpop(s, () => {
      s.fill('black')
      s.rect(0, 0, WIDTH, HEIGHT)
    })

    if (props.showLines) drawSpotlights(props)
    drawStars(props)

    last = props
  }
}
