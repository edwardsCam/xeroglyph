import { init as initProps, getProp, setProp } from 'utils/propConfig'
import RoomGenerator from '../../utils/room-generator'
import Scribble from '../../p5.scribble'

export default (s) => {
  const get = (prop) => getProp('pandorasBox', prop)
  const getProps = () => ({
    n: get('Resolution'),
    unity: get('Unity'),
    padding: get('Padding'),
    strokeWeight: get('Stroke Weight'),
    depth: get('Depth'),
    opacity: get('Opacity'),
    scribbly: get('Scribbly?'),
    pulse: get('Pulse'),
    pulseIntensityPadding: get('Pulse Intensity (Padding)'),
    pulseFrequencyPadding: get('Pulse Frequency (Padding)'),
    pulseIntensityDepth: get('Pulse Intensity (Depth)'),
    pulseFrequencyDepth: get('Pulse Frequency (Depth)'),
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
      default: 0.75,
      min: 0,
      max: 1,
      step: 0.05,
      onChange: initialize,
    },
    Padding: {
      type: 'number',
      default: 15,
      min: 0,
    },
    Depth: {
      type: 'number',
      default: 40,
      min: 0,
      step: 2,
    },
    'Stroke Weight': {
      type: 'number',
      default: 2,
      min: 0,
      step: 0.2,
    },
    Opacity: {
      type: 'number',
      default: 1,
      min: 0,
      max: 1,
      step: 0.1,
    },
    'Scribbly?': {
      type: 'boolean',
    },
    Pulse: {
      type: 'boolean',
    },
    'Pulse Intensity (Padding)': {
      when: () => get('Pulse'),
      type: 'number',
      default: 20,
      min: 0,
      step: 0.5,
    },
    'Pulse Frequency (Padding)': {
      when: () => get('Pulse'),
      type: 'number',
      default: 0.02,
      min: 0,
      step: 0.005,
    },
    'Pulse Intensity (Depth)': {
      when: () => get('Pulse'),
      type: 'number',
      default: 40,
      min: 0,
      step: 0.5,
    },
    'Pulse Frequency (Depth)': {
      when: () => get('Pulse'),
      type: 'number',
      default: 0.015,
      min: 0,
      step: 0.005,
    },
  })

  class PandorasBox {
    constructor(props) {
      this.faces = [
        new Face(props, 0),
        new Face(props, 1),
        new Face(props, 2),
        new Face(props, 3),
        new Face(props, 4),
        new Face(props, 5),
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

    draw({ n, padding, depth, opacity, scribbly, strokeWeight }) {
      s.push()

      const roomSize = Math.min(window.innerWidth, window.innerHeight) / (n * 2)
      const boxSize = roomSize * n
      const offset = boxSize / 2
      const halfDepth = depth / 2

      switch (this.orientation) {
        case 0:
          s.translate(halfDepth + padding, 0, -offset)
          s.rotateY(0)
          // s.fill(`rgba(255, 0, 0, ${opacity})`)
          break
        case 1:
          s.translate(offset + padding, padding + depth, halfDepth + padding)
          s.rotateY(Math.PI / 2)
          // s.fill(`rgba(0, 255, 0, ${opacity})`)
          break
        case 2:
          s.translate(-halfDepth, padding + depth, offset + padding)
          s.rotateY(Math.PI)
          // s.fill(`rgba(0, 0, 255, ${opacity})`)
          break
        case 3:
          s.translate(-offset, 0, -halfDepth)
          s.rotateY((3 * Math.PI) / 2)
          // s.fill(`rgba(255, 255, 0, ${opacity})`)
          break
        case 4:
          s.translate(-halfDepth, offset + padding + halfDepth, -halfDepth)
          s.rotateX(Math.PI / 2)
          // s.fill(`rgba(255, 0, 255, ${opacity})`)
          break
        case 5:
          s.translate(
            padding + halfDepth,
            halfDepth - offset,
            padding + halfDepth
          )
          s.rotateX((3 * Math.PI) / 2)
          // s.fill(`rgba(0, 255, 255, ${opacity})`)
          break
      }
      s.fill(`rgba(255, 255, 255, ${opacity})`)

      this.rooms.forEach((room) => {
        const { x, y, width, height } = this.getDimensions(
          room,
          roomSize,
          n,
          offset,
          padding
        )
        drawCube(
          {
            coords: {
              x1: x,
              y1: y,
              x2: x + width,
              y2: y + height,
            },
            depth,
            strokeWeight,
          },
          scribbly
        )
      })

      s.pop()
    }
  }

  let pandora
  let mouseX
  let mouseY
  let zoom
  const damp = 20
  let scribble

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
    initialize()
    mouseX = mouseY = 0
    zoom = 5
    scribble = new Scribble(s)
  }

  s.draw = () => {
    let props = getProps()
    if (props.pulse) {
      const newPadding =
        props.padding +
        props.pulseIntensityPadding *
          Math.sin(s.frameCount * props.pulseFrequencyPadding)
      const newDepth =
        props.depth +
        props.pulseIntensityDepth *
          Math.cos(s.frameCount * props.pulseFrequencyDepth)
      props = {
        ...props,
        padding: newPadding,
        depth: newDepth,
      }
    }
    s.clear()
    s.camera(0, 0, zoom * 200, 0, 0, 0, 0, 1, 0)
    s.lights()

    mouseX += (s.mouseX - mouseX) / damp
    mouseY += (s.mouseY - mouseY) / damp
    s.rotateY(mouseX * 0.005)
    s.rotateX(mouseY * 0.005)
    s.strokeWeight(props.strokeWeight)

    pandora.draw(props)
  }

  s.mouseWheel = (e) => {
    zoom += e.delta / (damp * 60)
    console.info(zoom)
  }

  function initialize() {
    const props = getProps()

    s.clear()
    s.stroke(0, 0, 0)
    s.noFill()
    s.noCursor()

    pandora = new PandorasBox(props)
  }

  function drawCube({ coords, depth, strokeWeight }, scribbly) {
    const { x1, y1, x2, y2 } = coords
    const dx = x2 - x1
    const dy = y2 - y1
    const avgX = (x1 + x2) / 2
    const avgY = (y1 + y2) / 2

    s.push()
    s.push()
    s.translate(avgX, avgY)
    if (scribbly) {
      s.noStroke()
    }
    s.box(dx, dy, depth)
    s.pop()

    if (scribbly) {
      s.push()
      s.strokeWeight(strokeWeight)
      s.translate(0, 0, -depth / 2)
      scribble.scribbleLine(x1, y1, x2, y1)
      scribble.scribbleLine(x2, y1, x2, y2)
      scribble.scribbleLine(x2, y2, x1, y2)
      scribble.scribbleLine(x1, y2, x1, y1)

      s.translate(0, 0, depth)
      scribble.scribbleLine(x1, y1, x2, y1)
      scribble.scribbleLine(x2, y1, x2, y2)
      scribble.scribbleLine(x2, y2, x1, y2)
      scribble.scribbleLine(x1, y2, x1, y1)

      s.translate(x1, y1, -depth)
      s.push()
      s.rotateX(Math.PI / 2)
      scribble.scribbleLine(0, 0, 0, depth)
      s.pop()

      s.push()
      s.translate(-x1 * 2, 0, 0)
      s.rotateX(Math.PI / 2)
      scribble.scribbleLine(0, 0, 0, depth)
      s.pop()

      s.push()
      s.translate(-x1 * 2, -y1 * 2, 0)
      s.rotateX(Math.PI / 2)
      scribble.scribbleLine(0, 0, 0, depth)
      s.pop()

      s.push()
      s.translate(0, -y1 * 2, 0)
      s.rotateX(Math.PI / 2)
      scribble.scribbleLine(0, 0, 0, depth)
      s.pop()

      s.pop()
    }

    s.pop()
  }
}
