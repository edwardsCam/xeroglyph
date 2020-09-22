import { init as initProps, getProp } from 'utils/propConfig.ts'
import { coordWithAngleAndDistance, interpolate } from 'utils/math.ts'

type Props = {
  n: number
  period: number
  speed: number
  mode: 'period' | 'speed'
}

type Ball = {
  radiusFromCenter: number
  theta: number
  size: number
}

const FRAMERATE = 60

export default (s) => {
  initProps('poi', {
    n: {
      type: 'number',
      default: 3,
      min: 1,
    },
    period: {
      type: 'number',
      default: 4,
      min: 0.1,
      step: 0.1,
      when: () => get('mode') == 'period',
    },
    speed: {
      type: 'number',
      default: 4,
      min: 0.1,
      step: 0.1,
      when: () => get('mode') == 'speed',
    },
    mode: {
      type: 'dropdown',
      default: 'period',
      options: ['period', 'speed'],
    },
  })
  const get = (prop: string) => getProp('poi', prop)
  const getProps = (): Props => ({
    n: get('n'),
    period: get('period'),
    speed: get('speed'),
    mode: get('mode'),
  })

  let balls: Ball[]

  function mutate(props: Props): void {
    balls = []
    const { period, n } = props
    const seconds = s.frameCount / FRAMERATE

    for (let i = 0; i < n; i++) {
      const a = i / n
      const b = a * period
      const c = seconds + b
      const d = c % period
      let theta = interpolate([0, period], [0, Math.PI * 2], d)
      // if (props.mode === 'speed') {
      //   theta += props.speed
      // }
      balls.push({
        radiusFromCenter: 150 + Math.sin(s.frameCount * 0.01) * 100,
        theta,
        size: 40 + Math.sin(s.frameCount * 0.015) * 30,
      })
    }
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.frameRate(FRAMERATE)
  }

  s.draw = () => {
    s.stroke(255, 255, 255)
    s.fill(0, 0, 0)
    const props = getProps()
    mutate(props)
    balls.forEach((ball) => {
      const location = coordWithAngleAndDistance(
        { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        ball.theta,
        ball.radiusFromCenter
      )
      s.circle(location.x, location.y, ball.size)
    })
  }
}
