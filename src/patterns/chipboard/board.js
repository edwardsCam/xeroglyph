import { randomInRange, interpolate, diff } from 'utils/math'
import { init as initProps, getProp, setProp } from 'utils/propConfig'

const colorSchemes = {
  icelandSlate: {
    color1: 'rgba(236, 236, 236, 0.85)',
    color2: 'rgba(159, 211, 199, 0.85)',
    color3: 'rgba(56, 81, 112, 0.85)',
    color4: 'rgba(20, 45, 76, 0.85)',
  },
  duskyForest: {
    color1: '#587850',
    color2: '#709078',
    color3: '#78b0a0',
    color4: '#f8d0b0',
  },
  greySlate: {
    color1: '#e9e9e5',
    color2: '#d4d6c8',
    color3: '#9a9b94',
    color4: '#52524e',
  },
  blackVelvet: {
    color1: '#252525',
    color2: '#ff0000',
    color3: '#af0404',
    color4: '#414141',
    bg: '#9a9b94',
  },
}

export default s => {
  const get = prop => getProp('chipboard', prop)
  initProps('chipboard', {
    draw: {
      type: 'func',
      label: 'Redraw!',
      callback: () => {
        draw(getProps())
      },
    },
    minBlankSpace: {
      type: 'number',
      default: 1.5,
      min: 0.1,
      step: 0.1,
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
      default: 500,
      min: 0,
      step: 1,
    },
    interpolateDelay: {
      type: 'boolean',
      default: true,
    },
    withStrokes: {
      type: 'boolean',
      default: false,
    },
    // governor: {
    //   type: 'number',
    //   default: 999999,
    //   min: 0,
    //   step: 1,
    // },
  })
  const getProps = () => ({
    minBlankSpace: get('minBlankSpace'),
    randomness: get('randomness'),
    type: 'chip',
    delay: get('delay'),
    minDelay: get('minDelay'),
    maxDelay: get('maxDelay'),
    interpolateDelay: get('interpolateDelay'),
    withStrokes: get('withStrokes'),
    // governor: get('governor'),
    ...colorSchemes.icelandSlate,
  })
  let isPaused = false
  let lastKnowns = []
  let timeouts = []
  let iterations = 0

  s.setup = () => {
    const canvas = document.getElementById('defaultCanvas0')
    window.addEventListener('keydown', e => {
      if (e.ctrlKey && e.altKey && e.key === 's') {
        canvas.toBlob(blob => {
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

    const props = getProps()
    s.createCanvas(window.innerWidth, window.innerHeight)
    draw(props)

    function togglePause() {
      isPaused = !isPaused
      if (!isPaused) {
        lastKnowns.forEach(lastKnown => createChipboard(...lastKnown))
        lastKnowns = []
      }
    }
  }

  s.draw = () => {}

  function draw(props) {
    timeouts.forEach(timeout => clearTimeout(timeout))
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

    switch (props.type) {
      case 'chip':
        drawSquare(minX, minY, maxX, maxY, 0)
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
    iterations++

    if (props.governor == null || iterations < props.governor) {
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

function rir(min, max, randomness) {
  const middle = (min + max) / 2
  return randomInRange(
    interpolate([0, 1], [middle, min], randomness),
    interpolate([0, 1], [middle, max], randomness)
  )
}
