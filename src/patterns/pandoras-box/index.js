import { init as initProps, getProp } from 'utils/propConfig'
import RoomGenerator from '../../utils/room-generator'

export default (s) => {
  const get = (prop) => getProp('pandorasBox', prop)
  const getProps = () => ({
    n: get('Resolution'),
    unity: get('Unity'),
    padding: get('Padding'),
    strokeWeight: get('Stroke Weight'),
    depth: get('Depth'),
  })
  initProps('pandorasBox', {
    redraw: {
      type: 'func',
      label: 'Regenerate',
      callback: initialize,
    },
    Resolution: {
      type: 'number',
      default: 5,
      min: 1,
      onChange: initialize,
    },
    Unity: {
      type: 'number',
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      onChange: initialize,
    },
    Padding: {
      type: 'number',
      default: 20,
      min: 0,
    },
    Depth: {
      type: 'number',
      default: 20,
      min: 0,
      step: 2,
    },
    'Stroke Weight': {
      type: 'number',
      default: 2,
      min: 0,
      step: 0.2,
    },
  })

  class PandorasBox {
    constructor(props) {
      this.faces = [
        new Face(props, 0),
        new Face(props, 1),
        new Face(props, 2),
        new Face(props, 3),
      ]
    }

    draw(props) {
      this.faces.forEach((face) => face.draw(props))
    }
  }

  class Face {
    constructor(props, orientation) {
      this.rooms = new RoomGenerator({ ...props, quadsOnly: true })
      this.orientation = orientation
    }

    getDimensions({ items }, roomSize, n, offset, padding) {
      let minX, maxX
      let minY, maxY

      let first = true
      items.forEach(({ data }) => {
        if (first) {
          minX = maxX = data.c
          minY = maxY = data.r
          first = false
        }
        if (data.c < minX) minX = data.c
        if (data.c > maxX) maxX = data.c
        if (data.r < minY) minY = data.r
        if (data.r > maxY) maxY = data.r
      })

      let x = minX * roomSize
      let y = minY * roomSize

      let xPads = 0
      let yPads = 0
      if (minX > 0) {
        x += padding / 2
        xPads++
      }
      if (minY > 0) {
        y += padding / 2
        yPads++
      }
      if (maxX < n - 1) {
        xPads++
      }
      if (maxY < n - 1) {
        yPads++
      }

      return {
        x: x - offset,
        y: y - offset,
        width: (1 + (maxX - minX)) * roomSize - (xPads * padding) / 2,
        height: (1 + (maxY - minY)) * roomSize - (yPads * padding) / 2,
      }
    }

    draw({ n, padding, depth }) {
      s.push()

      const roomSize = Math.min(window.innerWidth, window.innerHeight) / (n * 2)
      const boxSize = roomSize * n
      const offset = boxSize / 2
      const halfDepth = depth / 2

      switch (this.orientation) {
        case 0:
          s.translate(halfDepth + padding, 0, -offset)
          s.fill('rgba(255, 0, 0, 1)')
          break
        case 1:
          s.translate(offset + padding, 0, halfDepth + padding)
          s.fill('rgba(0, 255, 0, 1)')
          break
        case 2:
          s.translate(-halfDepth, 0, offset + padding)
          s.fill('rgba(0, 0, 255, 1)')
          break
        case 3:
          s.translate(-offset, 0, -halfDepth)
          s.fill('rgba(0, 0, 0, 1)')
          break
      }

      s.rotateY((this.orientation * Math.PI) / 2)

      this.rooms.forEach((room) => {
        const { x, y, width, height } = this.getDimensions(
          room,
          roomSize,
          n,
          offset,
          padding
        )
        drawCube({
          coords: {
            x1: x,
            y1: y,
            x2: x + width,
            y2: y + height,
          },
          depth,
        })
      })

      s.pop()
    }
  }

  let pandora
  let mouseX
  let mouseY

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
    initialize()
    mouseX = mouseY = 0
  }

  s.draw = () => {
    const props = getProps()
    s.clear()

    const damp = 20
    const xDiff = (s.mouseX - mouseX) / damp
    mouseX += xDiff

    const yDiff = (s.mouseY - mouseY) / damp
    mouseY += yDiff
    s.rotateY(mouseX * 0.005)
    s.rotateX(mouseY * 0.005)
    s.strokeWeight(props.strokeWeight)
    pandora.draw(props)
  }

  function initialize() {
    const props = getProps()

    s.clear()
    s.stroke(255, 255, 255)
    s.noFill()

    pandora = new PandorasBox(props)
  }

  function drawCube({ coords, depth }) {
    const { x1, y1, x2, y2 } = coords
    const dx = x2 - x1
    const dy = y2 - y1

    s.push()
    s.translate((x1 + x2) / 2, (y1 + y2) / 2)
    s.box(dx, dy, depth)
    s.pop()
  }
}
