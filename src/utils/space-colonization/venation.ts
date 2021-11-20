import {
  PolarCoord,
  randomInRange,
  coordWithAngleAndDistance,
  withinPolygonBounds,
  distance,
} from '../math'

const toCart = (origin: Point, point: PolarCoord): Point =>
  coordWithAngleAndDistance(origin, point[0], point[1])

export default class Venation {
  branches: Branch[]
  origin: Point
  claimedCells: {
    [theta: number]: {
      [len: number]: boolean
    }
  }
  branchResolution: number
  branchLength: number

  constructor(
    branchResolution: number,
    branchLength: number,
    origin: Point,
    variance = 0
  ) {
    this.branches = [new Branch([0, branchResolution])]
    this.origin = origin
    this.claimedCells = []
    this.branchResolution = Math.max(
      1,
      variance
        ? randomInRange(
            branchResolution - branchResolution * variance,
            branchResolution + branchResolution * variance
          )
        : branchResolution
    )
    this.branchLength = Math.max(
      Math.max(1, branchResolution + 1),
      variance
        ? randomInRange(
            branchLength - branchLength * variance,
            branchLength + branchLength * variance
          )
        : branchLength
    )
  }

  fillByOne(border: PolarCoord[]) {
    for (let i = 0; i < this.branches.length; i++) {
      const branch = this.branches[i]
      const lastPoint = branch.points[branch.points.length - 1]
      const nextPoint: PolarCoord = [
        lastPoint[0] + branch.initialRotation + randomInRange(-0.01, 0.01),
        lastPoint[1] + this.branchResolution,
      ]
      if (!this.inBounds(nextPoint, border)) continue
      if (this.isClaimed(nextPoint)) continue
      branch.points.push(nextPoint)
      this.claim(nextPoint)

      if (this.hasSpace(nextPoint)) {
        this.branches.push(
          branch.branchOut(branch.initialRotation + randomInRange(0.01, 0.1))
        )
        this.branches.push(
          branch.branchOut(branch.initialRotation - randomInRange(0.01, 0.1))
        )
      }
    }
  }

  inBounds = (point: PolarCoord, polygon: PolarCoord[]): boolean =>
    withinPolygonBounds(
      coordWithAngleAndDistance(this.origin, point[0], point[1]),
      polygon.map((p) => coordWithAngleAndDistance(this.origin, p[0], p[1]))
    )

  isClaimed = (point: PolarCoord): boolean => {
    const { x, y } = this.cellCoords(point)
    return !!(this.claimedCells[x] && this.claimedCells[x][y])
  }

  claim = (point: PolarCoord): void => {
    const { x, y } = this.cellCoords(point)
    if (!this.claimedCells[x]) this.claimedCells[x] = {}
    this.claimedCells[x][y] = true
  }

  cellCoords = ([theta, len]: PolarCoord): { x: number; y: number } => {
    const x = Math.floor(theta * 1000) / 1000
    const y = Math.floor(len)
    return { x, y }
  }

  hasSpace(point: PolarCoord): boolean {
    for (let i = 0; i < this.branches.length; i++) {
      const branch = this.branches[i]
      const lastBranchPoint = branch.subBranches.length
        ? branch.subBranches[branch.subBranches.length - 1]
        : 0
      const distFromLastBranch = distance(
        toCart(this.origin, point),
        toCart(this.origin, branch.points[lastBranchPoint])
      )
      if (distFromLastBranch < this.branchLength) return false
    }
    return true
  }
}

export class Branch {
  points: PolarCoord[]
  subBranches: number[] // indices of points where a sub-branch occurs
  initialRotation: number

  constructor(startPoint: PolarCoord, initialRotation = 0) {
    this.points = [startPoint]
    this.subBranches = []
    this.initialRotation = initialRotation
  }

  branchOut(rotation: number): Branch {
    const idx = this.points.length - 1
    const lastPoint = this.points[idx]
    this.subBranches.push(idx)
    return new Branch(lastPoint, rotation)
  }
}
