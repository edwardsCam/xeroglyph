import { init as initProps } from 'utils/propConfig'
import arrowSquare from './arrow-square'

export default (s) => {
  initProps('trinkets', {})

  let pattern
  function initialize() {
    pattern = arrowSquare(s)
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  let padding = 0.1

  s.draw = () => {
    s.clear()

    const n = 1
    const height = 300
    pattern.draw({
      color: [255, 255, 255],
      height: n * height,
      padding: padding * height,
      start: {
        x: 100,
        y: 100,
      },
      flipped: false,
    })

    pattern.draw({
      color: [255, 255, 255],
      height: n * height,
      padding: padding * height,
      start: {
        x: 500,
        y: 100,
      },
      flipped: true,
    })
  }
}
