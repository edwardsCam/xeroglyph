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
      default: 25,
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
      default: 4,
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
      step: 0.1,
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
    const { width, subdivs, subdivDelta, roughness, strokeWeight } = props
    if (roughness > 0) {
      scribble = new Scribble(s)
      scribble.roughness = roughness
    }

    const cols = Math.ceil(window.innerWidth / width)
    times(cols, (i) => {
      const subdivsWithDelta = subdivs + randomInRange(0, subdivDelta + 1, true)
      timeouts.push(
        setTimeout(() =>
          drawSubdivision(i * width, width, subdivsWithDelta, strokeWeight)
        )
      )
    })

    last = props
  }

  function drawSubdivision(
    x: number,
    width: number,
    n: number,
    weight: number
  ) {
    const yPoints = times(n - 1, () =>
      randomInRange(0, window.innerHeight)
    ).sort((a, b) => a - b)
    ;[...yPoints, window.innerHeight].forEach((p, i) => {
      const prev = yPoints[i - 1] || 0
      drawPiece(prev, p, x, width, weight)
    })
  }

  function drawPiece(
    y1: number,
    y2: number,
    x1: number,
    width: number,
    weight: number
  ) {
    const x2 = x1 + width
    const height = y2 - y1
    const hVar = randomInRange(-4, 4, true)
    const sVar = randomInRange(-7, 7, true)
    const bVar = randomInRange(-7, 7, true)
    s.fill(36 + hVar, 56 + sVar, 74 + bVar)
    const rectArgs = [x1, y1, width, height]

    s.strokeWeight(weight)
    s.push()
    s.noStroke()
    s.rect(...rectArgs)
    s.pop()
    if (scribble) {
      scribble.scribbleLine(x1, y1, x1, y2)
      scribble.scribbleLine(x2, y1, x2, y2)
      if (y2 !== window.innerHeight) {
        scribble.scribbleLine(x1, y2, x2, y2)
      }
    }
  }
}
