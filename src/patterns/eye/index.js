import { init as initProps, getProp } from 'utils/propConfig'

export default s => {
  const get = prop => getProp('eye', prop)
  const getProps = () => ({
    lineLength: get('Line Length'),
    innerRadius: get('Inner Radius'),
    lineCount: get('Line Count'),
    randomness: get('Randomness'),
  })

  class Dot {
    constructor({ position, r }) {
      this.position = position
      this.r = r
    }

    draw({ randomness }) {
      const { position, r } = this
      s.circle(
        position.x,
        position.y,
        r + (Math.random() - 0.5) * randomness * 10
      )
    }
  }

  class EyeLine {
    constructor({ len, circleRadius, theta, startingPosition }) {
      this.dots = []

      const xLen = Math.cos(theta) * len
      const yLen = Math.sin(theta) * len
      const n = Math.floor(len / circleRadius)

      for (let i = 0; i < n; i++) {
        const progress = i / n
        this.dots.push(
          new Dot({
            position: {
              x: startingPosition.x + xLen * progress,
              y: startingPosition.y + yLen * progress,
            },
            r: circleRadius,
          })
        )
      }
    }

    draw(props) {
      this.dots.forEach(dot => dot.draw(props))
    }
  }

  class Eye {
    constructor({ innerRadius, lineCount, lineLength }) {
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
            circleRadius: 10,
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
      default: 8,
      min: 1,
      onChange: initialize,
    },
    'Line Length': {
      type: 'number',
      default: 200,
      min: 15,
      onChange: initialize,
    },
    'Inner Radius': {
      type: 'number',
      default: 20,
      min: 0,
      onChange: initialize,
    },
    Randomness: {
      type: 'number',
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.1,
      onChange: initialize,
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
    eye.draw(props)
  }
}
