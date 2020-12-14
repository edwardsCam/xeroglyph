import { interpolate, interpolateSmooth } from 'utils/math.ts'
import { init as initProps, getProp } from 'utils/propConfig.ts'

export default (s) => {
  const get = (prop) => getProp('checkers', prop)
  const getProps = () => ({
    n: get('n'),
    minRatio: 0.1,
    maxRatio: 10,
  })

  class Checkers {
    // constructor(props) {}

    draw({ n, minRatio, maxRatio }) {
      const yPoses = []
      const xPoses = []
      const xRatios = []
      const yRatios = []

      const yDropzone = interpolate([0, window.innerHeight], [0, n], s.mouseY)
      const xDropzone = interpolate([0, window.innerWidth], [0, n], s.mouseX)
      for (let i = 0; i < n; i++) {
        const domain = [0, n]
        yRatios.push(
          interpolateSmooth(
            domain,
            [maxRatio, minRatio],
            Math.abs(yDropzone - i)
          )
        )
        xRatios.push(
          interpolateSmooth(
            domain,
            [maxRatio, minRatio],
            Math.abs(xDropzone - i)
          )
        )
      }

      const ySum = yRatios.reduce((result, val) => result + val, 0)
      const xSum = xRatios.reduce((result, val) => result + val, 0)

      for (let i = 0; i < n; i++) {
        const yRatio = yRatios[i] / ySum
        const yDiff = yRatio * window.innerHeight
        yPoses.push(i === 0 ? yDiff : yPoses[i - 1] + yDiff)

        const xRatio = xRatios[i] / xSum
        const xDiff = xRatio * window.innerWidth
        xPoses.push(i === 0 ? xDiff : xPoses[i - 1] + xDiff)
      }

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          s.fill(
            interpolate([0, n - 1], [0, 128], r),
            interpolate([0, n - 1], [0, 255], c),
            200
          )
          s.rect(
            r === 0 ? 0 : xPoses[r - 1],
            c === 0 ? 0 : yPoses[c - 1],
            xPoses[r],
            yPoses[c]
          )
        }
      }
    }
  }

  initProps('checkers', {
    n: {
      type: 'number',
      default: 3,
      min: 2,
    },
  })

  let checkers
  function initialize() {
    checkers = new Checkers()
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  s.draw = () => {
    s.clear()
    const props = getProps()
    checkers.draw(props)
  }
}
