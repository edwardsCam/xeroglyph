import { interpolate, clamp } from 'utils/math'
import { init as initProps, getProp } from 'utils/propConfig'

export default s => {
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
        const [fillR, fillG, fillB] = props.colorTween
          ? [
              interpolate([0, maxRow], [r1, r2], row),
              interpolate([0, maxRow], [g1, g2], row),
              interpolate([0, maxRow], [b1, b2], row),
            ]
          : [0, 0, 0]
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

      if (props.colorTween) {
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
      this.particles.forEach(particle => {
        particle.move(props)
      })
    }

    draw(props) {
      this.particles.forEach((particle, r) => {
        particle.draw(props, r)
      })
    }
  }

  initProps('joyDivision', {})

  const get = prop => getProp('joyDivision', prop)
  const getProps = () => ({
    initialDistance: 70,
    lineCount: 100,
    lineSpacing: 5,
    pathDelay: 1,
    fillBehind: true,
    xSpeed: 0.8,
    randomnessDamp: 70,
    yAccelDamp: 70,
    maxAccel: 0.02,
    splitDistance: 1.8,

    colorTween: true,
  })

  const props = getProps()

  const particles = new Particles(props)

  let isPaused = false

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    window.addEventListener('keydown', function(e) {
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
