const getKey = ({ r, c }) => `${r}:${c}`

/*
const isAdjacent = (set1, set2) => {
  const coords = set1.items.reduce(
    (map, { data }) => ({
      ...map,
      [getKey(data)]: true,
    }),
    {}
  )
  return set2.items.some(
    ({ data }) =>
      coords[
        getKey({
          r: data.r - 1,
          c: data.c,
        })
      ] ||
      coords[
        getKey({
          r: data.r + 1,
          c: data.c,
        })
      ] ||
      coords[
        getKey({
          r: data.r,
          c: data.c - 1,
        })
      ] ||
      coords[
        getKey({
          r: data.r,
          c: data.c + 1,
        })
      ]
  )
}
*/

class Item {
  constructor(data) {
    this.data = data
  }
}

class Room {
  constructor() {
    this.items = new Set()
  }

  add(item) {
    if (item.parent !== this) {
      item.parent = this
      this.items.add(item)
    }
  }

  merge(otherSet) {
    if (otherSet === this) return
    otherSet.items.forEach((item) => this.add(item))
  }

  getTopLeftCorner() {
    let minR
    let minC
    let maxR
    let maxC
    let first = true
    this.items.forEach(({ data }) => {
      if (first) {
        minR = maxR = data.r
        minC = maxC = data.c
        first = false
      }
      if (data.r < minR) minR = data.r
      if (data.c < minC) minC = data.c
      if (data.r > maxR) maxR = data.r
      if (data.c > maxC) maxC = data.c
    })
    return { minR, minC, maxR, maxC }
  }
}

export default class DisjointSet {
  constructor(items) {
    this.universe = items.reduce((universe, data) => {
      const item = new Item(data)
      const room = new Room([item])
      room.add(item)
      return {
        ...universe,
        [getKey(data)]: item,
      }
    }, {})
  }

  find(data) {
    return this.universe[getKey(data)].parent
  }

  union(item1, item2) {
    if (!item1 || !item2) return
    const otherSet = this.find(item2)
    const firstSet = this.find(item1)
    firstSet.merge(otherSet)
  }

  getRooms() {
    return Object.values(this.universe).reduce((rooms, item) => {
      rooms.add(this.find(item.data))
      return rooms
    }, new Set())
  }

  areInTheSameRoom(d1, d2) {
    return this.find(d1) === this.find(d2)
  }

  prettyPrint() {
    console.log('*** begin pretty print ***')
    let cnt = 1
    this.getRooms().forEach((room) => {
      console.log(
        `room ${cnt++}, ${room.items.size} items`,
        [...room.items].map(({ data }) => data)
      )
    })
    console.log('*** end pretty print ***')
  }

  forEach(callback) {
    this.getRooms().forEach(callback)
  }
}
