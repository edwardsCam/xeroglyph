import { randomInRange } from 'utils/math'
import times from 'utils/times'
import { init as initProps, getProp } from 'utils/propConfig'
import Scribble from '../../p5.scribble'

type Props = {
  width: number
  subdivs: number
  subdivDelta: number
  roughness: number
  strokeWeight: number
}

export default (s) => {
  initProps('bamboo', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    Width: {
      type: 'number',
      default: 20,
      min: 1,
    },
    Subdivisions: {
      type: 'number',
      default: 1,
      min: 1,
    },
    'Subdivision Delta': {
      type: 'number',
      min: 0,
      default: 5,
    },
    Roughness: {
      type: 'number',
      min: 0,
      step: 0.1,
      default: 0.7,
    },
    'Stroke Weight': {
      type: 'number',
      default: 1,
      min: 0,
      step: 0.05,
    },
  })
  const get = (prop: string) => getProp('bamboo', prop)
  const getProps = (): Props => ({
    width: get('Width'),
    subdivs: get('Subdivisions'),
    subdivDelta: get('Subdivision Delta'),
    roughness: get('Roughness'),
    strokeWeight: get('Stroke Weight'),
  })
  let scribble: Scribble
  let last: Props | undefined
  let timeouts: NodeJS.Timeout[] = []

  function initialize() {
    s.clear()
    last = undefined
    clearTimeouts()
  }

  function clearTimeouts() {
    timeouts.forEach(clearTimeout)
    timeouts = []
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.colorMode(s.HSB)
    initialize()
  }

  s.draw = () => {
    const props = getProps()
    if (last && Object.keys(last).every((prop) => last[prop] === props[prop]))
      return

    clearTimeouts()
    const { roughness } = props
    if (roughness > 0) {
      scribble = new Scribble(s)
      scribble.roughness = roughness
    }

    fillArea(0, 0, window.innerWidth, window.innerHeight)

    last = props
  }

  function fillArea(
    x: number,
    y: number,
    areaWidth: number,
    areaHeight: number
  ) {
    const { width, subdivs, subdivDelta, strokeWeight } = getProps()
    const cols = Math.ceil(areaWidth / width)
    times(cols, (i) => {
      const subdivsWithDelta = subdivs + randomInRange(0, subdivDelta + 1, true)
      timeouts.push(
        setTimeout(() => {
          drawSubdivision(
            x + i * width,
            y,
            width,
            areaHeight,
            subdivsWithDelta,
            strokeWeight
          )
        })
      )
    })
  }

  function drawSubdivision(
    x: number,
    y: number,
    width: number,
    height: number,
    n: number,
    weight: number
  ) {
    const maxY = y + height
    const yPoints = times(n - 1, () => randomInRange(y, maxY)).sort(
      (a, b) => a - b
    )

    const points = [...yPoints, maxY]
    points.forEach((p, i) => {
      const prev = yPoints[i - 1] || 0
      const subdivHeight = p - prev
      drawPiece(x, prev, width, subdivHeight, weight, maxY)
    })
  }

  function drawPiece(
    x: number,
    y: number,
    width: number,
    height: number,
    weight: number,
    maxY: number
  ) {
    const x2 = x + width
    const y2 = y + height
    s.fill(
      36 + randomInRange(-3, 3, true),
      56 + randomInRange(-6, 6, true),
      74 + randomInRange(-6, 6, true)
    )
    const rectArgs = [x, y, width, height]

    s.strokeWeight(weight)
    s.stroke(
      66 + randomInRange(-5, 5, true),
      100 - randomInRange(0, 5, true),
      randomInRange(0, 20, true)
    )
    s.push()
    s.noStroke()
    s.rect(...rectArgs)
    s.pop()
    if (scribble) {
      scribble.scribbleLine(x, y, x, y2)
      scribble.scribbleLine(x2, y, x2, y2)
      if (y2 !== maxY) {
        scribble.scribbleLine(x, y2, x2, y2)
      }
    }
  }
}
