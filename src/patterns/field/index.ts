import { init as initProps, getProp, setProp } from 'utils/propConfig.ts'
import {
  Point,
  coordWithAngleAndDistance,
  distance,
  interpolate,
  getIntersectionPoint,
  equalWithinEpsilon,
  getDirection,
} from 'utils/math.ts'

import SimplexNoise from 'simplex-noise'

const epsilon = 0.0001

type DrawMode = 'arrows' | 'streams' | 'dots'
type ConstraintMode = 'none' | 'circle'

type Props = {
  n: number
  noise: number
  distortion: number
  alpha: number
  density: number
  rainbow: boolean
  lineLength: number
  drawMode: DrawMode
  noiseMode: 'perlin' | 'simplex'
  constraintMode: ConstraintMode
  constraintRadius: number
}

export default (s) => {
  initProps('field', {
    n: {
      type: 'number',
      default: 25,
      min: 3,
    },
    lineLength: {
      type: 'number',
      default: 20,
      min: 1,
      when: () => get('drawMode') !== 'streams',
    },
    noise: {
      type: 'number',
      default: 0.35,
      min: 0,
      step: 0.0005,
    },
    distortion: {
      type: 'number',
      default: 0,
      min: 0,
      step: Math.PI / 128,
    },
    density: {
      type: 'number',
      default: 0.8,
      min: 0,
      max: 1,
      step: 0.025,
    },
    rainbow: {
      type: 'boolean',
    },
    alpha: {
      type: 'number',
      default: 0.4,
      min: 0,
      max: 1,
      step: 0.01,
    },
    drawMode: {
      type: 'dropdown',
      default: 'streams',
      options: ['arrows', 'streams', 'dots'],
    },
    noiseMode: {
      type: 'dropdown',
      default: 'perlin',
      options: ['perlin', 'simplex'],
    },
    constraintMode: {
      type: 'dropdown',
      default: 'none',
      options: ['none', 'circle'],
    },
    constraintRadius: {
      type: 'number',
      default: 100,
      min: 1,
      when: () => get('constraintMode') === 'circle',
    },
  })
  const get = (prop: string) => getProp('field', prop)
  const getProps = (): Props => ({
    n: get('n'),
    lineLength: get('lineLength'),
    noise: get('noise'),
    rainbow: get('rainbow'),
    alpha: get('alpha'),
    density: get('density'),
    drawMode: get('drawMode'),
    noiseMode: get('noiseMode'),
    distortion: get('distortion'),
    constraintMode: get('constraintMode'),
    constraintRadius: get('constraintRadius'),
  })

  let grid: number[][]

  function generateField() {
    grid = []
    const { n, noise, noiseMode, distortion } = getProps()
    let noiseFn
    if (noiseMode === 'perlin') {
      noiseFn = s.noise
    } else {
      const simplex = new SimplexNoise()
      noiseFn = (x, y) => simplex.noise2D(x, y)
    }
    for (let r = 0; r < n; r++) {
      grid.push([])
      const scaled_y = r * noise
      for (let c = 0; c < n; c++) {
        const scaled_x = c * noise
        const noise_val = noiseFn(scaled_x, scaled_y)
        const angle = s.map(noise_val, 0, 1, 0, Math.PI * 2)
        const distortedAngle =
          distortion == 0 ? angle : distortion * Math.floor(angle / distortion)
        grid[r].push(distortedAngle)
      }
    }
  }

  const drawArrow = (
    start: Point,
    angle: number,
    length: number,
    withTip?: boolean
  ) => {
    const p2 = coordWithAngleAndDistance(start, angle, length)
    s.line(start.x, start.y, p2.x, p2.y)

    if (withTip) {
      const tip1 = coordWithAngleAndDistance(
        p2,
        (angle + (Math.PI * 3) / 4) % (Math.PI * 2),
        length / 3
      )
      const tip2 = coordWithAngleAndDistance(
        p2,
        (angle - (Math.PI * 3) / 4) % (Math.PI * 2),
        length / 3
      )
      s.line(p2.x, p2.y, tip1.x, tip1.y)
      s.line(p2.x, p2.y, tip2.x, tip2.y)
    }
  }

  const getPoint = (
    n: number,
    center: Point,
    totalLength: number,
    squareLen: number,
    r: number,
    c: number
  ): Point => ({
    x: interpolate(
      [0, n - 1],
      [center.x - totalLength / 2, center.x + totalLength / 2 - squareLen],
      c
    ),
    y: interpolate(
      [0, n - 1],
      [center.y - totalLength / 2, center.y + totalLength / 2 - squareLen],
      r
    ),
  })

  const inBoundsCircle = (p: Point, center: Point, maxDist: number): boolean =>
    distance(p, center) < maxDist

  const drawAsArrows = (
    n: number,
    center: Point,
    totalLength: number,
    lineLength: number
  ) => {
    const squareLen = totalLength / n
    grid.forEach((row, r) => {
      row.forEach((angle, c) => {
        const p: Point = getPoint(n, center, totalLength, squareLen, r, c)
        drawArrow(p, angle, lineLength, false)
      })
    })
  }

  const drawAsStreams = (props: Props, totalLength: number, center: Point) => {
    const {
      n,
      constraintMode,
      constraintRadius,
      rainbow,
      alpha,
      density,
    } = props
    const squareLen = totalLength / n

    if (constraintMode === 'circle') {
      s.noFill()
      s.strokeWeight(2)
      s.circle(center.x, center.y, constraintRadius * 2)
    }

    const lines: Point[][] = []

    grid.forEach((row, r) => {
      row.forEach((_angle, c) => {
        if (Math.random() > density) return

        const p = getPoint(n, center, totalLength, squareLen, r, c)
        lines.push([])
        if (constraintMode === 'circle') {
          if (!inBoundsCircle(p, center, constraintRadius)) return
        }
        let cnt = 0
        let curRow = r
        let curCol = c
        let angle = grid[r][c]
        const avgWithTop = () => {
          if (curRow <= 0) return
          const aboveAngle = grid[curRow - 1][curCol]
          angle = (angle + aboveAngle) / 2
          if (getDirection(angle).startsWith('n')) curRow--
        }
        const avgWithRight = () => {
          if (curCol >= n - 1) return
          const rightAngle = grid[curRow][curCol + 1]
          angle = (angle + rightAngle) / 2
          if (getDirection(angle).endsWith('e')) curCol++
        }
        const avgWithBot = () => {
          if (curRow >= n - 1) return
          const belowAngle = grid[curRow + 1][curCol]
          angle = (angle + belowAngle) / 2
          if (getDirection(angle).startsWith('s')) curRow++
        }
        const avgWithLeft = () => {
          if (curCol <= 0) return
          const leftAngle = grid[curRow][curCol - 1]
          angle = (angle + leftAngle) / 2
          if (getDirection(angle).endsWith('w')) curCol--
        }
        while (
          curRow >= 0 &&
          curRow < n &&
          curCol >= 0 &&
          curCol < n &&
          cnt++ < 100
        ) {
          if (rainbow) {
            const scaled = cnt * 0.01
            const [r, g, b] = [
              Math.floor(s.map(s.noise(scaled), 0, 1, 0, 255)),
              Math.floor(s.map(s.noise((scaled * p.x) / 100), 0, 1, 0, 255)),
              Math.floor(s.map(s.noise((scaled * p.y) / 100), 0, 1, 0, 255)),
            ]
            const color = `rgba(${r}, ${g}, ${b}, ${alpha})`
            s.stroke(color)
          }
          const dir = getDirection(angle)
          const topLeftCorner = getPoint(
            n,
            center,
            totalLength,
            squareLen,
            curRow,
            curCol
          )
          const topRightCorner: Point = {
            x: topLeftCorner.x + squareLen,
            y: topLeftCorner.y,
          }
          const botRightCorner: Point = {
            x: topLeftCorner.x + squareLen,
            y: topLeftCorner.y + squareLen,
          }
          const botLeftCorner: Point = {
            x: topLeftCorner.x,
            y: topLeftCorner.y + squareLen,
          }

          const topBorder: [Point, Point] = [topLeftCorner, topRightCorner]
          const rightBorder: [Point, Point] = [topRightCorner, botRightCorner]
          const botBorder: [Point, Point] = [botRightCorner, botLeftCorner]
          const leftBorder: [Point, Point] = [botLeftCorner, topLeftCorner]

          const onTop = equalWithinEpsilon(p.y, topLeftCorner.y, epsilon)
          const onRight = equalWithinEpsilon(p.x, topRightCorner.x, epsilon)
          const onBottom = equalWithinEpsilon(p.y, botLeftCorner.y, epsilon)
          const onLeft = equalWithinEpsilon(p.x, topLeftCorner.x, epsilon)
          const extension: [Point, Point] = [
            p,
            coordWithAngleAndDistance(p, angle, squareLen * 2),
          ]

          const tryCrossingTop = (): boolean => {
            const intersection = getIntersectionPoint(extension, topBorder)
            if (intersection) {
              lines[lines.length - 1].push(intersection)
              p.x = intersection.x
              p.y = intersection.y
              curRow--
              if (curRow >= 0) angle = grid[curRow][curCol]
              return true
            }
            return false
          }
          const tryCrossingRight = (): boolean => {
            const intersection = getIntersectionPoint(extension, rightBorder)
            if (intersection) {
              lines[lines.length - 1].push(intersection)
              p.x = intersection.x
              p.y = intersection.y
              curCol++
              if (curCol < n) angle = grid[curRow][curCol]
              return true
            }
            return false
          }
          const tryCrossingBot = (): boolean => {
            const intersection = getIntersectionPoint(extension, botBorder)
            if (intersection) {
              lines[lines.length - 1].push(intersection)
              p.x = intersection.x
              p.y = intersection.y
              curRow++
              if (curRow < n) angle = grid[curRow][curCol]
              return true
            }
            return false
          }
          const tryCrossingLeft = (): boolean => {
            const intersection = getIntersectionPoint(extension, leftBorder)
            if (intersection) {
              lines[lines.length - 1].push(intersection)
              p.x = intersection.x
              p.y = intersection.y
              curCol--
              if (curCol >= 0) angle = grid[curRow][curCol]
              return true
            }
            return false
          }
          const tryCrossingNE = () => tryCrossingTop() || tryCrossingRight()
          const tryCrossingNW = () => tryCrossingTop() || tryCrossingLeft()
          const tryCrossingSW = () => tryCrossingBot() || tryCrossingLeft()
          const tryCrossingSE = () => tryCrossingBot() || tryCrossingRight()

          if (onTop && onLeft) {
            if (dir == 'ne') {
              avgWithTop()
            } else if (dir == 'nw') {
              if (curCol <= 0 || curRow <= 0) return
              const topLeftAngle = grid[curRow - 1][curCol - 1]
              angle = (angle + topLeftAngle) / 2
              const newDir = getDirection(angle)
              if (newDir.endsWith('w')) curCol--
              if (newDir.startsWith('n')) curRow--
            } else if (dir == 'sw') {
              avgWithLeft()
            } else if (dir == 'se') {
              tryCrossingSE()
            }
          } else if (onTop && onRight) {
            if (dir == 'ne') {
              if (curCol >= n - 1 || curRow <= 0) return
              const topRightAngle = grid[curRow - 1][curCol + 1]
              angle = (angle + topRightAngle) / 2
              const newDir = getDirection(angle)
              if (newDir.endsWith('e')) curCol++
              if (newDir.startsWith('n')) curRow--
            } else if (dir == 'nw') {
              avgWithTop()
            } else if (dir == 'sw') {
              tryCrossingSW()
            } else if (dir == 'se') {
              avgWithRight()
            }
          } else if (onBottom && onRight) {
            if (dir == 'ne') {
              avgWithRight()
            } else if (dir == 'nw') {
              tryCrossingNW()
            } else if (dir == 'sw') {
              avgWithBot()
            } else if (dir == 'se') {
              if (curCol >= n - 1 || curRow >= n - 1) return
              const botRightAngle = grid[curRow + 1][curCol + 1]
              angle = (angle + botRightAngle) / 2
              const newDir = getDirection(angle)
              if (newDir.endsWith('e')) curCol++
              if (newDir.startsWith('s')) curRow++
            }
          } else if (onBottom && onLeft) {
            if (dir == 'ne') {
              tryCrossingNE()
            } else if (dir == 'nw') {
              avgWithLeft()
            } else if (dir == 'sw') {
              if (curCol <= 0 || curRow >= n - 1) return
              const botRightAngle = grid[curRow + 1][curCol - 1]
              angle = (angle + botRightAngle) / 2
              const newDir = getDirection(angle)
              if (newDir.endsWith('w')) curCol--
              if (newDir.startsWith('s')) curRow++
            } else if (dir == 'se') {
              avgWithBot()
            }
          } else if (onTop) {
            if (dir.startsWith('n')) {
              avgWithTop()
            } else if (dir == 'sw') {
              tryCrossingSW()
            } else if (dir == 'se') {
              tryCrossingSE()
            }
          } else if (onRight) {
            if (dir.endsWith('e')) {
              avgWithRight()
            } else if (dir === 'nw') {
              tryCrossingNW()
            } else if (dir === 'sw') {
              tryCrossingSW()
            }
          } else if (onBottom) {
            if (dir.startsWith('s')) {
              avgWithBot()
            } else if (dir == 'nw') {
              tryCrossingNW()
            } else if (dir == 'ne') {
              tryCrossingNE()
            }
          } else if (onLeft) {
            if (dir.endsWith('w')) {
              avgWithLeft()
            } else if (dir === 'ne') {
              tryCrossingNE()
            } else if (dir === 'se') {
              tryCrossingSE()
            }
          }
        }
      })
    })

    s.noFill()
    lines
      .filter((line) => line.length > 1)
      .forEach((line) => {
        s.beginShape()
        line.forEach((point) => s.vertex(point.x, point.y))
        s.endShape()
      })
  }

  const drawAsDots = (
    n: number,
    lineLength: number,
    density: number,
    center: Point,
    totalLength: number
  ) => {
    const minX = center.x - totalLength / 2
    const maxX = center.x + totalLength / 2
    const minY = center.y - totalLength / 2
    const maxY = center.y + totalLength / 2

    const squareLen = totalLength / n

    const tiles: number[][] = grid.map((row) => row.map(() => 0))
    let max = 0

    grid.forEach((row, r) => {
      row.forEach((_angle, c) => {
        if (Math.random() > density) return
        const p = getPoint(n, center, totalLength, squareLen, r, c)
        let cnt = 0
        const marked = {}
        while (
          p.x >= minX &&
          p.x <= maxX &&
          p.y > minY &&
          p.y < maxY &&
          cnt++ < 200
        ) {
          const curRow = Math.floor(interpolate([minX, maxX], [0, n - 1], p.x))
          const curCol = Math.floor(interpolate([minY, maxY], [0, n - 1], p.y))
          if (curRow < 0 || curRow >= n || curCol < 0 || curCol >= n) break

          const key = `${curRow} ${curCol}`
          if (!marked[key]) {
            marked[key] = true
            tiles[curRow][curCol]++
            if (tiles[curRow][curCol] > max) max = tiles[curRow][curCol]
          }

          const angle = grid[curRow][curCol]
          const nextP = coordWithAngleAndDistance(p, angle, lineLength)

          p.x = nextP.x
          p.y = nextP.y
        }
      })
    })

    s.noStroke()
    tiles.forEach((row, r) => {
      row.forEach((cnt, c) => {
        const loc = getPoint(n, center, totalLength, squareLen, r, c)
        const p = interpolate([0, max], [0, 1], cnt)
        s.fill(`rgba(255, 255, 255, ${p})`)
        s.circle(loc.x, loc.y, squareLen, squareLen)
      })
    })
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.frameRate(60)
  }

  let last: Props

  s.draw = () => {
    const props = getProps()
    const { n, drawMode, lineLength, alpha, rainbow, density } = props
    if (last && Object.keys(last).every((prop) => last[prop] === props[prop]))
      return

    // setProp('field', 'noise', Math.sin(s.frameCount / 5000) + 0.25)
    // setProp('field', 'alpha', Math.cos(s.frameCount / 100) / 2.2 + 0.5)
    // setProp('field', 'distortion', interpolate([-1, 1], [0, Math.PI /3], Math.sin(s.frameCount / 200)))
    s.clear()
    if (!rainbow) s.stroke(`rgba(255, 255, 255, ${alpha})`)
    generateField()
    const totalLength = Math.min(window.innerWidth, window.innerHeight)
    const center = {
      x: Math.floor(window.innerWidth / 2),
      y: Math.floor(window.innerHeight / 2),
    }
    switch (drawMode) {
      case 'arrows': {
        drawAsArrows(n, center, totalLength, lineLength)
        break
      }
      case 'streams': {
        drawAsStreams(props, totalLength, center)
        break
      }
      case 'dots': {
        drawAsDots(n, lineLength, density, center, totalLength)
        break
      }
    }

    last = props
  }
}
