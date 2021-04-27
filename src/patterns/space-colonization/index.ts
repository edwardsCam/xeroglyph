import { Vector } from 'p5'
import { init as initProps, getProp } from 'utils/propConfig'
import Tree, { LeafMode } from 'utils/space-colonization/tree'
import { distance, interpolate } from 'utils/math'
import { getCenter, getBoundedSize } from 'utils/window'

type Props = {
  branchLength: number
  leaves: number
  showLeaves: boolean
  leafRadius: number
  maxWeight: number
  minWeight: number
  thiccCenter: boolean
  falloff: number
  wat: number
  leafMode: typeof LeafMode[number]
  shapeWidth: number
}

export default (s) => {
  initProps('spaceColonization', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    'Branch Length': {
      type: 'number',
      default: 8,
      min: 2,
    },
    'Leaf Radius': {
      type: 'number',
      default: 10,
      min: 5,
    },
    Leaves: {
      type: 'number',
      default: 1500,
      step: 10,
      min: 10,
    },
    'Max Weight': {
      type: 'number',
      default: 5,
      step: 0.5,
      min: 1,
    },
    'Min Weight': {
      type: 'number',
      default: 1,
      step: 0.5,
      min: 1,
    },
    'Thicc Center': {
      type: 'boolean',
      default: true,
    },
    'Thiccness Falloff': {
      type: 'number',
      default: 0.7,
      step: 0.05,
      min: 0,
      max: 1,
    },
    'Show Leaves': {
      type: 'boolean',
      default: false,
    },
    wat: {
      type: 'number',
      min: 0,
      default: 0,
      step: 2,
    },
    'Leaf Mode': {
      type: 'dropdown',
      default: LeafMode[0],
      options: [...LeafMode],
    },
    Width: {
      type: 'number',
      min: 2,
      step: 2,
      default: 90,
      when: () => get('Leaf Mode') !== 'random',
    },
  })

  const get = (prop: string) => getProp('spaceColonization', prop)
  const getProps = (): Props => ({
    branchLength: get('Branch Length'),
    leaves: get('Leaves'),
    showLeaves: get('Show Leaves'),
    leafRadius: get('Leaf Radius'),
    maxWeight: get('Max Weight'),
    minWeight: get('Min Weight'),
    thiccCenter: get('Thicc Center'),
    falloff: get('Thiccness Falloff'),
    wat: get('wat'),
    leafMode: get('Leaf Mode'),
    shapeWidth: get('Width'),
  })

  let tree: Tree
  let origin: Vector
  let minSize: number
  let lastDrawnBranch: number

  function initialize() {
    s.clear()
    const center = getCenter()
    origin = new Vector(center.x, center.y)
    minSize = getBoundedSize()
    const {
      branchLength,
      leaves: numLeaves,
      leafRadius,
      wat,
      leafMode,
      shapeWidth,
    } = getProps()
    tree = new Tree({
      origin,
      numLeaves,
      branchLength,
      minDist: leafRadius,
      wat,
      leafMode,
      shapeWidth,
    })
    lastDrawnBranch = 0
  }

  function drawTree(tree) {
    const props = getProps()
    const r = Math.max(2, props.leafRadius * 0.6)
    const display = tree.displayInfo()
    if (props.showLeaves) {
      s.clear()
      display.leaves.forEach(({ x, y }) => {
        s.circle(x, y, r)
      })
    }

    s.push()
    display.branches.forEach(([p1, p2], i: number) => {
      if (i < lastDrawnBranch && !props.showLeaves) return
      lastDrawnBranch = i
      const dist = distance(origin, p1)
      const weight = interpolate(
        [-0.00001, minSize / (props.falloff * 2)],
        props.thiccCenter
          ? [props.maxWeight, props.minWeight]
          : [props.minWeight, props.maxWeight],
        dist
      )
      const hue = Math.floor(interpolate([0, minSize], [270, 340], dist))
      const sat = Math.floor(interpolate([0, minSize], [92, 100], dist))
      const bri = Math.floor(interpolate([0, minSize], [95, 100], dist))
      s.stroke([hue, sat, bri])
      s.strokeWeight(weight)
      s.line(p1.x, p1.y, p2.x, p2.y)
    })
    s.pop()
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.colorMode(s.HSB)
    initialize()
  }

  s.draw = () => {
    // s.clear()
    tree.grow()
    drawTree(tree)
  }
}
