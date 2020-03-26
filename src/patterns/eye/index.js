import { init as initProps, getProp /* setProp */ } from 'utils/propConfig'

export default (s) => {
  const get = (prop) => getProp('eye', prop)
  const getProps = () => ({
    lineLength: get('Line Length'),
    innerRadius: get('Inner Radius'),
    lineCount: get('Line Count'),
    circleSize: get('Circle Size'),
    pulseDelay: get('Pulse Delay'),
    pulseIntensity: get('Pulse Intensity'),
    showStrokes: get('Show Strokes?'),
    pulseInward: get('Pulse Inward?'),
  })

  class Dot {
    constructor(position) {
      this.position = position
    }

    draw({ pulseIntensity, circleSize }, pulseProgress) {
      const { position } = this
      s.circle(
        position.x,
        position.y,
        circleSize + pulseProgress * pulseIntensity

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
            x: startingPosition.x + xLen * progress,
            y: startingPosition.y + yLen * progress,
          })
        )
      }
    }

    draw(props) {
      const dots = props.pulseInward ? [...this.dots].reverse() : this.dots
      const { length } = dots
      dots.forEach((dot, i) => {
        const distanceFromPulse = (length + this.pulse - i) % length
        const pulseProgress = (length - distanceFromPulse) / length
        dot.draw(props, pulseProgress)
      })

      if (props.pulseDelay === 0 || ++this.stopper > props.pulseDelay) {
        this.stopper = 0
        if (++this.pulse >= length) {
          this.pulse = 0
          // return true
        }
      }
    }
  }

  class Eye {
    constructor({ innerRadius, circleSize, lineCount, lineLength }) {
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
              x: window.innerWidth / 2 + Math.cos(theta) * innerRadius,
              y: window.innerHeight / 2 + Math.sin(theta) * innerRadius,
            },
          })
        )
      }
    }

    draw(props) {
      // let finishedPulse = false
      this.eyeLines.forEach((eyeLine) => {
        eyeLine.draw(props)
        // const didFinish = eyeLine.draw(props)
        // if (!finishedPulse && didFinish) {
        //   finishedPulse = true
        //   setProp('eye', 'Line Count', props.lineCount + 1)
        //   initialize()
        // }
      })
    }
  }

  initProps('eye', {
    'Line Count': {
      type: 'number',
      default: 8,
      min: 1,
      onChange: initialize,
    },
    'Line Length': {
      type: 'number',
      default: 300,
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
      default: 8,
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
      default: 50,
      min: 0,
    },
    'Show Strokes?': {
      type: 'boolean',
      default: true,
    },
    'Pulse Inward?': {
      type: 'boolean',
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
    const props = getProps()
    if (props.showStrokes) s.stroke(0, 0, 0)
    else s.noStroke()
    eye.draw(props)
  }
}
