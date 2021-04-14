import { interpolate, diff, randomInRange } from 'utils/math'
import { init as initProps, getProp } from 'utils/propConfig'
import { rir, colorSchemes } from './common'
import Scribble from '../../p5.scribble'

type Quad = 'tl' | 'tr' | 'br' | 'bl'

export default (s) => {
  const get = (prop: string) => getProp('chipboard', prop)
  initProps('chipboard', {
    draw: {
      type: 'func',
      label: 'Redraw!',
      callback: initialize,
    },
    pause: {
      type: 'func',
      label: 'Pause',
      callback: togglePause,
    },
    'Smallest Allowed Width': {
      type: 'number',
      default: 7,
      min: 0.5,
      step: 0.5,
    },
    Randomness: {
      type: 'number',
      default: 1,
      min: 0,
      max: 1,
      step: 0.025,
    },
    'Paint Delay': {
      type: 'number',
      default: 0,
      min: -1,
      step: 1,
    },
    'Stroke Weight': {
      type: 'number',
      default: 0.2,
      min: 0,
      step: 0.1,
    },
    'With Fill': {
      type: 'boolean',
      default: true,
    },
    Roughness: {
      type: 'number',
      default: 10,
      min: 0,
      step: 0.1,
    },
    // Shape: {
    //   type: 'dropdown',
    //   default: 'square',
    //   options: ['square', 'triangle'],
    // },
    Density: {
      type: 'number',
      default: 0.95,
      min: 0,
      max: 1,
      step: 0.05,
    },
  })
  const getProps = () => ({
    minBlankSpace: get('Smallest Allowed Width'),
    randomness: get('Randomness'),
    pattern: 'square', //get('Shape'),
    delay: get('Paint Delay'),
    minDelay: get('Fastest Paint'),
    maxDelay: get('Slowest Paint'),
    withFill: get('With Fill'),
    strokeWeight: get('Stroke Weight'),
    roughness: get('Roughness'),
    density: get('Density'),
    ...colorSchemes.icelandSlate,
  })
  let isPaused = false
  let lastKnowns: [number, number, number, number, Quad][] = []
  let timeouts: NodeJS.Timeout[] = []
  let scribble

  let width = window.innerWidth
  let height = window.innerHeight

  s.setup = () => {
    s.createCanvas(width, height)
    s.colorMode(s.HSB)
    initialize()
  }

  function togglePause() {
    isPaused = !isPaused
    if (!isPaused) {
      lastKnowns.forEach((lastKnown) => createChipboard(...lastKnown))
      lastKnowns = []
    }
  }

  s.draw = Function.prototype

  function initialize() {
    s.clear()
    const props = getProps()

    timeouts.forEach((timeout) => clearTimeout(timeout))
    timeouts = []
    lastKnowns = []
    isPaused = false
    scribble = new Scribble(s)
    s.fill(178, 94, 66)
    s.rect(0, 0, width, height)
    if (props.strokeWeight > 0) {
      s.stroke(177, 94, 20, 0.5)
    } else {
      s.noStroke()
    }
    setTimeout(() => {
      createChipboard(0, 0, width, height, 'bl')
    }, 0)
  }

  function createChipboard(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    quad: Quad
  ) {
    if (isPaused) {
      lastKnowns.push([minX, minY, maxX, maxY, quad])
      return
    }
    const props = getProps()
    const dx = diff(minX, maxX)
    const dy = diff(minY, maxY)
    const skip =
      dx < props.minBlankSpace ||
      dy < props.minBlankSpace ||
      Math.random() > props.density

    if (skip) {
      const hue =
        randomInRange(315, 328) + interpolate([0, width], [13, -13], minX)
      const sat =
        randomInRange(85, 93) + interpolate([0, height], [-9, 9], minY)
      const bri = randomInRange(76, 84)
      s.fill(hue, sat, bri)
    } else {
      const hue = randomInRange(174, 180)
      s.fill(hue, 94, 66)
    }
    s.strokeWeight(props.strokeWeight)

    scribble.roughness =
      interpolate([0, width * height], [0, props.roughness], dx * dy) * 10

    switch (props.pattern) {
      case 'square':
        if (props.withFill) {
          s.push()
          s.noStroke()
          drawSquare(minX, minY, maxX, maxY, 0)
          s.pop()
          scribble.scribbleRect(
            (minX + maxX) / 2,
            (minY + maxY) / 2,
            maxX - minX,
            maxY - minY
          )
        } else {
          scribble.scribbleRect(minX, minY, maxX - minX, maxY - minY)
        }

        break
      case 'triangle':
        drawTriangle(minX, minY, maxX, maxY, quad, props.withFill)
        break
    }

    const xSplit = rir(minX, maxX, props.randomness)
    const ySplit = rir(minY, maxY, props.randomness)

    const botLeft = () =>
      createChipboard(minX, ySplit, xSplit, maxY, props.color1, 'bl')
    const botRight = () =>
      createChipboard(xSplit, ySplit, maxX, maxY, props.color2, 'br')
    const topRight = () =>
      createChipboard(xSplit, minY, maxX, ySplit, props.color3, 'tr')
    const topLeft = () =>
      createChipboard(minX, minY, xSplit, ySplit, props.color4, 'tl')
    const doWork = () => {
      if (skip) {
        return
      }
      botLeft()
      botRight()
      topRight()
      topLeft()
    }

    const delay = props.delay || 0
    if (delay >= 0) {
      timeouts.push(setTimeout(doWork, delay))
    } else {
      doWork()
    }
  }

  function drawSquare(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    radius: number = 0
  ) {
    s.rect(x1, y1, x2 - x1, y2 - y1, radius, radius, radius, radius)
  }

  function drawTriangle(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    quad: Quad,
    withFill?: boolean
  ) {
    const drawFn = withFill
      ? (...args) => s.triangle(...args)
      : (
          _x1: number,
          _y1: number,
          _x2: number,
          _y2: number,
          _x3: number,
          _y3: number
        ) => {
          scribble.scribbleLine(_x1, _y1, _x2, _y2)
          scribble.scribbleLine(_x2, _y2, _x3, _y3)
          scribble.scribbleLine(_x3, _y3, _x1, _y1)
        }
    if (quad === 'bl') {
      drawFn(x1, y1, x2, y2, x1, y2)
    } else if (quad === 'br') {
      drawFn(x1, y2, x2, y2, x2, y1)
    } else if (quad === 'tr') {
      drawFn(x1, y1, x2, y1, x2, y2)
    } else if (quad === 'tl') {
      drawFn(x1, y1, x2, y1, x1, y2)
    }
  }
}
