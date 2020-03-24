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

class Set {
  constructor() {
    this.items = []
  }

  add(item) {
    if (item.parent !== this) {
      item.parent = this
      this.items.push(item)
    }
  }

  merge(otherSet) {
    otherSet.items.forEach(item => this.add(item))
  }
}

export default class DisjointSet {
  constructor(items) {
    this.universe = items.reduce((universe, data) => {
      const item = new Item(data)
      const set = new Set([item])
      set.add(item)
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

  forEach(callback) {
    Object.values(this.universe).forEach(callback)
  }
}
