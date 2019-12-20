import {
  randomInRange,
  interpolate,
  diff,
} from 'utils/math'

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
    bg: '#9a9b94'
  },
}

window.addEventListener('keydown', e => {
  if (e.ctrlKey && e.altKey) {
    if (e.keyCode === 83) {
      const canvas = document.getElementById('defaultCanvas0')
      if (canvas) {
        canvas.toBlob(blob => {
          const downloadLink = document.createElement('a')
          downloadLink.href = URL.createObjectURL(blob)
          downloadLink.download = 'chipboard.png'
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
        })
      }
    }
  }
})

export default s => {
  const props = {
    minBlankSpace: 4,
    randomness: 1,

    // delay: 100,
    minDelay: 500,
    maxDelay: 2000,
    interpolateDelay: true,

    // withStrokes: true,

    // governor: 90000,

    ...colorSchemes.icelandSlate,
  }
  let iterations = 0

  s.setup = () => {
    if (!props.withStrokes) s.noStroke()
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
    const limit = Math.min(window.innerWidth, window.innerHeight)
    createChipboard(-window.innerWidth / 5, -window.innerHeight / 5, window.innerWidth / 5, window.innerHeight / 5, 200, props.bg || 'white', 'bl')
  }

  s.draw = () => {
    s.clear()
    s.rotateX(Math.sin(s.frameCount * 0.0025))
    s.rotateY(Math.cos(s.frameCount * 0.0025))
    cubes.forEach(drawCube)
  }

  let cubes = []

  function createChipboard(minX, minY, maxX, maxY, maxZ, color, quad) {
    const dx = diff(minX, maxX)
    const dy = diff(minY, maxY)
    const { minBlankSpace } = props
    if (dx < minBlankSpace || dy < minBlankSpace) return

    const { randomness, color1, color2, color3, color4 } = props
    const xSplit = rir(minX, maxX, randomness)
    const ySplit = rir(minY, maxY, randomness)
    const zLimit = rir(0, maxZ, randomness)

    cubes.push({
      coords: [ minX, minY, maxX, maxY, zLimit ],
      color
    })

    const botLeft  = () => createChipboard(minX,   ySplit, xSplit, maxY,   maxZ, color1, 'bl')
    const botRight = () => createChipboard(xSplit, ySplit, maxX,   maxY,   maxZ, color2, 'br')
    const topRight = () => createChipboard(xSplit, minY,   maxX,   ySplit, maxZ, color3, 'tr')
    const topLeft  = () => createChipboard(minX,   minY,   xSplit, ySplit, maxZ, color4, 'tl')
    iterations++

    if (props.governor == null || iterations < props.governor) {
      let delay = props.delay || 0
      if (props.interpolateDelay) {
        delay = interpolate(
          [ minBlankSpace, window.innerWidth * window.innerHeight ],
          [ props.minDelay, props.maxDelay ],
          dx * dy
        )
      }
      setTimeout(() => {
        botLeft()
        botRight()
        topRight()
        topLeft()
      }, delay)
    }
  }

  function drawCube({ color, coords }) {
    const [ x1, y1, x2, y2, z ] = coords
    const dx = x2 - x1
    const dy = y2 - y1
    s.push()
    // s.fill(color)
    s.translate((x1 + x2) / 2, (y1 + y2) / 2, z / 2)
    s.box(dx, dy, z)
    s.pop()
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
    interpolate([0, 1], [middle, max], randomness),
  )
}
