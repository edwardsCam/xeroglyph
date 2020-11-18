import { interpolate, diff } from 'utils/math.ts'
import { init as initProps, getProp } from 'utils/propConfig.ts'
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
      default: 12,
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
      when: () => !get('interpolateDelay'),
      type: 'number',
      default: 1,
      min: -1,
      step: 1,
    },
    'Fastest Paint': {
      when: () => get('interpolateDelay'),
      type: 'number',
      default: 1,
      min: 0,
      step: 1,
    },
    'Slowest Paint': {
      when: () => get('interpolateDelay'),
      type: 'number',
      default: 700,
      min: 0,
      step: 1,
    },
    interpolateDelay: {
      type: 'boolean',
      default: true,
    },
    'Stroke Weight': {
      type: 'number',
      default: 0.6,
      min: 0,
      step: 0.2,
    },
    'Sketchy?': {
      type: 'boolean',
      default: true,
    },
    Roughness: {
      type: 'number',
      default: 1,
      min: 0,
      max: 5,
      step: 0.1,
      when: () => get('Sketchy?'),
    },
    Shape: {
      type: 'dropdown',
      default: 'square',
      options: ['square', 'triangle'],
    },
  })
  const getProps = () => ({
    minBlankSpace: get('Smallest Allowed Width'),
    randomness: get('Randomness'),
    pattern: get('Shape'),
    delay: get('Paint Delay'),
    minDelay: get('Fastest Paint'),
    maxDelay: get('Slowest Paint'),
    interpolateDelay: get('interpolateDelay'),
    scribble: get('Sketchy?'),
    strokeWeight: get('Stroke Weight'),
    roughness: get('Roughness'),
    ...colorSchemes.icelandSlate,
  })
  let isPaused = false
  let lastKnowns: [number, number, number, number, string, Quad][] = []
  let timeouts: NodeJS.Timeout[] = []
  let scribble

  s.setup = () => {
    const canvas = document.getElementById(
      'defaultCanvas0'
    ) as HTMLCanvasElement
    window.addEventListener('keydown', (e) => {
      if (canvas && e.ctrlKey && e.altKey && e.code === 'KeyS') {
        canvas.toBlob((blob) => {
          const downloadLink = document.createElement('a')
          downloadLink.href = URL.createObjectURL(blob)
          downloadLink.download = 'chipboard.png'
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
        })
      } else if (e.code === 'Space') {
        togglePause()
      }
    })

    // canvas.addEventListener('click', togglePause)
    s.createCanvas(window.innerWidth, window.innerHeight)
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
      s.stroke(0, 0, 0)
    } else {
      s.noStroke()
    }
    createChipboard(
      0,
      0,
      window.innerWidth,
      window.innerHeight,
      // @ts-ignore
      props.bg || 'white',
      'bl'
    )
  }

  function createChipboard(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    color: string,
    quad: Quad
  ) {
    if (isPaused) {
      lastKnowns.push([minX, minY, maxX, maxY, color, quad])
      return
    }
    const props = getProps()
    const dx = diff(minX, maxX)
    const dy = diff(minY, maxY)
    if (dx < props.minBlankSpace || dy < props.minBlankSpace) return

    s.fill(color)
    s.strokeWeight(props.strokeWeight)

    scribble.roughness = props.roughness

    switch (props.pattern) {
      case 'square':
        if (props.scribble) {
          if (color != 'white') {
            s.stroke(color)
          }
          scribble.scribbleRect(minX, minY, maxX - minX, maxY - minY)
        } else {
          drawSquare(minX, minY, maxX, maxY, 0)
        }

        break
      case 'triangle':
        if (color != 'white') {
          s.stroke(color)
        }
        drawTriangle(minX, minY, maxX, maxY, quad, props.scribble)
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
      botLeft()
      botRight()
      topRight()
      topLeft()
    }

    const delay = props.interpolateDelay
      ? interpolate(
          [props.minBlankSpace, window.innerWidth * window.innerHeight],
          [props.minDelay, props.maxDelay],
          dx * dy
        )
      : props.delay || 0
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
    withScribble?: boolean
  ) {
    const drawFn = withScribble
      ? (
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
      : s.triangle
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
