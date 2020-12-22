import { Vector } from 'p5'
import { randomInRange, distance } from '../math'

export class Leaf {
  pos: Vector
  reached: boolean

  constructor(pos?: Vector) {
    this.pos =
      pos ||
      new Vector(
        randomInRange(0, window.innerWidth, true),
        randomInRange(0, window.innerHeight, true)
      )
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

export default class Tree {
  leaves: Leaf[]
  root: Branch
  branches: Branch[]
  minDist: number
  origin: Vector

  constructor({
    origin,
    numLeaves,
    branchLength,
    minDist,
  }: {
    origin: Vector
    numLeaves: number
    branchLength: number
    minDist: number
  }) {
    this.origin = origin
    this.leaves = []
    for (let i = 0; i < numLeaves; i++) {
      this.leaves.push(new Leaf())
    }

    this.root = new Branch(null, origin, new Vector(0, -1), branchLength)
    this.branches = [this.root]
    this.minDist = minDist
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
      if (branch.count > 0) {
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
  } => {
    const branches: [Vector, Vector][] = this.branches
      .filter((b) => !!b.parent)
      .map((b) => [b.parent!.pos, b.pos])
    const leaves = this.leaves.map((l) => l.pos)
    return {
      branches,
      leaves,
    }
  }
}
