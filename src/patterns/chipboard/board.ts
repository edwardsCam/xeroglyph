import { interpolate, diff, randomInRange } from 'utils/math'
import { init as initProps, getProp } from 'utils/propConfig'
import pushpop from 'utils/pushpop'
import { rir, colorSchemes } from './common'
import Scribble from '../../p5.scribble'

type Props = {
  minBlankSpace: number
  randomness: number
  delay: number
  drawMode: 'fill' | 'empty' | 'grass' | 'trinkets'
  strokeWeight: number
  roughness: number
  density: number
  radius: number
}

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
    'Draw Mode': {
      type: 'dropdown',
      default: 'fill',
      options: ['fill', 'grass', 'empty' /*, 'trinkets'*/],
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
    Roughness: {
      type: 'number',
      default: 0.6,
      min: 0,
      step: 0.1,
    },
    Density: {
      type: 'number',
      default: 0.95,
      min: 0,
      max: 1,
      step: 0.05,
    },
    Radius: {
      type: 'number',
      default: 2,
      min: 0,
      step: 0.5,
      when: () => {
        const mode = get('Draw Mode')
        return mode === 'fill' || mode === 'empty'
      },
    },
  })
  const getProps = (): Props => ({
    minBlankSpace: get('Smallest Allowed Width'),
    randomness: get('Randomness'),
    delay: get('Paint Delay'),
    drawMode: get('Draw Mode'),
    strokeWeight: get('Stroke Weight'),
    roughness: get('Roughness'),
    density: get('Density'),
    radius: get('Radius'),
    ...colorSchemes.icelandSlate,
  })
  let isPaused = false
  let lastKnowns: [number, number, number, number][] = []
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
    if (props.strokeWeight > 0) {
      s.stroke(177, 94, 20, 0.5)
    } else {
      s.noStroke()
    }
    setTimeout(() => {
      createChipboard(0, 0, width, height, true)
    }, 0)
  }

  function createChipboard(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    initial: boolean = false
  ) {
    if (isPaused) {
      lastKnowns.push([minX, minY, maxX, maxY])
      return
    }
    const props = getProps()
    const dx = diff(minX, maxX)
    const dy = diff(minY, maxY)
    const skip =
      dx < props.minBlankSpace ||
      dy < props.minBlankSpace ||
      Math.random() > props.density

    s.strokeWeight(props.strokeWeight)

    scribble.roughness = props.roughness

    switch (props.drawMode) {
      case 'fill':
        {
          drawFill(minX, minY, maxX, maxY, skip, props.radius)
        }
        break
      case 'empty':
        {
          if (initial) {
            s.fill(178, 94, 66)
            s.rect(0, 0, width, height)
          }
          scribble.scribbleRect(minX, minY, maxX - minX, maxY - minY)
        }
        break
      case 'grass':
        {
          if (skip) {
            drawGrass(minX, minY, maxX, maxY)
          }
        }
        break
      case 'trinkets':
        {
          if (skip) {
            drawTrinket(minX, minY, maxX, maxY)
          }
        }
        break
    }

    const xSplit = rir(minX, maxX, props.randomness)
    const ySplit = rir(minY, maxY, props.randomness)

    const botLeft = () => createChipboard(minX, ySplit, xSplit, maxY)
    const botRight = () => createChipboard(xSplit, ySplit, maxX, maxY)
    const topRight = () => createChipboard(xSplit, minY, maxX, ySplit)
    const topLeft = () => createChipboard(minX, minY, xSplit, ySplit)
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

  function drawFill(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    skip: boolean,
    radius: number
  ) {
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
    pushpop(s, () => {
      s.noStroke()
      drawSquare(minX, minY, maxX, maxY, radius)
    })
    scribble.scribbleRect(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      maxX - minX,
      maxY - minY
    )
  }

  function drawGrass(minX: number, minY: number, maxX: number, maxY: number) {
    const hue = randomInRange(160, 180)
    s.stroke(hue, 100, 100)
    scribble.scribbleLine(minX, minY, maxX, maxY)
  }

  function drawTrinket(minX: number, minY: number, maxX: number, maxY: number) {
    const dx = maxX - minX
    const dy = maxY - minY
    const size = dx * dy
    const windowSize = Math.sqrt(width * height)
    const sml = windowSize / 3
    const med = (windowSize * 2) / 3
    if (size < sml) {
    } else if (size < med) {
    } else {
    }
    scribble.scribbleLine(minX, minY, maxX, maxY)
    scribble.scribbleLine(maxX, minY, minX, maxY)
  }
}
