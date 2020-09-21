import DisjointSet from './disjoint-set'

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

export default class RoomGenerator {
  constructor(props) {
    const rooms = []
    for (let r = 0; r < props.n; r++) {
      for (let c = 0; c < props.n; c++) {
        rooms.push({ r, c })
      }
    }
    this.disjointSet = new DisjointSet(rooms)
    this.singleRooms = Object.values(this.disjointSet.universe).map(
      ({ data }) => data
    )

    this.combineRooms(props)
  }

  removeSingleRoom({ r, c }) {
    const idx = this.singleRooms.findIndex(
      (coords) => coords.r === r && coords.c === c
    )
    if (idx >= 0) {
      this.singleRooms.splice(idx, 1)
    }
  }

  combineRooms(props) {
    const { n, unity, quadsOnly = false } = props

    if (quadsOnly) {
      const add = (room1, room2) => {
        this.disjointSet.union(room1, room2)
        this.removeSingleRoom(room1)
        this.removeSingleRoom(room2)
        const bigRoom = this.disjointSet.find(room1)
        const { minR, minC, maxR, maxC } = bigRoom.getTopLeftCorner()
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const coords = { r, c }
            if (!this.disjointSet.areInTheSameRoom(room1, coords)) {
              add(room1, coords)
            }
          }
        }
      }

      const hasMoreMergingToDo = () => {
        const expected = Math.floor(n * n * unity)
        const actual = n * n - this.singleRooms.length
        return actual < expected
      }
      while (hasMoreMergingToDo()) {
        const { room: room1 } = this.getRandomRoom()
        const room2 = getRandomAdjacentRoom(room1, n)
        add(room1, room2)
      }
    } else {
      const numMerges = n * n * unity
      for (let i = 0; i < numMerges; i++) {
        if (!this.singleRooms.length) return
        const { room: room1, randomIndex } = this.getRandomRoom()
        const room2 = getRandomAdjacentRoom(room1, n)
        this.disjointSet.union(room1, room2)
        this.singleRooms.splice(randomIndex, 1)
      }
    }
  }

  getRandomRoom() {
    const randomIndex = Math.floor(Math.random() * this.singleRooms.length)
    return {
      room: this.singleRooms[randomIndex],
      index: randomIndex,
    }
  }

  forEach(callback) {
    this.disjointSet.forEach(callback)
  }
}
