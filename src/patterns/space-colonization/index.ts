import { Vector } from 'p5'
import { init as initProps, getProp } from 'utils/propConfig'
import Tree, { LeafMode } from 'utils/space-colonization/tree'
import { distance, Point, interpolate } from 'utils/math'
import { getBoundedSize } from 'utils/window'

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
  wavy: boolean
  waviness: number
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
    Wavy: {
      type: 'boolean',
    },
    Waviness: {
      type: 'number',
      default: 300,
      min: 0,
      step: 5,
      when: () => !!get('Wavy'),
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
    wavy: get('Wavy'),
    waviness: get('Waviness'),
  })

  let tree: Tree
  let origin: Vector
  let minSize: number
  let lastDrawnBranch: number
  let zoom: number

  function initialize() {
    s.clear()
    zoom = 1000
    origin = new Vector(0, 0)
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
      centerOrigin: true,
    })
    lastDrawnBranch = 0
  }

  function drawTree(tree) {
    const {
      leafRadius,
      showLeaves,
      wavy,
      waviness,
      falloff,
      thiccCenter,
      minWeight,
      maxWeight,
    } = getProps()
    const r = Math.max(2, leafRadius * 0.6)
    const display = tree.displayInfo()
    if (showLeaves) {
      s.clear()
      display.leaves.forEach(({ x, y }) => {
        s.circle(x, y, r)
      })
    }

    s.push()
    const noiseDamp = 0.005
    const noise = (p: Point) =>
      s.noise(
        (p.x - window.innerWidth / 2) *
          noiseDamp *
          Math.sin(s.frameCount / 100),
        (p.y - window.innerHeight / 2) * noiseDamp * Math.cos(s.frameCount / 80)
      ) * waviness
    display.branches.forEach(([p1, p2], i: number) => {
      if (!wavy && !showLeaves && i < lastDrawnBranch) return
      lastDrawnBranch = i
      const dist = distance(origin, p1)
      const weight = interpolate(
        [-0.00001, minSize / (falloff * 2)],
        thiccCenter ? [maxWeight, minWeight] : [minWeight, maxWeight],
        dist
      )
      const hue = Math.floor(interpolate([0, minSize], [270, 340], dist))
      const sat = Math.floor(interpolate([0, minSize], [92, 100], dist))
      const bri = Math.floor(interpolate([0, minSize], [95, 100], dist))
      s.stroke([hue, sat, bri])
      s.strokeWeight(weight)

      if (wavy) {
        const z1 = noise(p1)
        const z2 = noise(p2)
        s.line(p1.x, p1.y, z1, p2.x, p2.y, z2)
      } else {
        s.line(p1.x, p1.y, p2.x, p2.y)
      }
    })
    s.pop()
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
    s.colorMode(s.HSB)
    initialize()
  }

  s.draw = () => {
    const { wavy } = getProps()
    if (wavy) {
      s.clear()
      s.camera(0, 0, zoom, 0, 0, 0, 0, 1, 0)
      s.rotateY(interpolate([0, window.innerWidth], [0, Math.PI * 2], s.mouseX))
      s.rotateX(
        interpolate([0, window.innerHeight], [0, Math.PI * 2], s.mouseY)
      )
    }
    tree.grow()
    drawTree(tree)
  }

  s.mouseWheel = (e) => {
    zoom += e.delta / 8
  }
}
