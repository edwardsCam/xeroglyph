import { init as initProps, getProp } from 'utils/propConfig.ts'
import { coordWithAngleAndDistance, interpolate, TWO_PI } from 'utils/math.ts'

type Props = {
  n: number
  period: number
  speed: number
  mode: 'constant time' | 'constant speed'
}

type BallProps = {
  radiusFromCenter: number
  theta: number
  size: number
}

const FRAMERATE = 60

export default (s) => {
  initProps('poi', {
    draw: {
      type: 'func',
      label: 'Clear',
      callback: initialize,
    },
    n: {
      type: 'number',
      default: 3,
      min: 1,
    },
    period: {
      type: 'number',
      default: 5,
      min: 0.1,
      step: 0.1,
      when: () => get('mode') == 'constant time',
    },
    speed: {
      type: 'number',
      default: 3,
      min: 0.2,
      step: 0.2,
      when: () => get('mode') == 'constant speed',
    },
    mode: {
      type: 'dropdown',
      default: 'constant time',
      options: ['constant speed', 'constant time'],
    },
  })
  const get = (prop: string) => getProp('poi', prop)
  const getProps = (): Props => ({
    n: get('n'),
    period: get('period'),
    speed: get('speed'),
    mode: get('mode'),
  })

  const bound = (): number =>
    Math.min(window.innerHeight / 2, window.innerWidth / 2) * 0.85
  const getSize = (): number => Math.sin(s.frameCount * 0.001) * 50
  const getRadius = (): number => Math.sin(s.frameCount * 0.001) * bound()

  class Ball {
    radiusFromCenter: number
    theta: number
    size: number

    constructor(props: BallProps) {
      this.radiusFromCenter = props.radiusFromCenter
      this.theta = props.theta
      this.size = props.size
    }

    mutate({ mode, period, speed }: Props): void {
      const r = getRadius()
      this.radiusFromCenter = r
      this.size = getSize()
      let dt: number
      if (mode === 'constant time') {
        dt = TWO_PI / (FRAMERATE * period)
      } else {
        dt = r == 0 ? 0 : speed / r
      }
      this.theta += dt
    }
  }

  let balls: Ball[]

  function mutate(): void {
    const props = getProps()
    balls.forEach((ball) => {
      ball.mutate(props)
    })
  }

  function initialize(): void {
    s.clear()
    s.stroke(255, 255, 255)
    s.fill(0, 0, 0, 60)
    balls = []
    const { n } = getProps()
    for (let i = 0; i < n; i++) {
      balls.push(
        new Ball({
          radiusFromCenter: getRadius(),
          theta: interpolate([0, n], [0, TWO_PI], i),
          size: getSize(),
        })
      )
    }
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.frameRate(FRAMERATE)
    initialize()
  }

  s.draw = () => {
    mutate()
    balls.forEach((ball) => {
      const { x, y } = coordWithAngleAndDistance(
        { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        ball.theta,
        ball.radiusFromCenter
      )
      s.circle(x, y, ball.size)
    })
  }
}
