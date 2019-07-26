import {
  randomInRange,
  interpolate,
  diff,
} from 'utils/math'

export default s => {
  const props = {
    minBlankSpace: 4,
    randomness: 1,
    color1: 'rgba(236, 236, 236, 1)',
    color2: 'rgba(159, 211, 199, 1)',
    color3: 'rgba(56, 81, 112, 1)',
    color4: 'rgba(20, 45, 76, 1)',
    // delay: 100,
  }

  s.setup = () => {
    s.noStroke()
    s.createCanvas(window.innerWidth, window.innerHeight)
    createChipboard(0, 0, window.innerWidth, window.innerHeight, 'white')
  }

  s.draw = () => {}

  function createChipboard(minX, minY, maxX, maxY, color, quad) {
    const { minBlankSpace } = props
    if (diff(minX, maxX) < minBlankSpace || diff(minY, maxY) < minBlankSpace) return

    s.fill(color)

    // drawTriangle3(minX, minY, maxX, maxY, quad)
    drawSquare(minX, minY, maxX, maxY)

    const { randomness, color1, color2, color3, color4 } = props
    const xSplit = rir(minX, maxX, randomness)
    const ySplit = rir(minY, maxY, randomness)

    const botLeft = () => createChipboard(minX, minY, xSplit, ySplit, color1, 'bl')
    const botRight = () => createChipboard(xSplit, minY, maxX, ySplit, color2, 'br')
    const topRight = () => createChipboard(xSplit, ySplit, maxX, maxY, color3, 'tr')
    const topLeft = () => createChipboard(minX, ySplit, xSplit, maxY, color4, 'tl')

    setTimeout(() => {
      botLeft()
      botRight()
      topRight()
      topLeft()
    }, props.delay || 0)
  }

  function drawSquare(x1, y1, x2, y2, radius = 0) {
    s.rect(x1, y1, x2 - x1, y2 - y1, radius, radius, radius, radius)
  }

  function drawTriangle1(x1, y1, x2, y2) {
    s.triangle(x1, y1, x1, y2, x2, y2)
  }

  function drawTriangle2(x1, y1, x2, y2, quad) {
    const dx = x2 - x1
    const dy = y2 - y1
    if (quad === 'bl') {
      s.triangle(x1, y1, x1, y2, x2, y2)
    } else if (quad === 'br') {
      s.triangle(x1, y2, x2, y2, x2, y1)
    } else if (quad === 'tr') {
      s.triangle(x1, y1, x2, y1, x2, y2)
    } else if (quad === 'tl') {
      s.triangle(x1, y1, x2, y1, x1, y2)
    }
  }

  function drawTriangle3(x1, y1, x2, y2, quad) {
    const dx = x2 - x1
    const dy = y2 - y1
    if (quad === 'bl') {
      s.triangle(x1, y1, x1, y2, x1 + dx / 2, y2)
    } else if (quad === 'br') {
      s.triangle(x1 + dx / 2, y2, x2, y2, x2, y1)
    } else if (quad === 'tr') {
      s.triangle(x1 + dx / 2, y1, x2, y1, x2, y2)
    } else if (quad === 'tl') {
      s.triangle(x1, y1, x1 + dx / 2, y1, x1, y2)
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
