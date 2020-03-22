import { init as initProps, getProp } from 'utils/propConfig'

export default s => {
  const get = prop => getProp('eye', prop)
  const getProps = () => ({
    lineLength: get('Line Length'),
    innerRadius: get('Inner Radius'),
    lineCount: get('Line Count'),
    circleSize: get('Circle Size'),
    pulseDelay: get('Pulse Delay'),
    pulseIntensity: get('Pulse Intensity'),
  })

  class Dot {
    constructor({ position, r }) {
      this.position = position
      this.r = r
    }

    draw({ pulseIntensity }, pulseProgress) {
      const { position, r } = this
      s.circle(
        position.x,
        position.y,

        r + pulseProgress * pulseIntensity

        // random mode
        // r + (Math.random() - 0.5) * randomness * 10
      )
    }
  }

  class EyeLine {
    constructor({ len, circleSize, theta, startingPosition }) {
      this.dots = []
      this.pulse = 0
      this.stopper = 0

      const xLen = Math.cos(theta) * len
      const yLen = Math.sin(theta) * len
      const n = Math.floor(len / circleSize)

      for (let i = 0; i < n; i++) {
        const progress = i / n
        this.dots.push(
          new Dot({
            position: {
              x: startingPosition.x + xLen * progress,
              y: startingPosition.y + yLen * progress,
            },
            r: circleSize,
          })
        )
      }
    }

    draw(props) {
      this.dots.forEach((dot, i) => {
        const distanceFromPulse =
          (this.dots.length + this.pulse - i) % this.dots.length
        const pulseProgress =
          (this.dots.length - Math.abs(distanceFromPulse)) / this.dots.length
        dot.draw(props, pulseProgress)
      })

      if (props.pulseDelay === 0) this.resetPulse()
      else if (++this.stopper > props.pulseDelay) {
        this.resetPulse()
      }
    }

    resetPulse() {
      this.stopper = 0
      if (++this.pulse >= this.dots.length) {
        this.pulse = 0
      }
    }
  }

  class Eye {
    constructor({ innerRadius, circleSize, lineCount, lineLength }) {
      const mid = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }
      this.eyeLines = []
      for (let i = 0; i < lineCount; i++) {
        const progress = i / lineCount
        const theta = Math.PI * 2 * progress
        this.eyeLines.push(
          new EyeLine({
            len: lineLength,
            theta,
            circleSize,
            startingPosition: {
              x: mid.x + Math.cos(theta) * innerRadius,
              y: mid.y + Math.sin(theta) * innerRadius,
            },
          })
        )
      }
    }

    mutate() {}

    draw(props) {
      this.eyeLines.forEach(eyeLine => eyeLine.draw(props))
    }
  }

  initProps('eye', {
    'Line Count': {
      type: 'number',
      default: 10,
      min: 1,
      onChange: initialize,
    },
    'Line Length': {
      type: 'number',
      default: 400,
      min: 15,
      onChange: initialize,
    },
    'Inner Radius': {
      type: 'number',
      default: 50,
      min: 0,
      onChange: initialize,
    },
    'Circle Size': {
      type: 'number',
      default: 10,
      min: 1,
      onChange: initialize,
    },
    'Pulse Delay': {
      type: 'number',
      default: 1,
      min: 0,
    },
    'Pulse Intensity': {
      type: 'number',
      default: 40,
      min: 0,
    },
  })

  let eye
  function initialize() {
    eye = new Eye(getProps())
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  s.draw = () => {
    s.clear()
    // s.noStroke()
    const props = getProps()
    eye.draw(props)
  }
}
