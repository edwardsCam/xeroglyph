import { interpolate, diff } from 'utils/math.ts'
import { init as initProps, getProp } from 'utils/propConfig.ts'
import { rir, colorSchemes } from './common'

export default (s) => {
  let isPaused = false
  let lastKnowns: [number, number, number, number, number, string][] = []
  let timeouts: NodeJS.Timeout[] = []
  let cubes: {
    coords: [number, number, number, number, number]
    color: string
  }[] = []

  const get = (prop) => getProp('city', prop)
  const getProps = () => ({
    minBlankSpace: get('minBlankSpace'),
    randomness: get('randomness'),
    delay: get('delay'),
    minDelay: get('minDelay'),
    maxDelay: get('maxDelay'),
    interpolateDelay: get('interpolateDelay'),
    withStrokes: true,
    ...colorSchemes.icelandSlate,
  })
  initProps('city', {
    draw: {
      type: 'func',
      label: 'Redraw!',
      callback: initialize,
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
    const canvas = document.getElementById(
      'defaultCanvas0'
    ) as HTMLCanvasElement
    window.addEventListener('keydown', (e) => {
      if (canvas && e.ctrlKey && e.altKey && e.key === 's') {
        canvas.toBlob((blob) => {
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
          lastKnowns.forEach((lastKnown) => createChipboard(...lastKnown))
          lastKnowns = []
        }
      }
    })
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
    initialize()
  }

  s.draw = () => {
    s.clear()
    s.rotateX(Math.sin(s.frameCount * 0.0025))
    s.rotateY(Math.cos(s.frameCount * 0.0025))
    s.lights()
    cubes.forEach(drawCube)
  }

  function initialize() {
    const props = getProps()
    timeouts.forEach((timeout) => clearTimeout(timeout))
    timeouts = []
    lastKnowns = []
    cubes = []
    s.clear()
    if (props.withStrokes) {
      s.stroke(0, 0, 0)
    } else {
      s.noStroke()
    }
    createChipboard(
      -window.innerWidth / 5,
      -window.innerHeight / 5,
      window.innerWidth / 5,
      window.innerHeight / 5,
      200,
      props.bg || 'white'
    )
  }

  function createChipboard(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    maxZ: number,
    color: string
  ) {
    if (isPaused) {
      lastKnowns.push([minX, minY, maxX, maxY, maxZ, color])
      return
    }
    const props = getProps()
    const dx = diff(minX, maxX)
    const dy = diff(minY, maxY)
    if (dx < props.minBlankSpace || dy < props.minBlankSpace) return

    const { randomness, color1, color2, color3, color4 } = props
    const xSplit = rir(minX, maxX, randomness)
    const ySplit = rir(minY, maxY, randomness)
    const zLimit = rir(0, maxZ, randomness)

    cubes.push({
      coords: [minX, minY, maxX, maxY, zLimit],
      color,
    })

    const botLeft = () =>
      createChipboard(minX, ySplit, xSplit, maxY, maxZ, color1)
    const botRight = () =>
      createChipboard(xSplit, ySplit, maxX, maxY, maxZ, color2)
    const topRight = () =>
      createChipboard(xSplit, minY, maxX, ySplit, maxZ, color3)
    const topLeft = () =>
      createChipboard(minX, minY, xSplit, ySplit, maxZ, color4)
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
    timeouts.push(setTimeout(doWork, delay))
  }

  function drawCube({ /* color, */ coords }) {
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
