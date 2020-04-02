import { init as initProps, getProp } from 'utils/propConfig'
import RoomGenerator from '../../utils/room-generator'

const getDimensions = (room, roomSize) => {
  let minX, maxX
  let minY, maxY

  room.parent.items.forEach(({ data }, i) => {
    if (i === 0) {
      minX = maxX = data.c
      minY = maxY = data.r
    }
    if (data.c < minX) minX = data.c
    if (data.c > maxX) maxX = data.c
    if (data.r < minY) minY = data.r
    if (data.r > maxY) maxY = data.r
  })

  return {
    x: minX * roomSize,
    y: minY * roomSize,
    width: (1 + (maxX - minX)) * roomSize,
    height: (1 + (maxY - minY)) * roomSize,
  }
}

export default (s) => {
  const get = (prop) => getProp('iSpy', prop)
  const getProps = () => ({
    n: get('Resolution'),
    unity: get('Unity'),
  })

  class Board {
    constructor(props) {
      this.rooms = new RoomGenerator(props)
    }

    draw(props) {
      s.stroke(255, 255, 255)
      s.fill(0, 0, 0)
      const roomSize = Math.min(window.innerWidth, window.innerHeight) / props.n
      this.rooms.forEach((room) => {
        const { x, y, width, height } = getDimensions(room, roomSize)
        s.rect(x, y, width, height)
      })
    }
  }

  initProps('iSpy', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    Resolution: {
      type: 'number',
      default: 3,
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
  })

  let board
  function initialize() {
    board = new Board(getProps())
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  s.draw = () => {
    s.clear()
    const props = getProps()
    board.draw(props)
  }
}
