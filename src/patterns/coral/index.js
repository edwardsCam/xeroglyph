import { interpolate, distance, thetaFromTwoPoints } from 'utils/math'
import { init as initProps, getProp } from 'utils/propConfig'

export default s => {
  class Node {
    constructor(x, y) {
      this.position = s.createVector(x, y)
      this.velocity = s.createVector(0, 0)
      this.acceleration = s.createVector(0, 0)
    }

    move() {
      this.position.add(this.velocity)
    }
  }

  class Coral {
    constructor(props) {
      this.createNodes()

      const interval = setInterval(() => {
        if (this.nodes.length < props.maxNodes) {
          this.insertNode(Math.floor(Math.random() * this.nodes.length))
        } else {
          clearTimeout(interval)
        }
      }, 40)
    }

    createNodes() {
      this.nodes = []

      const center = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }

      const arr = []
      const initialResolution = 3
      for (let i = 0; i < initialResolution; i++) {
        const theta = interpolate([0, initialResolution], [0, Math.PI * 2], i)
        const x = Math.sin(theta) * 30 + center.x
        const y = Math.cos(theta) * 30 + center.y
        arr.push(new Node(x, y))
      }
      this.nodes = arr.reverse()
    }

    insertNode(_position = 0) {
      const { nodes } = this
      const position = _position % nodes.length
      const nextPosition = position === nodes.length - 1 ? 0 : position + 1
      const n1 = nodes[position].position
      const n2 = nodes[nextPosition].position

      const avgX = (n1.x + n2.x) / 2
      const avgY = (n1.y + n2.y) / 2

      nodes.splice(nextPosition, 0, new Node(avgX, avgY))
    }

    mutate(props) {
      const { nodes } = this
      const len = nodes.length
      nodes.forEach(node => {
        node.velocity = s.createVector(0, 0)
      })
      for (let i = 0; i < len; i++) {
        const n1 = nodes[i]
        for (let j = 0; j < len; j++) {
          if (i === j) continue
          const n2 = nodes[j]

          const d12 = distance(n1.position, n2.position)
          const theta = thetaFromTwoPoints(n1.position, n2.position)

          let strength = 0
          if (this.isWithinRange(i, j, 1)) {
            const delta = d12 - props.preferredProximity
            strength = (d12 * delta) / (props.damp * 1000)
          } else if (this.isWithinRange(i, j, 3)) {
            strength = -props.foldiness / d12
          }
          const xAccel = Math.cos(theta) * strength
          const yAccel = Math.sin(theta) * strength
          n1.velocity.add(s.createVector(xAccel, yAccel))

          // avoid collisions
          const k = (j + 1) % len
          if (k !== i) {
            const n3 = nodes[k]

            const d13 = distance(n1.position, n3.position)
            const d23 = distance(n2.position, n3.position)

            const a12 = Math.acos(
              (d13 * d13 + d23 * d23 - d12 * d12) / (2 * d13 * d23)
            )
            const a13 = Math.acos(
              (d23 * d23 + d12 * d12 - d13 * d13) / (2 * d12 * d23)
            )

            if (a13 > Math.PI / 2 || a12 > Math.PI / 2) {
              // obtuse by n1, no danger of collision in this triangle
            } else {
              const area = (d13 * d23 * Math.sin(a12)) / 2
              const height = (2 * area) / d23
              if (height < props.collisionBuffer) {
                const collisionDelta = props.collisionBuffer - height
                const collisionPushStrength = Math.min(
                  props.collisionAvoidanceForce,
                  collisionDelta / height
                )

                const midpoint = {
                  x: (n2.position.x + n3.position.x) / 2,
                  y: (n2.position.y + n3.position.y) / 2,
                }
                const collisionPushDirection = thetaFromTwoPoints(
                  n1.position,
                  midpoint
                )
                const pushAccelX =
                  -Math.cos(collisionPushDirection) * collisionPushStrength
                const pushAccelY =
                  -Math.sin(collisionPushDirection) * collisionPushStrength
                n1.velocity.add(s.createVector(pushAccelX, pushAccelY))
              }
            }
          }
        }
      }

      nodes.forEach(node => node.move(props))
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
        s.line(n1.x, n1.y, n2.x, n2.y)
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
      default: 1,
      min: 1,
      step: 1,
    },
    preferredProximity: {
      type: 'number',
      default: 1,
      min: 1,
      step: 1,
    },
    maxNodes: {
      type: 'number',
      default: 300,
      min: 3,
      step: 1,
    },
    collisionBuffer: {
      type: 'number',
      default: 60,
      min: 1,
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
      default: 2,
      min: 0.2,
      step: 0.2,
    },
  })

  const get = prop => getProp('coral', prop)
  const getProps = () => ({
    damp: get('damp'),
    preferredProximity: get('preferredProximity'),
    maxNodes: get('maxNodes'),
    collisionBuffer: get('collisionBuffer'),
    collisionAvoidanceForce: get('collisionAvoidanceForce'),
    foldiness: get('foldiness'),
  })

  let coral
  let isPaused

  function initialize() {
    const props = getProps()
    coral = new Coral(props)
    isPaused = false
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    window.addEventListener('keydown', function(e) {
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
    coral.mutate(props)
    coral.draw(props)
  }
}
