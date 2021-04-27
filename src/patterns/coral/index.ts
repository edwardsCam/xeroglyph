import {
  interpolate,
  distance,
  thetaFromTwoPoints_old,
  randomInRange,
} from 'utils/math'
import { init as initProps, getProp } from 'utils/propConfig'

const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight

type Props = {
  damp: number
  preferredProximity: number
  maxNodes: number
  nodeChangeTimer: number
  collisionBuffer: number
  collisionAvoidanceForce: number
  foldiness: number
  stretchiness: number
  electric: boolean
  strokeWeight: number
}

type Vector = { x: number; y: number; add: (v: Vector) => any }

export default (s) => {
  const get = (prop: string) => getProp('coral', prop)
  const getProps = (): Props => ({
    damp: get('damp'),
    preferredProximity: get('preferredProximity'),
    maxNodes: get('maxNodes'),
    nodeChangeTimer: get('nodeChangeTimer'),
    collisionBuffer: get('collisionBuffer'),
    collisionAvoidanceForce: get('collisionAvoidanceForce'),
    foldiness: get('foldiness'),
    stretchiness: get('stretchiness'),
    electric: get('electric'),
    strokeWeight: get('stroke weight'),
  })

  class Node {
    position: Vector
    velocity: Vector
    acceleration: Vector

    constructor(x: number, y: number) {
      this.position = s.createVector(x, y)
      this.velocity = s.createVector()
      this.acceleration = s.createVector()
    }

    move() {
      this.velocity.add(this.acceleration)
      this.position.add(this.velocity)
    }
  }

  class Coral {
    nodes: Node[] = []

    constructor() {
      this.createNodes()
      this.checkNodeCount()
    }

    checkNodeCount() {
      const maxNodes = get('maxNodes')
      const { length } = this.nodes
      if (length < maxNodes) {
        this.insertNode(Math.floor(Math.random() * length))
      } else if (length > maxNodes) {
        this.removeNode(Math.floor(Math.random() * length))
      }
      setTimeout(() => this.checkNodeCount(), get('nodeChangeTimer'))
    }

    createNodes() {
      this.nodes = []

      const center = {
        x: WIDTH / 2,
        y: HEIGHT / 2,
      }

      const arr: Node[] = []
      const initialResolution = 3
      for (let i = 0; i < initialResolution; i++) {
        const theta = interpolate([0, initialResolution], [0, Math.PI * 2], i)
        const x = Math.sin(theta) * 30 + center.x
        const y = Math.cos(theta) * 30 + center.y
        arr.push(new Node(x, y))
      }
      this.nodes = arr.reverse()
    }

    insertNode(_position: number) {
      const { nodes } = this
      const p1 = _position % nodes.length
      const p2 = p1 === nodes.length - 1 ? 0 : p1 + 1
      const n1 = nodes[p1].position
      const n2 = nodes[p2].position

      const avgX = (n1.x + n2.x) / 2
      const avgY = (n1.y + n2.y) / 2

      nodes.splice(p2, 0, new Node(avgX, avgY))
    }

    removeNode(position) {
      this.nodes.splice(position, 1)
    }

    mutate(props) {
      const { nodes } = this
      nodes.forEach((node) => {
        node.velocity = s.createVector()
      })
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i].position
        const { velocity } = nodes[i]
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue
          const n2 = nodes[j].position
          const d12 = distance(n1, n2)
          const theta = thetaFromTwoPoints_old(n1, n2)

          if (this.isWithinRange(i, j, 1)) {
            // immediate neighbor, attract!
            const delta = d12 - props.preferredProximity
            const strength = (d12 * delta) / (props.damp * 1000)
            const xAccel = Math.cos(theta) * strength
            const yAccel = Math.sin(theta) * strength
            velocity.add(s.createVector(xAccel, yAccel))
          } else if (this.isWithinRange(i, j, props.stretchiness)) {
            // within a certain range but not an immediate neighbor, repel!
            const strength = -props.foldiness / d12
            const xAccel = Math.cos(theta) * strength
            const yAccel = Math.sin(theta) * strength
            velocity.add(s.createVector(xAccel, yAccel))
          }

          // avoid collisions
          const k = (j + 1) % nodes.length
          if (k !== i) {
            const n3 = nodes[k].position
            const d13 = distance(n1, n3)
            const d23 = distance(n2, n3)
            const d12Squar = d12 * d12
            const d13Squar = d13 * d13
            const d23Squar = d23 * d23

            const a12 = Math.acos(
              (d13Squar + d23Squar - d12Squar) / (2 * d13 * d23)
            )
            const a13 = Math.acos(
              (d23Squar + d12Squar - d13Squar) / (2 * d12 * d23)
            )

            if (a13 > Math.PI / 2 || a12 > Math.PI / 2) {
              // obtuse by n1, no danger of collision in this triangle
            } else {
              const { sin, cos } = Math
              const height = d13 * sin(a12)
              if (height < props.collisionBuffer * 1.1) {
                const collisionPushStr = Math.min(
                  props.collisionAvoidanceForce,
                  (props.collisionBuffer - height) / height
                )

                const midpoint = {
                  x: (n2.x + n3.x) / 2,
                  y: (n2.y + n3.y) / 2,
                }
                const collisionPushDir = thetaFromTwoPoints_old(midpoint, n1)
                const pushAccelX = cos(collisionPushDir) * collisionPushStr
                const pushAccelY = sin(collisionPushDir) * collisionPushStr
                velocity.add(s.createVector(pushAccelX, pushAccelY))
              }
            }
          }
        }
      }

      nodes.forEach((node) => node.move())
    }

    isWithinRange(i: number, j: number, range: number) {
      const len = this.nodes.length
      let min = i - range
      let underflow = false
      while (min < 0) {
        underflow = true
        min += len
      }
      min %= len

      let max = i + range
      let overflow = false
      if (max >= len) {
        overflow = true
        max %= len
      }
      if (underflow || overflow) {
        return j >= min || j <= max
      }
      return j >= min && j <= max
    }

    draw(props: Props) {
      const { nodes } = this
      if (nodes.length < 2) return

      const drawShape = (
        randomness: number,
        weight: number,
        alpha: number,
        skip = 0
      ) => {
        s.push()
        s.strokeWeight(weight)
        s.stroke(
          randomInRange(40, 55, true),
          randomInRange(18, 22, true),
          100,
          alpha
        )
        s.beginShape()
        nodes.forEach((n) => {
          const { x, y } = n.position
          if (Math.random() < skip) return
          if (randomness) {
            s.curveVertex(
              x + randomInRange(-randomness, randomness),
              y + randomInRange(-randomness, randomness)
            )
          } else {
            s.curveVertex(x, y)
          }
        })
        s.endShape(s.CLOSE)
        s.pop()
      }

      s.fill(50, 100, 20, 80)
      drawShape(0, props.strokeWeight, 90)
      s.noFill()

      if (props.electric) {
        drawShape(5, 2.5, 50)
        drawShape(5, 2, 30)
        drawShape(5, 1.5, 60)
        drawShape(10, 1, 30)
        drawShape(10, 1, 20, 0.1)
        drawShape(10, 1, 20, 0.1)
      }
    }
  }

  initProps('coral', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    damp: {
      type: 'number',
      default: 0.3,
      min: 0.1,
      step: 0.1,
    },
    preferredProximity: {
      type: 'number',
      default: 1,
      min: 0.1,
      step: 0.1,
    },
    maxNodes: {
      type: 'number',
      default: 500,
      min: 3,
      step: 10,
    },
    nodeChangeTimer: {
      type: 'number',
      default: 15,
      min: 5,
      step: 5,
    },
    collisionBuffer: {
      type: 'number',
      default: 50,
      min: 0,
      step: 5,
    },
    collisionAvoidanceForce: {
      type: 'number',
      default: 1.6,
      min: 0.05,
      step: 0.025,
    },
    foldiness: {
      type: 'number',
      default: 1,
      min: 0.2,
      step: 0.2,
    },
    stretchiness: {
      type: 'number',
      default: 12,
      min: 2,
      step: 1,
    },
    'stroke weight': {
      type: 'number',
      default: 3,
      min: 0,
      step: 0.1,
    },
    electric: {
      type: 'boolean',
      default: false,
    },
  })

  let coral: Coral
  let isPaused: boolean

  function initialize() {
    coral = new Coral()
    isPaused = false
  }

  s.setup = () => {
    s.createCanvas(WIDTH, HEIGHT)
    window.addEventListener('keydown', function (e) {
      if (e.code === 'Space') {
        isPaused = !isPaused
      }
    })
    s.colorMode(s.HSB, 100)
    s.stroke(255, 255, 255)
    s.noFill()
    initialize()
  }

  s.draw = () => {
    if (isPaused) return
    s.clear()
    const props = getProps()
    coral.mutate(props)
    coral.draw(props)
  }
}
