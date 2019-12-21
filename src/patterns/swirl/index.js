import { thetaFromTwoPoints, distance, clamp, interpolate } from 'utils/math'
import { init as initProps, getProp, setProp } from 'utils/propConfig'

function calculateGravBetweenTwoBodies(p1, p2, { minGrav, maxGrav }) {
  const d = distance(p1.position, p2.position)
  const massConstant = p1.mass * p2.mass
  return {
    theta: thetaFromTwoPoints(p1.position, p2.position),
    strength: clamp(minGrav, maxGrav, massConstant / (d * d)),
  }
}

export default s => {
  let hasMouseMoved = false

  function getGravVector(p1, p2, props) {
    const { strength, theta } = calculateGravBetweenTwoBodies(p1, p2, props)

    const vector = s.createVector(1, 0)
    vector.setMag(strength)
    vector.rotate(theta)
    return vector
  }

  class Particle {
    constructor({ position, mass = 1 }) {
      this.position = position
      this.velocity = s.createVector(0, 1)
      this.acceleration = s.createVector(0, 0)
      this.pathHistory = []
      this.mass = mass
      this.traceSteps = 0
    }

    move(props) {
      if (++this.traceSteps > props.traceResolution) {
        this.traceSteps = 0
        this.pathHistory.push(s.createVector(this.position.x, this.position.y))
        while (this.pathHistory.length - 1 > props.numTraceSteps) {
          this.pathHistory.shift()
        }
      }

      this.velocity.add(this.acceleration)

      this.velocity.x = clamp(-props.maxSpeed, props.maxSpeed, this.velocity.x)
      this.velocity.y = clamp(-props.maxSpeed, props.maxSpeed, this.velocity.y)

      this.position.add(this.velocity)
    }

    draw(props) {
      if (props.renderDots) {
        s.stroke(0, 0, 0)
        s.ellipse(this.position.x, this.position.y, 10, 10)
      }
      for (let i = 1; i < this.pathHistory.length; i++) {
        const { r, g, b } = props.colorFn(this, i)
        s.stroke(r, g, b)

        const p1 = this.pathHistory[i - 1]
        const p2 = this.pathHistory[i]
        s.line(p1.x, p1.y, p2.x, p2.y)
      }
    }

    calculateGravToMouse(mousePos, props) {
      this.acceleration = getGravVector(this, mousePos, props)
    }
  }

  class ParticleSystem {
    constructor(props) {
      this.particles = [
        [10, 20],
        [15, 80],
        [20, 140],
        [25, 200],
        [30, 260],
        [35, 320],
        [40, 380],
        [45, 440],
        [50, 500],
        [55, 560],
        [55, 620],
        [55, 700],
        [55, 760],
      ].map(
        ([x, y]) =>
          new Particle({ position: s.createVector(x, y), mass: props.dotMass })
      )
    }

    mutate(props) {
      this.calculateGravitationalPulls(props)
      this.particles.forEach(particle => {
        particle.move(props)
      })
    }

    draw(props) {
      this.particles.forEach(particle => {
        particle.draw(props)
      })
    }

    calculateGravitationalPulls(props) {
      this.particles.forEach((particle, i) => {
        particle.calculateGravToMouse(
          {
            mass: props.mouseMass,
            position: {
              x: hasMouseMoved ? s.mouseX : window.innerWidth / 2,
              y: hasMouseMoved ? s.mouseY : window.innerHeight / 2,
            },
          },
          props
        )
        if (!props.ignoreOtherParticles) {
          this.particles.forEach((otherParticle, j) => {
            if (i !== j) {
              particle.acceleration.add(
                getGravVector(particle, otherParticle, {
                  minGrav: 0,
                  maxGrav: 0.01,
                })
              )
            }
          })
        }
      })
    }
  }

  initProps('swirl', {
    numTraceSteps: {
      type: 'number',
      default: 20,
      step: 1,
      min: 0,
    },
    traceResolution: {
      type: 'number',
      default: 1,
      step: 1,
      min: 1,
    },
    maxSpeed: {
      type: 'number',
      default: 9,
      step: 0.1,
      min: 0,
    },
    minGrav: {
      type: 'number',
      default: 0.1,
      step: 0.001,
      min: 0,
    },
    maxGrav: {
      type: 'number',
      default: 1.1,
      step: 0.001,
      min: 0,
    },
    mouseMass: {
      type: 'number',
      default: 500,
      step: 10,
      min: 0,
    },
  })

  const get = prop => getProp('swirl', prop)
  const set = (prop, value) => setProp('swirl', prop, value)

  const getProps = () => ({
    maxSpeed: Number(get('maxSpeed')),
    minGrav: Number(get('minGrav')),
    maxGrav: Number(get('maxGrav')),
    numTraceSteps: Number(get('numTraceSteps')),
    traceResolution: Number(get('traceResolution')),
    ignoreOtherParticles: true,
    mouseMass: Number(get('mouseMass')),
    dotMass: 1,
    renderDots: true,
    colorFn: (particle, historyPathIdx) => {
      const tweenBetween = (v1, v2) =>
        interpolate(
          [0, particle.pathHistory.length - 1],
          [v1, v2],
          historyPathIdx
        )
      return {
        r: tweenBetween(23, 228),
        g: tweenBetween(10, 242),
        b: tweenBetween(25, 240),
      }
    },
  })
  const particles = new ParticleSystem(getProps())

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    window.addEventListener('mousemove', function markMouseMoved() {
      hasMouseMoved = true
      window.removeEventListener('mousemove', markMouseMoved)
    })
  }

  s.draw = () => {
    s.clear()
    const props = getProps()
    particles.mutate(props)
    particles.draw(props)
  }
}
