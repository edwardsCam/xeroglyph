import { init as initProps, getProp, setProp } from 'utils/propConfig.ts'
import {
  Point,
  coordWithAngleAndDistance,
  interpolate,
  getIntersectionPoint,
} from 'utils/math.ts'

import SimplexNoise from 'simplex-noise'

type DrawMode = 'arrows' | 'streams' | 'dots'

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
    r: number,
    c: number
  ): Point => ({
    x: interpolate(
      [0, n - 1],
      [center.x - totalLength / 2, center.x + totalLength / 2],
      c
    ),
    y: interpolate(
      [0, n - 1],
      [center.y - totalLength / 2, center.y + totalLength / 2],
      r
    ),
  })

  const drawAsArrows = (
    n: number,
    center: Point,
    totalLength: number,
    lineLength: number
  ) => {
    grid.forEach((row, r) => {
      row.forEach((angle, c) => {
        const p: Point = getPoint(n, center, totalLength, r, c)
        drawArrow(p, angle, lineLength, false)
      })
    })
  }

  const drawAsStreams = (
    n: number,
    lineLength: number,
    alpha: number,
    density: number,
    rainbow: boolean,
    center: Point,
    totalLength: number
  ) => {
    const minX = center.x - totalLength / 2
    const maxX = center.x + totalLength / 2
    const minY = center.y - totalLength / 2
    const maxY = center.y + totalLength / 2

    grid.forEach((row, r) => {
      row.forEach((_angle, c) => {
        if (Math.random() > density) return
        const p = getPoint(n, center, totalLength, r, c)
        let cnt = 0
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

          const angle = grid[curRow][curCol]
          const nextP = coordWithAngleAndDistance(p, angle, lineLength)

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

          s.line(p.x, p.y, nextP.x, nextP.y)
          p.x = nextP.x
          p.y = nextP.y
        }
      })
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
        const p = getPoint(n, center, totalLength, r, c)
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
        const loc = getPoint(n, center, totalLength, r, c)
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
    const totalLength = Math.min(window.innerWidth, window.innerHeight) * 0.9
    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }
    switch (drawMode) {
      case 'arrows': {
        drawAsArrows(n, center, totalLength, lineLength)
        break
      }
      case 'streams': {
        drawAsStreams(
          n,
          lineLength,
          alpha,
          density,
          rainbow,
          center,
          totalLength
        )
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
