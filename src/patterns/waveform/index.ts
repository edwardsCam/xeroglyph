import { init as initProps, getProp } from 'utils/propConfig'
import { interpolate } from 'utils/math'
import pushpop from 'utils/pushpop'

type Props = {
  n: number
  d: number
  contourHeight: number
  peakHeight: number
  mode: 'dots' | 'lines' | 'marching squares'
}

const randomSeed = Math.random() * 30

export default (s) => {
  initProps('waveform', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    n: {
      type: 'number',
      default: 60,
      min: 5,
    },
    d: {
      type: 'number',
      default: 200,
      min: 50,
      step: 10,
    },
    'Contour Height': {
      type: 'number',
      default: 0,
      min: 0,
    },
    'Peak Height': {
      type: 'number',
      default: 400,
      min: 0,
    },
    Mode: {
      type: 'dropdown',
      default: 'dots',
      options: ['dots', 'lines', 'marching squares'],
    },
  })
  const get = (prop: string) => getProp('waveform', prop)
  const getProps = (): Props => ({
    n: get('n'),
    d: get('d'),
    contourHeight: get('Contour Height'),
    peakHeight: get('Peak Height'),
    mode: get('Mode'),
  })

  type Point = {
    x: number
    y: number
    z: number
    r: number
    c: number
  }

  type Cell = {
    cellType: number
    p0: Point
    p1: Point
    p2: Point
    p3: Point
  }

  let zoom: number

  const flattenCols = <T>(cols: T[][]): T[] =>
    cols.reduce((list, col) => [...list, ...col], [])

  function initialize() {
    s.clear()
    s.colorMode(s.HSB)
    zoom = 1000
  }

  function generate(
    n: number,
    d: number,
    bucketResolution: number,
    peakHeight: number
  ): Point[][] {
    const cols: Point[][] = []
    const noiseAmp = 0.008
    for (let c = 0; c < n; c++) {
      cols.push([])
      for (let r = 0; r < n; r++) {
        const x = Math.floor(interpolate([0, n - 1], [-d, d], r))
        const y = Math.floor(interpolate([0, n - 1], [-d, d], c))
        const z =
          s.noise(
            x * noiseAmp * (1 - Math.cos(s.frameCount / 50)) + randomSeed,
            y * noiseAmp * (1 - Math.sin(s.frameCount / 200)) + randomSeed
          ) * peakHeight

        cols[c].push({
          x,
          y,
          z: Math.floor(
            bucketResolution < 1
              ? z
              : Math.floor(z / bucketResolution) * bucketResolution
          ),
          r,
          c,
        })
      }
    }
    return cols
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
    s.noCursor()
    initialize()
  }

  s.draw = () => {
    s.clear()

    const twopi = Math.PI * 2
    const { n, d, contourHeight, peakHeight, mode } = getProps()
    s.camera(0, 0, zoom, 0, 0, 0, 0, 1, 0)
    s.rotateY(interpolate([0, window.innerWidth], [0, twopi], s.mouseX))
    s.rotateX(interpolate([0, window.innerHeight], [0, twopi], s.mouseY))

    const cols = generate(n, d, contourHeight, peakHeight)

    const flattened = flattenCols(cols)
    const minZ = flattened.reduce(
      (min, p) => (p.z < min ? p.z : min),
      Number.POSITIVE_INFINITY
    )
    const maxZ = flattened.reduce(
      (max, p) => (p.z > max ? p.z : max),
      Number.NEGATIVE_INFINITY
    )

    cols.forEach((col) => {
      col.forEach((p, i) => {
        const color = [
          interpolate([0, window.innerWidth], [100, 200], p.x),
          interpolate([minZ, maxZ], [100, 0], p.z),
          100,
        ]
        if (mode === 'lines') {
          if (i === 0) return
          s.strokeWeight(1)
          s.stroke(...color)
          const prev = col[i - 1]
          s.line(p.x, p.y, p.z, prev.x, prev.y, prev.z)
        } else if (mode === 'dots') {
          pushpop(s, () => {
            s.fill(...color)
            s.noStroke()
            s.translate(p.x, p.y, p.z)
            s.box(4)
          })
        }
      })
    })

    if (mode === 'marching squares') {
      const cellCols = marchingSquares(cols, contourHeight)
      s.stroke('white')
      s.strokeWeight(1)
      cellCols.forEach((col) => {
        col.forEach((cell) => {
          drawTerrain(cell)
        })
      })
    }
  }

  const drawTerrain = ({ cellType, p0, p1, p2 }: Cell) => {
    const [minX, minY, maxX, maxY] = [p0.x, p2.y, p2.x, p0.y]
    const midX = (minX + maxX) / 2
    const midY = (minY + maxY) / 2
    switch (cellType) {
      case 0:
      case 15:
        // flat
        break
      case 1:
      case 14:
        // bl corner
        {
          s.line(midX, maxY, p0.z, minX, midY, p1.z)
        }
        break
      case 2:
      case 13:
        // br corner
        {
          s.line(midX, maxY, p0.z, maxX, midY, p1.z)
        }
        break
      case 3:
      case 12:
        // horizontal
        {
          s.line(minX, midY, p1.z, maxX, midY, p1.z)
        }
        break
      case 4:
      case 11:
        // tr corner
        {
          s.line(maxX, midY, p1.z, midX, minY, p0.z)
        }
        break
      case 5:
        // br corner
        // tl corner
        {
          s.line(midX, maxY, p0.z, maxX, midY, p1.z)
          s.line(midX, minY, p0.z, minX, midY, p1.z)
        }
        break
      case 6:
      case 9:
        // vertical
        {
          s.line(midX, maxY, p0.z, midX, minY, p0.z)
        }
        break
      case 7:
      case 8:
        // tl corner
        {
          s.line(midX, minY, p0.z, minX, midY, p1.z)
        }
        break
      case 10:
        // bl corner
        // tr corner
        {
          s.line(midX, maxY, p0.z, minX, midY, p1.z)
          s.line(maxX, midY, p1.z, midX, minY, p0.z)
        }
        break
    }
  }

  const marchingSquares = (
    cols: Point[][],
    contourHeight: number
  ): Cell[][] => {
    return cols.reduce((cells, col, i) => {
      if (i === 0) return cells

      const prev = cols[i - 1]
      cells.push(
        col
          .filter((_c, j) => j > 0)
          .map((_p, j) => {
            const p0 = prev[j + 1]
            const p1 = col[j + 1]
            const p2 = col[j]
            const p3 = prev[j]
            const square: [Point, Point, Point, Point] = [p0, p1, p2, p3]
            const minZ = square.reduce(
              (min, p) => (p.z < min ? p.z : min),
              Number.POSITIVE_INFINITY
            )
            const maxZ = square.reduce(
              (max, p) => (p.z > max ? p.z : max),
              Number.NEGATIVE_INFINITY
            )
            const diff = maxZ - minZ
            let cellType: number
            if (diff >= contourHeight) {
              cellType = getCellType(square, maxZ - diff / 2)
            } else {
              cellType = 0
            }
            return {
              cellType,
              p0,
              p1,
              p2,
              p3,
            }
          })
      )
      return cells
    }, [] as Cell[][])
  }

  const getCellType = (
    square: [Point, Point, Point, Point],
    threshold: number
  ): number => {
    return getCase(
      square.map((p) => p.z >= threshold) as [
        boolean,
        boolean,
        boolean,
        boolean
      ]
    )
  }

  const getCase = (square: [boolean, boolean, boolean, boolean]): number =>
    square.reduce((sum, val, i) => sum + (val ? 1 : 0) * Math.pow(2, i), 0)

  s.mouseWheel = (e) => {
    zoom += e.delta / 10
  }
}
