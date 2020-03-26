import {
  interpolate,
  distance,
  thetaFromTwoPoints,
  thetaFromTwoPoints3d,
} from 'utils/math'
import { init as initProps, getProp } from 'utils/propConfig'

export default (s) => {
  const get = (prop) => getProp('coral3d', prop)
  const getProps = () => ({
    damp: get('damp'),
    preferredProximity: get('preferredProximity'),
    maxNodes: get('maxNodes'),
    nodeChangeTimer: get('nodeChangeTimer'),
    collisionBuffer: get('collisionBuffer'),
    collisionAvoidanceForce: get('collisionAvoidanceForce'),
    foldiness: get('foldiness'),
    stretchiness: get('stretchiness'),
    randomMode: get('randomMode'),
  })

  class Node {
    constructor(x, y, z) {
      this.position = s.createVector(x, y, z)
      this.velocity = s.createVector()
      this.acceleration = s.createVector()
    }

    move() {
      this.velocity.add(this.acceleration)
      this.position.add(this.velocity)
    }
  }

  class Coral {
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
        x: 0,
        y: 0,
        z: 0,
      }

      const arr = []
      const initialResolution = 3
      for (let i = 0; i < initialResolution; i++) {
        const theta = interpolate([0, initialResolution], [0, Math.PI * 2], i)
        const x = Math.sin(theta) * 30 + center.x
        const y = Math.cos(theta) * 30 + center.y
        arr.push(new Node(x, y, (Math.random() - 0.5) * 20))
      }
      this.nodes = arr.reverse()
    }

    insertNode(_position) {
      const { nodes } = this
      const p1 = _position % nodes.length
      const p2 = p1 === nodes.length - 1 ? 0 : p1 + 1
      const n1 = nodes[p1].position
      const n2 = nodes[p2].position

      const avgX = (n1.x + n2.x) / 2
      const avgY = (n1.y + n2.y) / 2
      const avgZ = (n1.z + n2.z) / 2

      nodes.splice(p2, 0, new Node(avgX, avgY, avgZ))
    }

    removeNode(position) {
      this.nodes.splice(position, 1)
    }

    mutate(props) {
      const { nodes } = this
      nodes.forEach((node) => {
        if (props.randomMode) {
          node.acceleration = s.createVector()
        } else {
          node.velocity = s.createVector()
        }
      })
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i].position
        const { acceleration, velocity } = nodes[i]
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue

          const n2 = nodes[j].position

          const d12 = distance(n1, n2)
          const { phi, theta } = thetaFromTwoPoints3d(n1, n2)

          if (this.isWithinRange(i, j, 1)) {
            // immediate neighbor, attract!
            const delta = d12 - props.preferredProximity
            const strength = (d12 * delta) / (props.damp * 1000)
            const xAccel = Math.cos(phi) * strength
            const yAccel = Math.sin(phi) * strength
            const zAccel = Math.sin(theta) * strength

            // const testX     =
            ;(props.randomMode ? acceleration : velocity).add(
              s.createVector(xAccel, yAccel, zAccel)
            )
          } else if (this.isWithinRange(i, j, props.stretchiness)) {
            // within a certain range but not an immediate neighbor, repel!
            const strength = -props.foldiness / d12
            const xAccel = Math.cos(phi) * strength
            const yAccel = Math.sin(phi) * strength
            const zAccel = Math.sin(theta) * strength
            ;(props.randomMode ? acceleration : velocity).add(
              s.createVector(xAccel, yAccel, zAccel)
            )
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
                  // z: (n2.z + n3.z) / 2,
                }
                const collisionPushDir = thetaFromTwoPoints(midpoint, n1)
                const pushAccelX = cos(collisionPushDir.phi) * collisionPushStr
                const pushAccelY = sin(collisionPushDir.phi) * collisionPushStr
                // const pushAccelZ = sin(collisionPushDir.theta) * collisionPushStr
                ;(props.randomMode ? acceleration : velocity).add(
                  s.createVector(pushAccelX, pushAccelY, 0)
                )
              }
            }
          }
        }
      }

      nodes.forEach((node) => node.move(props))
    }

    isWithinRange(i, j, range) {
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

    draw() {
      const { nodes } = this
      s.stroke(255, 255, 255)
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i].position
        const n2 = nodes[i === nodes.length - 1 ? 0 : i + 1].position
        s.line(n1.x, n1.y, n1.z, n2.x, n2.y, n2.z)
      }
    }
  }

  initProps('coral3d', {
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
      default: 300,
      min: 3,
      step: 10,
    },
    nodeChangeTimer: {
      type: 'number',
      default: 20,
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
      default: 20,
      min: 2,
      step: 1,
    },
    randomMode: {
      type: 'boolean',
      default: false,
    },
  })

  let coral
  let isPaused

  function initialize() {
    coral = new Coral()
    isPaused = false
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
    window.addEventListener('keydown', function (e) {
      if (e.code === 'Space') {
        isPaused = !isPaused
      }
    })
    initialize()
  }

  s.draw = () => {
    if (isPaused) return
    s.clear()
    const props = getProps()
    s.rotateY(s.frameCount * 0.005)
    s.rotateX(s.frameCount * 0.0025)
    s.rotateZ(s.frameCount * 0.002)
    coral.mutate(props)
    coral.draw(props)
  }
}
