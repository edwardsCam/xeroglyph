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
    minBlankSpace: 5,
    randomness: 1,

    // delay: 100,
    minDelay: 0,
    maxDelay: 150,
    interpolateDelay: false,

    // withStrokes: true,

    ...colorSchemes.icelandSlate,
  }

  s.setup = () => {
    if (!props.withStrokes) s.noStroke()
    s.createCanvas(window.innerWidth, window.innerHeight)
    createChipboard(0, 0, window.innerWidth, window.innerHeight, props.bg || 'white', 'bl')
  }

  s.draw = () => {}

  function createChipboard(minX, minY, maxX, maxY, color, quad) {
    const dx = diff(minX, maxX)
    const dy = diff(minY, maxY)
    const { minBlankSpace } = props
    if (dx < minBlankSpace || dy < minBlankSpace) return

    s.fill(color)

    // drawTriangle(minX, minY, maxX, maxY, quad)
    drawSquare(minX, minY, maxX, maxY, 1)

    const { randomness, color1, color2, color3, color4 } = props
    const xSplit = rir(minX, maxX, randomness)
    const ySplit = rir(minY, maxY, randomness)

    const botLeft = () => createChipboard(minX, ySplit, xSplit, maxY, color1, 'bl')
    const botRight = () => createChipboard(xSplit, ySplit, maxX, maxY, color2, 'br')
    const topRight = () => createChipboard(xSplit, minY, maxX, ySplit, color3, 'tr')
    const topLeft = () => createChipboard(minX, minY, xSplit, ySplit, color4, 'tl')

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
