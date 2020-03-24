import { init as initProps, getProp } from 'utils/propConfig'
import DisjointSet from './disjoint-set'

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

const getRandomAdjacentRoom = ({ r, c }, n) => {
  let dir = Math.floor(Math.random() * 4)
  for (let i = 0; i < 4; i++) {
    switch (dir) {
      case 0:
        if (c > 0)
          return {
            r,
            c: c - 1,
          }
        break
      case 1:
        if (r > 0)
          return {
            r: r - 1,
            c,
          }
        break
      case 2:
        if (c < n - 1)
          return {
            r,
            c: c + 1,
          }
        break
      case 3:
        if (r < n - 1)
          return {
            r: r + 1,
            c,
          }
        break
    }
    dir = (dir + 1) % 4
  }
  return null
}

export default s => {
  const get = prop => getProp('iSpy', prop)
  const getProps = () => ({
    n: get('Resolution'),
    unity: get('Unity'),
  })

  class Board {
    constructor({ n, unity }) {
      const rooms = []
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          rooms.push({ r, c })
        }
      }
      this.rooms = new DisjointSet(rooms)
      this.singleRooms = Object.values(this.rooms.universe).map(
        ({ data }) => data
      )
      this.combineRooms(n, unity)
    }

    combineRooms(n, unity) {
      const numMerges = n * n * unity
      for (let i = 0; i < numMerges; i++) {
        if (!this.singleRooms.length) return
        const randomIndex = Math.floor(Math.random() * this.singleRooms.length)
        const room1 = this.singleRooms[randomIndex]
        const room2 = getRandomAdjacentRoom(room1, n)
        this.rooms.union(room1, room2)
        this.singleRooms.splice(randomIndex, 1)
      }
    }

    draw(props) {
      s.stroke(255, 255, 255)
      s.fill(0, 0, 0)
      const roomSize = Math.min(window.innerWidth, window.innerHeight) / props.n
      this.rooms.forEach(room => {
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
      default: 10,
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
