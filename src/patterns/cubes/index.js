import { interpolate, distance, thetaFromTwoPoints } from 'utils/math'
import { init as initProps, getProp } from 'utils/propConfig'

export default s => {
  const get = prop => getProp('cubes', prop)
  const getProps = () => ({})

  class Cube {
    constructor(props) {
      const { size } = props
      const min = - size / 2
      const max = size / 2
      this.points = [
        { x: min, y: min, z: min },
        { x: min, y: min, z: max },
        { x: min, y: max, z: max },
        { x: max, y: max, z: max },
        { x: max, y: min, z: max },
        { x: max, y: min, z: min },
        { x: max, y: max, z: min },
        { x: min, y: max, z: min },
        { x: min, y: min, z: min },
      ]
      this.props = {
        ...props,
      }
    }

    draw() {
      s.stroke(255, 255, 255)
      s.strokeWeight(3)
      s.push()
      s.translate(
        this.props.initialPoint.x,
        this.props.initialPoint.y,
        this.props.initialPoint.z
      )
      const rate = s.frameCount * this.props.rotationRate

      s.rotateX(rate)
      s.rotateY(rate)

      for (let i = 1; i < this.points.length; i++) {
        const p1 = this.points[i - 1]
        const p2 = this.points[i]
        s.line(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z)
      }
      s.pop()
    }
  }

  class Cubes {
    constructor(props) {
      this.props = {
        ...props
      }
      const { n, distance, cubeSize, baseRate, increaseRate } = this.props
      const offset = (distance * n / 2)
      this.cubes = []

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const order = r + c
          this.cubes.push(
            new Cube({
              size: cubeSize,
              initialPoint: {
                x: r * distance - offset,
                y: c * distance - offset,
                z: -offset,
              },
              rotationRate: baseRate + order * increaseRate,
            })
          )
        }
      }
    }

    draw() {
      this.cubes.forEach(cube => cube.draw())
    }
  }

  initProps('cubes', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
  })

  let cubes
  function initialize() {
    cubes = new Cubes({
      distance: 125,
      cubeSize: 100,
      n: 6,
      baseRate: 0.0075,
      increaseRate: 0.0005
    })
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
    initialize()
  }

  s.draw = () => {
    s.clear()
    const props = getProps()
    cubes.draw(props)
  }
}
