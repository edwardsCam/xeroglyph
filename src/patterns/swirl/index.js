import { thetaFromTwoPoints, distance, clamp, interpolate } from 'utils/math.ts'
import { init as initProps, getProp } from 'utils/propConfig.ts'
import Scribble from '../../p5.scribble'

function calculateGravBetweenTwoBodies(p1, p2, { minGrav, maxGrav }) {
  const d = distance(p1.position, p2.position)
  const massConstant = p1.mass * p2.mass
  return {
    theta: thetaFromTwoPoints(p1.position, p2.position),
    strength: clamp(minGrav, maxGrav, massConstant / (d * d)),
  }
}

export default (s) => {
  let hasMouseMoved = false
  const scribble = new Scribble(s)

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
      this.velocity = s.createVector(0, 1.5)
      this.acceleration = s.createVector(0, 0)
      this.pathHistory = []
      this.mass = mass
      this.traceSteps = 0
    }

    move(props) {
      if (++this.traceSteps > props.traceDelay) {
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
      if (props.renderDots && !props.scribble) {
        s.stroke(0, 0, 0)
        const ellipseArgs = [this.position.x, this.position.y, 10, 10]
        props.scribble
          ? scribble.scribbleEllipse(...ellipseArgs)
          : s.ellipse(...ellipseArgs)
      }
      for (let i = 1; i < this.pathHistory.length; i++) {
        const { r, g, b } = props.colorFn(this, i)
        s.stroke(r, g, b)

        const p1 = this.pathHistory[i - 1]
        const p2 = this.pathHistory[i]
        const lineArgs = [p1.x, p1.y, p2.x, p2.y]
        props.scribble
          ? scribble.scribbleLine(...lineArgs)
          : s.line(...lineArgs)
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
      this.particles.forEach((particle) => {
        particle.move(props)
      })
    }

    draw(props) {
      scribble.roughness = props.roughness
      this.particles.forEach((particle) => {
        particle.draw(props)
      })
    }

    calculateGravitationalPulls(props) {
      this.particles.forEach((particle, i) => {
        particle.calculateGravToMouse(
          {
            mass: props.mouseMass,
            position: {
              x:
                !props.disableMouse && hasMouseMoved
                  ? s.mouseX
                  : window.innerWidth / 2,
              y:
                !props.disableMouse && hasMouseMoved
                  ? s.mouseY
                  : window.innerHeight / 2,
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
      default: 4,
      step: 1,
      min: 0,
    },
    traceDelay: {
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
      default: 0.12,
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
    dotMass: {
      type: 'number',
      default: 1,
      step: 1,
      min: 0,
    },
    renderDots: {
      type: 'boolean',
      default: true,
    },
    ignoreOtherParticles: {
      type: 'boolean',
      default: true,
    },
    disableMouse: {
      type: 'boolean',
      default: false,
    },
    scribble: {
      type: 'boolean',
      default: true,
    },
    Roughness: {
      type: 'number',
      default: 5,
      min: 0,
      max: 10,
      step: 0.2,
      when: () => get('scribble'),
    },
  })

  const get = (prop) => getProp('swirl', prop)

  const getProps = () => ({
    maxSpeed: get('maxSpeed'),
    minGrav: get('minGrav'),
    maxGrav: get('maxGrav'),
    numTraceSteps: get('numTraceSteps'),
    traceDelay: get('traceDelay'),
    ignoreOtherParticles: get('ignoreOtherParticles'),
    mouseMass: get('mouseMass'),
    dotMass: get('dotMass'),
    renderDots: get('renderDots'),
    disableMouse: get('disableMouse'),
    scribble: get('scribble'),
    roughness: get('Roughness'),
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
