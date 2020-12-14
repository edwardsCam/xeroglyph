import { init as initProps, getProp } from 'utils/propConfig.ts'
import { Point, interpolate } from 'utils/math.ts'
import { getCenter, getBoundedSize } from 'utils/window.ts'
import chull from 'hull.js'
// import densityClustering from 'density-clustering'

const _COLOR_SCHEMES_ = ['iceland', 'fieryFurnace', 'oceanscape'] as const

type ColorScheme = typeof _COLOR_SCHEMES_[number]

type Bounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

type Shape = Point[]

type NoiseFn = (x: number, y: number) => number
type NumberConversionFn = (n: number) => number

type Props = {
  n: number
  noise: number
  layers: number
  distortion: number
  colorScheme: ColorScheme
  showImage: boolean
  // clustering: boolean
}

const coolColors = ['#172347', '#025385', '#0EF3C5', '#015268', '#F5EED2']
const hotColors = ['#801100', '#D73502', '#FAC000', '#A8A9AD', '#CB4446']
const oceanScapeColors = [
  '#c71585',
  '#4a2e76',
  '#365086',
  '#ff6edf',
  '#0AA9A1',
  '#D8F8F5',
]

export default (s) => {
  initProps('chonks', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    n: {
      type: 'number',
      default: 100,
      min: 3,
    },
    layers: {
      type: 'number',
      default: 2,
      min: 1,
    },
    noise: {
      type: 'number',
      default: 0.9,
      min: Number.NEGATIVE_INFINITY,
      step: 0.1,
    },
    distortion: {
      type: 'number',
      default: 1,
      min: 0,
      step: 0.05,
    },
    colorScheme: {
      type: 'dropdown',
      default: 'oceanscape',
      options: [..._COLOR_SCHEMES_],
    },
    showImage: {
      type: 'boolean',
      default: false,
    },
    // clustering: {
    //   type: 'boolean',
    //   default: false,
    // },
  })
  const get = (prop: string) => getProp('chonks', prop)
  const getProps = (): Props => ({
    n: get('n'),
    noise: get('noise'),
    layers: get('layers'),
    distortion: get('distortion'),
    colorScheme: get('colorScheme'),
    showImage: get('showImage'),
    // clustering: get('clustering'),
  })

  const getPointFromRC = (
    n: number,
    r: number,
    c: number,
    totalLength: number,
    center: Point
  ): Point => {
    const { minX, minY, maxX, maxY } = getBounds(totalLength, center)
    return {
      x: interpolate([0, n - 1], [minX, maxX], c),
      y: interpolate([0, n - 1], [minY, maxY], r),
    }
  }

  const getColors = (colorScheme: ColorScheme): string[] => {
    switch (colorScheme) {
      case 'iceland':
        return coolColors
      case 'fieryFurnace':
        return hotColors
      case 'oceanscape':
        return oceanScapeColors
    }
  }

  const randomColor = (colorScheme: ColorScheme): string => {
    const colors = getColors(colorScheme)
    return colors[Math.floor(Math.random() * (colors.length - 1))]
  }

  const drawHull = (pointset: [number, number][], color: string) => {
    const hull: [number, number][] = chull(pointset, 20)
    s.beginShape()
    s.noStroke()
    s.fill(color)
    hull.forEach(([x, y]) => s.vertex(x, y))
    s.endShape()
  }

  const drawChonks = (
    props: Props,
    distortionFn: NumberConversionFn,
    beforeDraw?: () => any
  ): Shape[] => {
    const { n, colorScheme, noise /*, clustering*/, layers } = props
    const noiseFn: NoiseFn = (x: number, y: number) => {
      const [r, g, b] = s.get(x, y)
      const avg = (r + g + b) / 3
      const angle = interpolate([0, 255], [0, Math.PI * noise], avg)
      return distortionFn(angle)
    }
    let regions: {
      [angle: string]: [number, number][]
    } = {}

    const totalLength = getBoundedSize()
    const center = getCenter()

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const p = getPointFromRC(n, r, c, totalLength, center)
        const angle = noiseFn(p.x, p.y).toFixed(2)
        if (!regions[angle]) {
          regions[angle] = []
        }
        regions[angle].push([p.x, p.y])
      }
    }
    if (beforeDraw) beforeDraw()

    const pointsets = Object.values(regions)
    pointsets.slice(0, layers).forEach((pointset) => {
      if (!pointset) return
      timeouts.push(
        setTimeout(() => {
          /*
        if (clustering) {
          const clusterFn = new densityClustering.OPTICS()
          const clusters = clusterFn
            .run(pointset, 100, 20)
            .map((indices) => indices.map((i) => pointset[i]))
            .filter(Boolean)
          clusters.forEach((cluster) => {
            setTimeout(() => {
              drawHull(cluster, randomColor(colorScheme) + 'AA')
            })
          })
        } else {
          */
          drawHull(pointset, randomColor(colorScheme) + 'AA')
          /*
        }
        */
        })
      )
    })

    return []
  }

  const getBounds = (totalLength: number, center: Point): Bounds => ({
    minX: center.x - totalLength / 2,
    maxX: center.x + totalLength / 2,
    minY: center.y - totalLength / 2,
    maxY: center.y + totalLength / 2,
  })

  let img
  let last: Props | undefined
  let timeouts: number[] = []

  const clearTimeouts = () => {
    timeouts.forEach((timeout) => clearTimeout(timeout))
    timeouts = []
  }

  function initialize() {
    s.clear()
    clearTimeouts()
    last = undefined
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.frameRate(60)
    initialize()
  }

  s.preload = () => {
    img = s.loadImage('assets/marshall.jpg')
  }

  s.draw = () => {
    const props = getProps()
    if (last && Object.keys(last).every((prop) => last[prop] === props[prop])) {
      return
    }

    clearTimeouts()

    const { distortion } = props
    const distortionFn: NumberConversionFn = (angle) =>
      distortion == 0 ? angle : distortion * Math.floor(angle / distortion)

    const totalLength = getBoundedSize()
    const center = getCenter()
    const { minX, minY } = getBounds(totalLength, center)
    s.image(img, minX, minY, totalLength, totalLength)

    drawChonks(props, distortionFn, () => {
      if (!props.showImage) s.clear()
    })

    last = props
  }
}
