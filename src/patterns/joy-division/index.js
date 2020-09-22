import { interpolate, clamp } from 'utils/math.ts'
import { init as initProps, getProp } from 'utils/propConfig.ts'

export default (s) => {
  class Particle {
    constructor(props) {
      this.position = props.position
      this.initialPosition = s.createVector(props.position.x, props.position.y)
      this.velocity = s.createVector(props.xSpeed, 0)
      this.acceleration = s.createVector()
      this.history = []
      this.pathStep = 0
    }

    move(props) {
      if (this.position.x > window.innerWidth - 20) return
      if (this.pathStep++ > props.pathDelay) {
        this.pathStep = 0
        this.history.push(s.createVector(this.position.x, this.position.y))
      }
      if (this.position.x > props.initialDistance) {
        if (this.position.x > window.innerWidth / props.splitDistance) {
          const xDiff = window.innerWidth - this.position.x
          let yAccel = this.initialPosition.y - this.position.y
          yAccel /= xDiff
          yAccel /= props.yAccelDamp
          yAccel = clamp(-props.maxAccel, props.maxAccel, yAccel)
          this.acceleration = s.createVector(0, yAccel)
        } else {
          this.acceleration = s.createVector(
            0,
            (Math.random() - 0.5) / props.randomnessDamp
          )
        }
      }
      this.velocity.add(this.acceleration)
      this.position.add(this.velocity)
    }

    draw(props, row) {
      if (this.history.length < 2) return
      if (this.position.x > window.innerWidth - 20) return
      const maxRow = props.lineCount - 1
      const p1 = this.history[this.history.length - 2]
      const p2 = this.history[this.history.length - 1]
      if (props.fillBehind) {
        const [r1, g1, b1, r2, g2, b2] = [157, 171, 134, 235, 130, 66]
        const [fillR, fillG, fillB] = [
          interpolate([0, maxRow], [r1, r2], row),
          interpolate([0, maxRow], [g1, g2], row),
          interpolate([0, maxRow], [b1, b2], row),
        ]
        s.fill(fillR, fillG, fillB)
        s.stroke(fillR, fillG, fillB)
        s.quad(
          p1.x,
          p1.y,
          p2.x,
          p2.y,
          p2.x,
          window.innerHeight,
          p1.x,
          window.innerHeight
        )
      }

      if (props.fillBehind) {
        s.stroke(0, 0, 0)
      } else {
        s.stroke(255, 255, 255)
      }
      s.line(p1.x, p1.y, p2.x, p2.y)
    }
  }

  class Particles {
    constructor(props) {
      this.particles = []
      const numSpaces = props.lineCount - 1
      const totalHeight = numSpaces * props.lineSpacing
      const y1 = window.innerHeight / 2 - totalHeight / 2
      for (let i = 0; i < props.lineCount; i++) {
        this.particles.push(
          new Particle({
            ...props,
            position: s.createVector(20, i * props.lineSpacing + y1),
          })
        )
      }
    }

    move(props) {
      this.particles.forEach((particle) => {
        particle.move(props)
      })
    }

    draw(props) {
      this.particles.forEach((particle, r) => {
        particle.draw(props, r)
      })
    }
  }

  const get = (prop) => getProp('joyDivision', prop)
  const getProps = () => ({
    initialDistance: get('initialDistance'),
    lineCount: get('lineCount'),
    lineSpacing: get('lineSpacing'),
    pathDelay: get('pathDelay'),
    fillBehind: get('fillBehind'),
    xSpeed: get('xSpeed'),
    randomnessDamp: get('randomnessDamp'),
    yAccelDamp: get('yAccelDamp'),
    maxAccel: get('maxAccel'),
    splitDistance: get('splitDistance'),
  })

  initProps('joyDivision', {
    draw: {
      type: 'func',
      label: 'Restart!',
      callback: () => {
        s.clear()

        /* eslint-disable-next-line no-use-before-define */
        particles = new Particles(getProps())
      },
    },
    lineCount: {
      type: 'number',
      default: 100,
      min: 1,
      step: 1,
    },
    lineSpacing: {
      type: 'number',
      default: 5,
      min: 1,
      step: 1,
    },
    pathDelay: {
      type: 'number',
      default: 1,
      min: 1,
      step: 1,
    },
    xSpeed: {
      type: 'number',
      default: 0.8,
      min: 0.1,
      step: 0.05,
    },
    randomnessDamp: {
      type: 'number',
      default: 70,
      min: 5,
      step: 5,
    },
    yAccelDamp: {
      type: 'number',
      default: 70,
      min: 5,
      step: 5,
    },
    maxAccel: {
      type: 'number',
      default: 0.02,
      min: 0.005,
      step: 0.005,
    },
    initialDistance: {
      type: 'number',
      default: 70,
      min: 0,
      step: 5,
    },
    splitDistance: {
      type: 'number',
      default: 1.8,
      min: 0.1,
      step: 0.1,
    },
    fillBehind: {
      type: 'boolean',
      default: true,
    },
  })

  let particles = new Particles(getProps())

  let isPaused = false

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    window.addEventListener('keydown', function (e) {
      if (e.code === 'Space') {
        isPaused = !isPaused
      }
    })
  }

  s.draw = () => {
    if (isPaused) return
    const props = getProps()
    particles.move(props)
    particles.draw(props)
  }
}
