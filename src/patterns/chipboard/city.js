import { randomInRange, interpolate, diff } from 'utils/math'
import { init as initProps, getProp } from 'utils/propConfig'

const colorSchemes = {
  icelandSlate: {
    color1: 'rgba(236, 236, 236, 0.85)',
    color2: 'rgba(159, 211, 199, 0.85)',
    color3: 'rgba(56, 81, 112, 0.85)',
    color4: 'rgba(20, 45, 76, 0.85)',
  },
}

export default s => {
  let iterations = 0
  let isPaused = false
  let lastKnowns = []
  let timeouts = []
  let cubes = []

  const get = prop => getProp('city', prop)
  const getProps = () => ({
    minBlankSpace: get('minBlankSpace'),
    randomness: get('randomness'),
    delay: get('delay'),
    minDelay: get('minDelay'),
    maxDelay: get('maxDelay'),
    interpolateDelay: get('interpolateDelay'),

    // withStrokes: true,

    // governor: 90000,

    ...colorSchemes.icelandSlate,
  })
  initProps('city', {
    draw: {
      type: 'func',
      label: 'Redraw!',
      callback: () => initialize(getProps()),
    },
    minBlankSpace: {
      type: 'number',
      default: 9,
      min: 3,
      step: 0.2,
    },
    randomness: {
      type: 'number',
      default: 1,
      min: 0,
      max: 1,
      step: 0.05,
    },
    delay: {
      when: () => !get('interpolateDelay'),
      type: 'number',
      default: 100,
      min: 0,
      step: 1,
    },
    minDelay: {
      when: () => get('interpolateDelay'),
      type: 'number',
      default: 50,
      min: 0,
      step: 5,
    },
    maxDelay: {
      when: () => get('interpolateDelay'),
      type: 'number',
      default: 500,
      min: 0,
      step: 5,
    },
    interpolateDelay: {
      type: 'boolean',
      default: false,
    },
  })

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
        isPaused = !isPaused
        if (!isPaused) {
          lastKnowns.forEach(lastKnown => createChipboard(...lastKnown))
          lastKnowns = []
        }
      }
    })
    const props = getProps()
    if (!props.withStrokes) s.noStroke()
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
    initialize(props)
  }

  s.draw = () => {
    s.clear()
    s.rotateX(Math.sin(s.frameCount * 0.0025))
    s.rotateY(Math.cos(s.frameCount * 0.0025))
    cubes.forEach(drawCube)
  }

  function initialize(props) {
    timeouts.forEach(timeout => clearTimeout(timeout))
    timeouts = []
    lastKnowns = []
    cubes = []
    s.clear()
    createChipboard(
      -window.innerWidth / 5,
      -window.innerHeight / 5,
      window.innerWidth / 5,
      window.innerHeight / 5,
      200,
      props.bg || 'white',
      'bl'
    )
  }

  function createChipboard(minX, minY, maxX, maxY, maxZ, color, quad) {
    if (isPaused) {
      lastKnowns.push(arguments)
      return
    }
    const props = getProps()
    const dx = diff(minX, maxX)
    const dy = diff(minY, maxY)
    const { minBlankSpace } = props
    if (dx < minBlankSpace || dy < minBlankSpace) return

    const { randomness, color1, color2, color3, color4 } = props
    const xSplit = rir(minX, maxX, randomness)
    const ySplit = rir(minY, maxY, randomness)
    const zLimit = rir(0, maxZ, randomness)

    cubes.push({
      coords: [minX, minY, maxX, maxY, zLimit],
      color,
    })

    const botLeft = () =>
      createChipboard(minX, ySplit, xSplit, maxY, maxZ, color1, 'bl')
    const botRight = () =>
      createChipboard(xSplit, ySplit, maxX, maxY, maxZ, color2, 'br')
    const topRight = () =>
      createChipboard(xSplit, minY, maxX, ySplit, maxZ, color3, 'tr')
    const topLeft = () =>
      createChipboard(minX, minY, xSplit, ySplit, maxZ, color4, 'tl')
    iterations++

    if (props.governor == null || iterations < props.governor) {
      let delay = props.delay || 0
      if (props.interpolateDelay) {
        delay = interpolate(
          [minBlankSpace, window.innerWidth * window.innerHeight],
          [props.minDelay, props.maxDelay],
          dx * dy
        )
      }
      timeouts.push(
        setTimeout(() => {
          botLeft()
          botRight()
          topRight()
          topLeft()
        }, delay)
      )
    }
  }

  function drawCube({ color, coords }) {
    const [x1, y1, x2, y2, z] = coords
    const dx = x2 - x1
    const dy = y2 - y1
    s.push()
    // s.fill(color)
    s.translate((x1 + x2) / 2, (y1 + y2) / 2, z / 2)
    s.box(dx, dy, z)
    s.pop()
  }
}

function rir(min, max, randomness) {
  const middle = (min + max) / 2
  return randomInRange(
    interpolate([0, 1], [middle, min], randomness),
    interpolate([0, 1], [middle, max], randomness)
  )
}
