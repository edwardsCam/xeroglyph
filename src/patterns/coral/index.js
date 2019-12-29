import { interpolate, distance, thetaFromTwoPoints, clamp } from 'utils/math'
import { init as initProps, getProp } from 'utils/propConfig'

export default s => {
  class Node {
    constructor(x, y) {
      this.position = s.createVector(x, y)
      this.velocity = s.createVector(0, 0)
      this.acceleration = s.createVector(0, 0)
    }

    move(props) {
      const { maxVelocity } = props
      this.velocity.x = clamp(-maxVelocity, maxVelocity, this.velocity.x)
      this.velocity.y = clamp(-maxVelocity, maxVelocity, this.velocity.y)
      this.position.add(this.velocity)
    }
  }

  class Coral {
    constructor(props) {
      this.createNodes(props)

      let cnt = 0
      const interval = setInterval(() => {
        this.insertNode(Math.floor(Math.random() * this.nodes.length - 1))
        if (cnt++ > 300) {
          clearTimeout(interval)
        }
      }, 100)
    }

    createNodes(props) {
      const { resolution, radius } = props
      this.nodes = []

      const center = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }

      const arr = []
      for (let i = 0; i < resolution; i++) {
        const theta = interpolate([0, resolution], [0, Math.PI * 2], i)
        const x = Math.sin(theta) * radius + center.x
        const y = Math.cos(theta) * radius + center.y
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
      nodes.forEach(node => (node.velocity = s.createVector(0, 0)))
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue
          const otherNode = nodes[j]

          // s.line(n.position.x, n.position.y, otherNode.position.x, otherNode.position.y)

          const d = distance(n.position, otherNode.position)
          const theta = thetaFromTwoPoints(n.position, otherNode.position)

          let strength = 0
          if (this.isWithinRange(i, j, 1)) {
            const delta = d - props.preferredProximity
            strength = (d * delta) / (props.damp * 1000)
          } else if (this.isWithinRange(i, j, 3)) {
            strength = -0.3 / d
          }
          const xAccel = Math.cos(theta) * strength
          const yAccel = Math.sin(theta) * strength
          n.velocity.add(s.createVector(xAccel, yAccel))
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

    draw(/* props */) {
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
    resolution: {
      type: 'number',
      default: 100,
      min: 2,
      step: 1,
    },
    radius: {
      type: 'number',
      default: 200,
      min: 1,
      step: 1,
    },
    damp: {
      type: 'number',
      default: 1,
      min: 1,
      step: 1,
    },
    preferredProximity: {
      type: 'number',
      default: 3,
      min: 1,
      step: 1,
    },
    maxVelocity: {
      type: 'number',
      default: 5,
      min: 0.2,
      step: 0.2,
    },
  })

  const get = prop => getProp('coral', prop)
  const getProps = () => ({
    resolution: get('resolution'),
    radius: get('radius'),
    damp: get('damp'),
    preferredProximity: get('preferredProximity'),
    maxVelocity: get('maxVelocity'),
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
