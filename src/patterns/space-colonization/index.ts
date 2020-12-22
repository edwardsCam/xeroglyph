import { Vector } from 'p5'
import { init as initProps, getProp } from 'utils/propConfig.ts'
import Tree from 'utils/space-colonization/tree'
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
      default: 15,
      min: 2,
    },
    'Leaf Radius': {
      type: 'number',
      default: 10,
      min: 5,
    },
    Leaves: {
      type: 'number',
      default: 1000,
      step: 10,
      min: 10,
    },
    'Max Weight': {
      type: 'number',
      default: 5,
      step: 0.2,
      min: 1,
    },
    'Min Weight': {
      type: 'number',
      default: 1,
      step: 0.2,
      min: 1,
    },
    'Thicc Center': {
      type: 'boolean',
      default: false,
    },
    'Thiccness Falloff': {
      type: 'number',
      default: 0.5,
      step: 0.05,
      min: 0,
      max: 1,
    },
    'Show Leaves': {
      type: 'boolean',
      default: false,
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
  })

  let tree: Tree
  let origin: Vector
  let minSize: number

  function initialize() {
    s.clear()
    const center = getCenter()
    origin = new Vector(center.x, center.y)
    minSize = getBoundedSize()
    const { branchLength, leaves: numLeaves, leafRadius } = getProps()
    tree = new Tree({ origin, numLeaves, branchLength, minDist: leafRadius })
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  s.draw = () => {
    const props = getProps()
    s.clear()
    s.stroke('white')
    tree.grow()

    const display = tree.displayInfo()
    // debugger;
    display.branches.forEach(([p1, p2]) => {
      const dist = distance(origin, p1)
      // console.info(props.falloff)
      const weight = interpolate(
        [-0.00001, minSize / (props.falloff * 2)],
        props.thiccCenter
          ? [props.maxWeight, props.minWeight]
          : [props.minWeight, props.maxWeight],
        dist
      )
      s.strokeWeight(weight)
      s.line(p1.x, p1.y, p2.x, p2.y)
    })
    if (props.showLeaves) {
      display.leaves.forEach((leaf) => s.circle(leaf.x, leaf.y, 5))
    }
  }
}
