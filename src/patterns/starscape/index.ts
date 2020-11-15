import { init as initProps, getProp } from 'utils/propConfig.ts'
import {
  interpolate,
  interpolateSmooth,
  randomInRange,
  Point,
} from 'utils/math.ts'
import shuffle from 'utils/shuffle.ts'

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
      default: 1,
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

  let last: Props
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

  const halfPoint = (): number => window.innerWidth / 2

  const distFromCenter = (x: number): number =>
    Math.abs(halfPoint() - x) * Math.sqrt(2)

  const steps = (n: number): number[] => {
    const plusOne = n + 1
    const step = window.innerWidth / plusOne
    const result: number[] = []
    for (let i = 1; i <= n; i++) result.push(step * i)
    return result
  }

  const drawSpotlights = (props: Props): void => {
    s.push()
    shuffle(steps(props.spotlightCount)).forEach((x) => {
      timeouts.push(
        setTimeout(() => {
          drawSpotlight(x, props)
        }, Math.floor(Math.random() * 50))
      )
    })
    s.pop()
  }

  const drawSpotlight = (x: number, props: Props) => {
    const centerOffset = interpolateSmooth(
      [0, halfPoint()],
      [1, 0],
      distFromCenter(x)
    )
    // rgb(0, 206, 209)
    const r = Math.floor(randomInRange(0, 15))
    const g = Math.floor(randomInRange(200, 220))
    const b = Math.floor(randomInRange(205, 255))
    const a = randomInRange(0, 0.13) + centerOffset / 5
    s.stroke(`rgba(${r}, ${g}, ${b}, ${a})`)
    s.strokeWeight(randomInRange(0.2, 1.5))

    const n = Math.floor(randomInRange(3, 50))
    s.noFill()
    s.beginShape()
    const { spotlightBrambliness } = props
    const randomX = (): number =>
      x + randomInRange(-spotlightBrambliness, spotlightBrambliness)
    s.vertex(randomX(), 0)
    const step = window.innerHeight / n
    for (let i = 1; i < n - 1; i++) {
      s.vertex(randomX(), i * step)
    }
    s.vertex(randomX(), window.innerHeight)

    s.endShape()
  }

  const drawStars = (props: Props): void => {
    s.push()
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
  }

  const drawStarLine = (x: number, density: number, props: Props): void => {
    const { innerHeight } = window
    let j = innerHeight
    const d = innerHeight / density
    const dots: {
      color: string
      point: Point
      radius: number
    }[] = []
    while (j > 0) {
      const p = interpolate([innerHeight, 0], [0, 1], j)
      const pureJump = interpolate(
        [0, 1],
        [d, d + d * props.starDensityFalloff],
        p
      )
      const random = s.noise(x / 100)
      const jump = Math.max(1, pureJump + random * d)
      j -= jump
      const xWithWiggle = x + randomInRange(-1, 1) * props.starXWiggle
      const r = Math.floor(randomInRange(200, 255))
      const g = Math.floor(randomInRange(200, 255))
      const b = Math.floor(randomInRange(200, 255))
      const a = randomInRange(0.2, 0.6)
      const color = `rgba(${r}, ${g}, ${b}, ${a})`
      dots.push({
        color,
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
          s.fill(dot.color)
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

    clearTimeouts()
    if (props.clearOnDraw) s.clear()
    if (props.showLines) drawSpotlights(props)
    drawStars(props)

    last = props
  }
}
