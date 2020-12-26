import { Vector } from 'p5'
import { randomInRange, distance, interpolate, Point } from '../math'

export const LeafMode = ['random', 'cross', 'circle', 'perimeter'] as const

export class Leaf {
  pos: Vector
  reached: boolean

  constructor(pos: Vector) {
    this.pos = pos
    this.reached = false
  }
}

export class Branch {
  pos: Vector
  origDir: Vector
  dir: Vector
  parent: Branch | null
  count: number
  len: number

  constructor(parent: Branch | null, pos: Vector, dir: Vector, len: number) {
    this.parent = parent
    this.pos = pos
    this.origDir = dir
    this.dir = this.origDir.copy()
    this.count = 0
    this.len = len || 5
  }

  next() {
    return new Branch(
      this,
      Vector.add(this.pos, Vector.mult(this.dir, this.len)),
      this.dir,
      this.len
    )
  }

  reset() {
    this.dir = this.origDir.copy()
    this.count = 0
  }
}

const getCrossCoords = (i: number, numLeaves: number, r: number): Point => {
  let x: number
  let y: number
  if (i % 2) {
    x = interpolate([0, numLeaves], [0, window.innerWidth], i)
    y = window.innerHeight / 2 + randomInRange(-r, r)
  } else {
    x = window.innerWidth / 2 + randomInRange(-r, r)
    y = interpolate([0, numLeaves], [0, window.innerHeight], i)
  }
  return { x, y }
}

const getCircleCoords = (i: number, numLeaves: number, r: number): Point => {
  const period = (i * Math.PI * 2) / numLeaves
  const x =
    interpolate([-1, 1], [r, window.innerWidth - r], Math.sin(period)) +
    randomInRange(-r, r)
  const y =
    interpolate([-1, 1], [r, window.innerHeight - r], Math.cos(period)) +
    randomInRange(-r, r)
  return { x, y }
}

const getPerimeterCoords = (i: number, numLeaves: number, r: number): Point => {
  let x: number
  let y: number
  const maxY = window.innerHeight - r
  const maxX = window.innerWidth - r
  if (i % 2) {
    x = interpolate([0, numLeaves], [r, maxX], i)
    if ((i - 1) % 4) {
      y = r
    } else {
      y = maxY
    }
    y += randomInRange(-r, r)
  } else {
    if (i % 4) {
      x = r
    } else {
      x = maxX
    }
    x += randomInRange(-r, r)
    y = interpolate([0, numLeaves], [r, maxY], i)
  }
  return { x, y }
}

export default class Tree {
  leaves: Leaf[]
  root: Branch
  branches: Branch[]
  minDist: number
  origin: Vector
  wat: number

  constructor({
    origin,
    numLeaves,
    branchLength,
    minDist,
    wat,
    leafMode,
    shapeWidth: randomRange,
  }: {
    origin: Vector
    numLeaves: number
    branchLength: number
    minDist: number
    wat: number
    leafMode: typeof LeafMode[number]
    shapeWidth: number
  }) {
    this.origin = origin
    this.leaves = []
    for (let i = 0; i < numLeaves; i++) {
      let x: number
      let y: number
      if (leafMode === 'random') {
        x = randomInRange(0, window.innerWidth, true)
        y = randomInRange(0, window.innerHeight, true)
      } else if (leafMode === 'cross') {
        const p = getCrossCoords(i, numLeaves, randomRange)
        x = p.x
        y = p.y
      } else if (leafMode === 'circle') {
        const p = getCircleCoords(i, numLeaves, randomRange)
        x = p.x
        y = p.y
      } else if (leafMode === 'perimeter') {
        const p = getPerimeterCoords(i, numLeaves, randomRange)
        x = p.x
        y = p.y
      } else {
        x = window.innerWidth / 2
        y = window.innerHeight / 2
      }

      this.leaves.push(new Leaf(new Vector(x, y)))
    }

    this.root = new Branch(null, origin, new Vector(0, -1), branchLength)
    this.branches = [this.root]
    this.minDist = minDist
    this.wat = wat
  }

  grow() {
    for (let i = 0; i < this.leaves.length; i++) {
      const leaf = this.leaves[i]

      let closestBranch: Branch | undefined
      let closestDist = Number.POSITIVE_INFINITY
      for (let j = 0; j < this.branches.length; j++) {
        const branch = this.branches[j]
        const dist = distance(leaf.pos, branch.pos)
        if (dist < this.minDist) {
          leaf.reached = true
          break
        } else if (dist < closestDist) {
          closestDist = dist
          closestBranch = branch
        }
      }

      if (closestBranch) {
        const dir = Vector.sub(leaf.pos, closestBranch.pos)
        dir.normalize()
        closestBranch.dir.add(dir)
        closestBranch.count++
      }

      if (leaf.reached) this.leaves.splice(i, 1)
    }

    for (let i = this.branches.length - 1; i >= 0; i--) {
      const branch = this.branches[i]
      if (branch.count > this.wat) {
        branch.dir.div(branch.count + 1)
        this.branches.push(branch.next())
        branch.reset()
      }
    }
  }

  inBounds = (p: Vector) =>
    p.x > 0 && p.x < window.innerWidth && p.y > 0 && p.y < window.innerHeight

  displayInfo = (): {
    branches: [Vector, Vector][]
    leaves: Vector[]
  } => ({
    branches: this.branches
      .filter((b) => !!b.parent)
      .map((b) => [b.parent!.pos, b.pos]),
    leaves: this.leaves.map((l) => l.pos),
  })
}
