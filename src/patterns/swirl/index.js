import { thetaFromTwoPoints, distance, clamp, interpolate } from 'utils/math'
import * as _p5_ from 'p5'

class Particle {
  constructor(s, { position = s.createVector(0, 0) }) {
    this.position = position
    this.velocity = s.createVector(0, 0)
    this.acceleration = s.createVector(0, 0)
    this.pathHistory = []
    this.traceSteps = 0
    this.s = s
  }

  move(props) {
    this.traceSteps++
    if (this.traceSteps > props.traceResolution) {
      this.traceSteps = 0
      this.pathHistory.push(
        this.s.createVector(this.position.x, this.position.y)
      )
      if (
        this.pathHistory.length >
        props.traceDistance / props.traceResolution
      ) {
        this.pathHistory.shift()
      }
    }

    this.velocity.add(this.acceleration)

    this.velocity.x = clamp(
      -props.maxSpeed,
      props.maxSpeed,
      this.velocity.x
    )
    this.velocity.y = clamp(
      -props.maxSpeed,
      props.maxSpeed,
      this.velocity.y
    )

    this.position.add(this.velocity)
  }

  gravitate(center, props) {
    const theta = thetaFromTwoPoints(this.position, center)
    const d = distance(this.position, center)
    const pull = clamp(
      props.minGrav,
      props.maxGrav,
      props.gravStrength / (d * d)
    )

    this.acceleration = this.s.createVector(1, 0)
    this.acceleration.setMag(pull)
    this.acceleration.rotate(theta)
  }
}

class ParticleSystem {
  constructor(s, props) {
    this.s = s
    this.props = props
    this.particles = [
      [10, 10],
      [15, 30],
      [20, 50],
      [25, 70],
      [30, 90],
      [35, 110],
      [40, 130],
      [45, 150],
      [50, 170],
      [55, 190],
      [60, 210],
      [65, 230],
      [70, 250],
      [75, 270],
      [80, 290],
      [85, 310],
      [85, 330],
      [85, 350],
      [85, 370],
      [85, 390],
      [85, 410],
      [85, 430],
      [85, 450],
      [85, 470],
      [85, 490],
    ].map(([x, y]) => new Particle(s, { position: s.createVector(x, y) }))
    this.center = s.createVector(window.innerWidth / 2, window.innerHeight / 2)
  }

  mutate() {
    this.center.x = this.s.mouseX
    this.center.y = this.s.mouseY
    this.particles.forEach(particle => {
      particle.gravitate(this.center, this.props)
      particle.move(this.props)
    })
  }

  draw() {
    this.particles.forEach((particle, particleIdx) => {
      this.s.stroke(0, 0, 0)
      this.s.ellipse(particle.position.x, particle.position.y, 10, 10)
      for (let i = 1; i < particle.pathHistory.length; i++) {
        const p1 = particle.pathHistory[i - 1]
        const p2 = particle.pathHistory[i]

        const { r, g, b } = this.props.colorFn(
          particle,
          particleIdx,
          this.particles.length - 1,
          i
        )
        this.s.stroke(r, g, b)
        this.s.line(p1.x, p1.y, p2.x, p2.y)
      }
    })
  }
}

export default s => {
  const particles = new ParticleSystem(s, {
    maxSpeed: 9,
    minGrav: 0.2,
    maxGrav: 1,
    gravStrength: 500,
    traceDistance: 200,
    traceResolution: 4,
    colorFn: (particle, idx, maxIdx, historyPathIdx) => ({
      r: interpolate(
        [0, particle.pathHistory.length - 1],
        [23, 228],
        historyPathIdx
      ),
      g: interpolate(
        [0, particle.pathHistory.length - 1],
        [10, 242],
        historyPathIdx
      ),
      b: interpolate(
        [0, particle.pathHistory.length - 1],
        [25, 240],
        historyPathIdx
      ),
    }),
  })

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
  }

  s.draw = () => {
    s.clear()
    particles.mutate()
    particles.draw()
  }
}
