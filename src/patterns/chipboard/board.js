import { interpolate, diff } from 'utils/math'
import { init as initProps, getProp } from 'utils/propConfig'
import { rir, colorSchemes } from './common'
import Scribble from '../../p5.scribble'

export default (s) => {
  const get = (prop) => getProp('chipboard', prop)
  initProps('chipboard', {
    draw: {
      type: 'func',
      label: 'Redraw!',
      callback: initialize,
    },
    minBlankSpace: {
      type: 'number',
      default: 4,
      min: 0.5,
      step: 0.5,
    },
    randomness: {
      type: 'number',
      default: 1,
      min: 0,
      max: 1,
      step: 0.025,
    },
    delay: {
      when: () => !get('interpolateDelay'),
      type: 'number',
      default: 1,
      min: -1,
      step: 1,
    },
    minDelay: {
      when: () => get('interpolateDelay'),
      type: 'number',
      default: 1,
      min: 0,
      step: 1,
    },
    maxDelay: {
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
    withStrokes: {
      type: 'boolean',
      default: true,
    },
    scribble: {
      type: 'boolean',
      when: () => get('withStrokes'),
      default: true,
    },
    pattern: {
      type: 'dropdown',
      default: 'square',
      options: ['square', 'triangle'],
    },
  })
  const getProps = () => ({
    minBlankSpace: get('minBlankSpace'),
    randomness: get('randomness'),
    pattern: get('pattern'),
    delay: get('delay'),
    minDelay: get('minDelay'),
    maxDelay: get('maxDelay'),
    interpolateDelay: get('interpolateDelay'),
    withStrokes: get('withStrokes'),
    scribble: get('scribble'),
    ...colorSchemes.icelandSlate,
  })
  let isPaused = false
  let lastKnowns = []
  let timeouts = []
  let scribble

  s.setup = () => {
    const canvas = document.getElementById('defaultCanvas0')
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && e.code === 'KeyS') {
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

    canvas.addEventListener('click', togglePause)
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()

    function togglePause() {
      isPaused = !isPaused
      if (!isPaused) {
        lastKnowns.forEach((lastKnown) => createChipboard(...lastKnown))
        lastKnowns = []
      }
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
    if (props.withStrokes) {
      s.stroke(0, 0, 0)
    } else {
      s.noStroke()
    }
    createChipboard(
      0,
      0,
      window.innerWidth,
      window.innerHeight,
      props.bg || 'white',
      'bl'
    )
  }

  function createChipboard(minX, minY, maxX, maxY, color, quad) {
    if (isPaused) {
      lastKnowns.push(arguments)
      return
    }
    const props = getProps()
    const dx = diff(minX, maxX)
    const dy = diff(minY, maxY)
    if (dx < props.minBlankSpace || dy < props.minBlankSpace) return

    s.fill(color)

    switch (props.pattern) {
      case 'square':
        if (props.scribble) {
          scribble.scribbleRect(minX, minY, maxX - minX, maxY - minY)

          s.stroke(color)
          // scribble.scribbleFilling([minX,maxX], [minY, maxY], 2, 0)
        } else {
          drawSquare(minX, minY, maxX, maxY, 0)
        }

        break
      case 'triangle':
        drawTriangle(minX, minY, maxX, maxY, quad)
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

  function drawSquare(x1, y1, x2, y2, radius = 0) {
    s.rect(x1, y1, x2 - x1, y2 - y1, radius, radius, radius, radius)
  }

  function drawTriangle(x1, y1, x2, y2, quad, withStretch) {
    const dx = x2 - x1
    const dy = y2 - y1
    const stretchX = withStretch ? dx / 10 : 0
    const stretchY = withStretch ? dy / 10 : 0
    if (quad === 'bl') {
      s.triangle(x1, y1, x2, y2, x1 + stretchX, y2 + stretchY)
    } else if (quad === 'br') {
      s.triangle(x1, y2, x2 + stretchX, y2 + stretchY, x2, y1)
    } else if (quad === 'tr') {
      s.triangle(x1, y1, x2 + stretchX, y1 + stretchY, x2, y2)
    } else if (quad === 'tl') {
      s.triangle(x1 + stretchX, y1 + stretchY, x2, y1, x1, y2)
    }
  }
}
