import { init as initProps, getProp } from 'utils/propConfig.ts'
import {
  randomInRange,
  Point,
  PolarCoord,
  interpolate,
  coordWithAngleAndDistance,
  PHI,
} from 'utils/math.ts'
import { getCenter, getBoundedSize } from 'utils/window.ts'
import Venation from 'utils/space-colonization/venation.ts'

const randomLeafyGreenHue = (
  range = 17,
  brightness = 70
): [number, number, number] => {
  const baseH = 86
  const baseS = 88
  const baseB = brightness
  return [
    randomInRange(baseH - range, baseH + range, true),
    randomInRange(baseS - range, baseS + range, true),
    randomInRange(baseB - range, baseB + range, true),
  ]
}

const _DRAW_MODES_ = ['Space Colonization', 'Solid Color'] as const

type Props = {
  maxPushSpeed: number
  addLeafTime: number
  maxLeaves: number
  leafGrowthRate: number
  drawMode: typeof _DRAW_MODES_[number]
  branchResolution: number
  branchLength: number
}

const pi2 = Math.PI * 2

export default (s) => {
  initProps('flower', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    'Max Push Speed': {
      type: 'number',
      min: 0,
      step: 0.5,
      default: 1,
    },
    'New Leaf Timer': {
      type: 'number',
      default: 0.3,
      step: 0.1,
      min: 0,
    },
    'Max Leaves': {
      type: 'number',
      default: 7,
      min: 0,
    },
    'Growth Rate': {
      type: 'number',
      min: 0,
      default: 1.5,
      step: 0.1,
    },
    'Draw Mode': {
      type: 'dropdown',
      options: [..._DRAW_MODES_],
      default: _DRAW_MODES_[0],
    },
    'Branch Resolution': {
      type: 'number',
      default: 4,
      min: 0.5,
      step: 0.5,
      when: () => get('Draw Mode') === 'Space Colonization',
    },
    'Branch Length': {
      type: 'number',
      default: 15,
      min: 1,
      when: () => get('Draw Mode') === 'Space Colonization',
    },
  })
  const get = (prop: string) => getProp('flower', prop)
  const getProps = (): Props => ({
    maxPushSpeed: get('Max Push Speed'),
    addLeafTime: get('New Leaf Timer'),
    maxLeaves: get('Max Leaves'),
    leafGrowthRate: get('Growth Rate'),
    drawMode: get('Draw Mode'),
    branchResolution: get('Branch Resolution'),
    branchLength: get('Branch Length'),
  })

  let flower: Flower
  let center: Point = getCenter()
  let leafTimeout: NodeJS.Timeout

  class Flower {
    leaves: Leaf[]

    constructor(props: Props) {
      this.leaves = []
    }

    addLeaf(props: Props) {
      this.leaves.push(new Leaf(props))
    }

    removeLeaf() {
      const randomIdx = randomInRange(0, this.leaves.length, true)
      this.leaves.splice(randomIdx, 1)
    }

    mutate(props: Props) {
      const getPush = (diff: number): number =>
        interpolate([0, Math.PI], [props.maxPushSpeed / 1000, 0], diff)

      const useOptim = this.leaves.length > 350
      const marked = {}

      this.leaves.forEach((leaf, i) => {
        if (!marked[i]) marked[i] = {}
        this.leaves.forEach((otherLeaf, j) => {
          marked[i][j] = true
          if (i === j) return
          if (useOptim && marked[j] && marked[j][i]) return

          const [a1, a2] = [leaf.rotation, otherLeaf.rotation]
          let diff = Math.abs(a2 - a1)

          if (diff > Math.PI) {
            diff = pi2 - diff
            const push = getPush(diff)
            if (a1 < a2) {
              otherLeaf.rotation -= push
            } else {
              otherLeaf.rotation += push
            }
          } else {
            const push = getPush(diff)
            if (a1 > a2) {
              otherLeaf.rotation -= push
            } else {
              otherLeaf.rotation += push
            }
          }
        })
      })
      this.leaves.forEach((leaf) => leaf.mutate(props))
    }

    draw(props: Props) {
      s.clear()
      this.leaves.forEach((leaf) => leaf.draw(props))
    }
  }

  class Leaf {
    rotation: number
    maxLen: number
    growthRateVariance: number
    len: number
    root: Point
    cells: number
    border: PolarCoord[]
    color: [number, number, number]
    venation: Venation

    constructor(props: Props) {
      const boundedSize = getBoundedSize() * 0.6
      this.rotation = randomInRange(0, Math.PI * 2)
      this.maxLen = randomInRange(boundedSize / 2.5, boundedSize, true)
      this.len = 0
      this.growthRateVariance = randomInRange(0.05, 2)
      this.root = center
      this.cells = 0
      this.border = []
      this.color = randomLeafyGreenHue()
      this.venation = new Venation(
        props.branchResolution,
        props.branchLength,
        center,
        0.2
      )
    }

    mutate(props: Props) {
      const diff = this.maxLen - this.len
      this.len += (diff * props.leafGrowthRate * this.growthRateVariance) / 200
    }

    draw(props: Props) {
      this.buildBorder()
      this.drawBorder(props)

      if (props.drawMode !== 'Solid Color') {
        this.venation.fillByOne(this.border)
        this.drawBranches()
      }
    }

    buildBorder() {
      const root: PolarCoord = [0, 0]
      const tip: PolarCoord = [0, this.len]

      this.border = [
        root,
        [Math.PI / 5, this.len / 4],
        [Math.PI / 7, this.len / 3],
        [Math.PI / 20, this.len / 2],
        tip,
        [Math.PI * 2 - Math.PI / 20, this.len / 2],
        [Math.PI * 2 - Math.PI / 7, this.len / 3],
        [Math.PI * 2 - Math.PI / 5, this.len / 4],
        root,
      ]

      // const x = this.len / Math.pow(PHI, 5)
      // this.border = [
      //   [Math.PI * 0 / 6, x * Math.pow(PHI, 2)],
      //   [Math.PI * 1 / 6, x * Math.pow(PHI, 3)],
      //   [Math.PI * 2 / 6, x * Math.pow(PHI, 4)],
      //   [Math.PI * 3 / 6, x * Math.pow(PHI, 5)],
      //   [Math.PI * 4 / 6, x * Math.pow(PHI, 4)],
      //   [Math.PI * 5 / 6, x * Math.pow(PHI, 3)],
      //   [Math.PI * 6 / 6, x * Math.pow(PHI, 2)],
      //   [Math.PI * 7 / 6, x * PHI],
      //   [Math.PI * 8 / 6, x],
      //   [Math.PI * 9 / 6, 0],
      //   [Math.PI * 10 / 6, x],
      //   [Math.PI * 11 / 6, x * PHI],
      // ]
    }

    drawBorder(props: Props) {
      s.push()
      s.strokeWeight(2.5)
      s.stroke(...randomLeafyGreenHue(10, 15))
      s.fill(...this.color)
      s.beginShape()
      this.border.forEach((point) => {
        const cart = this.toCartesian(point)
        s.vertex(cart.x, cart.y)
      })
      s.endShape()
      s.pop()
    }

    drawBranches() {
      s.push()
      s.stroke('black')
      s.noFill()
      s.strokeWeight(0.5)
      this.venation.branches.forEach((branch) => {
        s.beginShape()
        branch.points.forEach((vertex) => {
          const cart = this.toCartesian(vertex)
          s.vertex(cart.x, cart.y)
        })
        s.endShape()
      })
      s.pop()
    }

    toCartesian = (p: PolarCoord): Point =>
      coordWithAngleAndDistance(this.root, p[0] + this.rotation, p[1])
  }

  function startLeafTimer() {
    const props = getProps()
    leafTimeout = setTimeout(() => {
      if (flower.leaves.length < props.maxLeaves) {
        flower.addLeaf(props)
      } else if (flower.leaves.length > props.maxLeaves) {
        flower.removeLeaf()
      }
      startLeafTimer()
    }, props.addLeafTime * 1000)
  }

  function initialize() {
    s.clear()
    clearInterval(leafTimeout)
    const props = getProps()
    flower = new Flower(props)
    startLeafTimer()
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  s.draw = () => {
    s.clear()
    s.colorMode(s.HSB, 255)
    center = getCenter()
    const props = getProps()
    s.stroke('white')
    flower.mutate(props)
    flower.draw(props)
  }
}
