import { interpolate } from 'utils/math'
import { init as initProps, getProp } from 'utils/propConfig'
import pushpop from 'utils/pushpop'

type Props = {
  n: number
  distance: number
  cubeSize: number
  baseRate: number
  increaseRate: number
  linesPerCube: number
}

type CubeProps = {
  r: number
  c: number
  size: number
  initialPoint: Point
  rotationRate: number
  numLines: number
}

export default (s) => {
  const get = (prop: string) => getProp('cubes', prop)
  const getProps = (): Props => ({
    n: get('Cube Count'),
    distance: get('Distance'),
    cubeSize: get('Cube Size'),
    baseRate: get('Base Rotation Rate'),
    increaseRate: get('Rotation Acceleration'),
    linesPerCube: get('Lines per cube'),
  })

  class Cube {
    points: Point[]
    props: CubeProps
    constructor(props: CubeProps) {
      const { size, numLines } = props
      const min = -size / 2
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
        { x: max, y: min, z: min },

        { x: max, y: min, z: max }, // skip

        { x: min, y: min, z: max },

        { x: min, y: max, z: max }, // skip

        { x: min, y: max, z: min },

        { x: max, y: max, z: min }, // skip

        { x: max, y: max, z: max },
      ].filter((_p, i) => i < numLines + 1)
      this.props = {
        ...props,
      }
    }

    draw({ n }: Props) {
      const { r, c, initialPoint, rotationRate } = this.props
      s.stroke(
        interpolate([0, n], [0, 255], r),
        interpolate([0, n], [0, 255], c),
        255
      )
      s.strokeWeight(3)
      pushpop(s, () => {
        s.translate(initialPoint.x, initialPoint.y, initialPoint.z)
        const rate = s.frameCount * rotationRate
        s.rotateX(rate)
        s.rotateY(rate)

        for (let i = 1; i < this.points.length; i++) {
          const p1 = this.points[i - 1]
          const p2 = this.points[i]
          s.line(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z)
        }
      })
    }
  }

  class Cubes {
    cubes: Cube[]
    constructor(props: Props) {
      const { n, distance, cubeSize, baseRate, increaseRate, linesPerCube } =
        props
      const offset = (distance * n) / 2
      this.cubes = []

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const order = r + c
          this.cubes.push(
            new Cube({
              r,
              c,
              size: cubeSize,
              initialPoint: {
                x: r * distance - offset,
                y: c * distance - offset,
                z: -offset,
              },
              rotationRate: baseRate + order * increaseRate,
              numLines: linesPerCube,
            })
          )
        }
      }
    }

    draw(props: Props) {
      this.cubes.forEach((cube) => cube.draw(props))
    }
  }

  initProps('cubes', {
    'Cube Count': {
      type: 'number',
      default: 5,
      min: 1,
      onChange: initialize,
    },
    Distance: {
      type: 'number',
      default: 100,
      min: 1,
      onChange: initialize,
    },
    'Cube Size': {
      type: 'number',
      default: 80,
      min: 1,
      onChange: initialize,
    },
    'Base Rotation Rate': {
      type: 'number',
      default: 0.001,
      min: 0,
      step: 0.0005,
      onChange: initialize,
    },
    'Rotation Acceleration': {
      type: 'number',
      default: 0.0002,
      min: 0,
      step: 0.00001,
      onChange: initialize,
    },
    'Lines per cube': {
      type: 'number',
      default: 8,
      min: 1,
      onChange: initialize,
    },
  })

  let cubes: Cubes
  function initialize() {
    cubes = new Cubes(getProps())
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
