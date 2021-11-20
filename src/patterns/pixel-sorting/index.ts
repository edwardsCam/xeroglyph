import { init as initProps, getProp } from 'utils/propConfig'
import { colorDistance } from 'utils/math'
import { getCenter, getBoundedSize } from 'utils/window'
import shuffle from 'utils/shuffle'
import { getRandomImage } from '../images'

type Props = {
  threshold: number
  mode: 'horizontal' | 'vertical'
  drawMode: 'all-at-once' | 'sweep' | 'random'
}

type Bounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export default (s) => {
  initProps('pixelSorting', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    threshold: {
      type: 'number',
      min: 0,
      max: 1.42,
      step: 0.01,
      default: 0.4,
    },
    mode: {
      type: 'dropdown',
      default: 'horizontal',
      options: ['horizontal', 'vertical'],
    },
    drawMode: {
      type: 'dropdown',
      default: 'sweep',
      options: ['all-at-once', 'sweep', 'random'],
    },
  })
  const get = (prop: string) => getProp('pixelSorting', prop)
  const getProps = (): Props => ({
    threshold: get('threshold'),
    mode: get('mode'),
    drawMode: get('drawMode'),
  })

  let timeouts: NodeJS.Timeout[] = []
  let img
  let last: Props | undefined

  const getBounds = (totalLength: number, center: Point): Bounds => ({
    minX: Math.floor(center.x - totalLength / 2),
    maxX: Math.floor(center.x + totalLength / 2),
    minY: Math.floor(center.y - totalLength / 2),
    maxY: Math.floor(center.y + totalLength / 2),
  })

  const getSortedPixelAt = (
    x: number,
    y: number,
    standard: [number, number, number],
    threshold: number
  ): [number, number, number] => {
    let result = standard
    const cur: [number, number, number] = s.get(x, y)
    const diff = colorDistance(standard, cur)
    if (diff > 255 * threshold) {
      result = cur
    }
    return result
  }

  const mark = (x: number, y: number, standard: [number, number, number]) => {
    const idx = x * 4 + y * window.innerWidth * 4

    const rChan = idx
    const gChan = idx + 1
    const bChan = idx + 2
    const aChan = idx + 3

    s.pixels[rChan] = Math.floor(standard[0])
    s.pixels[gChan] = Math.floor(standard[1])
    s.pixels[bChan] = Math.floor(standard[2])
    s.pixels[aChan] = 255
  }

  const pixelSort = (bounds: Bounds, props: Props) => {
    const { mode, drawMode } = props

    if (drawMode === 'all-at-once') s.loadPixels()
    if (mode === 'horizontal') {
      pixelSortHorizontal(bounds, props)
    } else if (mode === 'vertical') {
      pixelSortVertical(bounds, props)
    }
    if (drawMode === 'all-at-once') s.updatePixels()
  }

  const pixelSortHorizontal = (
    bounds: Bounds,
    { threshold, drawMode }: Props
  ) => {
    const { minX, minY, maxX, maxY } = bounds
    let ys: number[] = []
    for (let y = minY; y < maxY; y++) {
      ys.push(y)
    }
    if (drawMode === 'random') ys = shuffle(ys)
    ys.forEach((y) => {
      const exec = () => {
        let standard: [number, number, number] = s.get(minX, y)
        for (let x = minX; x < maxX; x++) {
          standard = getSortedPixelAt(x, y, standard, threshold)
          mark(x, y, standard)
        }
      }
      if (drawMode === 'all-at-once') {
        exec()
      } else {
        timeouts.push(
          setTimeout(() => {
            s.loadPixels()
            exec()
            s.updatePixels()
          }, 0)
        )
      }
    })
  }

  const pixelSortVertical = (
    bounds: Bounds,
    { threshold, drawMode }: Props
  ) => {
    const { minX, minY, maxX, maxY } = bounds
    let xs: number[] = []
    for (let x = minX; x < maxX; x++) {
      xs.push(x)
    }
    if (drawMode === 'random') xs = shuffle(xs)
    xs.forEach((x) => {
      const exec = () => {
        let standard: [number, number, number] = s.get(x, minY)
        for (let y = minY; y < maxY; y++) {
          standard = getSortedPixelAt(x, y, standard, threshold)
          mark(x, y, standard)
        }
      }
      if (drawMode === 'all-at-once') {
        exec()
      } else {
        timeouts.push(
          setTimeout(() => {
            s.loadPixels()
            exec()
            s.updatePixels()
          }, 0)
        )
      }
    })
  }

  const clearTimeouts = () => {
    timeouts.forEach((timeout) => clearTimeout(timeout))
    timeouts = []
  }

  function initialize() {
    s.clear()
    clearTimeouts()
    last = undefined
  }

  s.preload = () => {
    img = s.loadImage(getRandomImage())
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.pixelDensity(1)
    initialize()
  }

  s.draw = () => {
    const props = getProps()
    // @ts-ignore
    if (last && Object.keys(last).every((prop) => last[prop] === props[prop])) {
      return
    }
    clearTimeouts()
    const totalLength = getBoundedSize()
    const center = getCenter()
    const bounds = getBounds(totalLength, center)
    const { minX, minY } = bounds
    s.image(img, minX, minY, totalLength, totalLength)
    pixelSort(bounds, props)

    last = props
  }
}
