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
  constructor({ n, unity }) {
    this.n = n
    this.unity = unity
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

    this.combineRooms()
  }

  combineRooms() {
    const { n, unity } = this
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

  forEach(callback) {
    this.rooms.forEach(callback)
  }
}
