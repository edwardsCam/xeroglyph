import { init as initProps, getProp } from 'utils/propConfig'
import { interpolate } from 'utils/math'
import { contours as d3Contours } from 'd3-contour'

const ColorMode = ['monochrome', 'fill', 'stroke']

type Props = {
  size: number
  contours: number
  height: number
  smooth: boolean
  colorMode: typeof ColorMode[number]
  noise: number
  strokeWeight: number
  stretch: number
}

type ValueData = {
  min: number
  max: number
  values: number[]
}

export default (s) => {
  initProps('topo', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    Size: {
      type: 'number',
      default: 400,
      min: 100,
      step: 20,
    },
    Contours: {
      type: 'number',
      min: 3,
      default: 20,
    },
    Height: {
      type: 'number',
      default: 400,
      min: 20,
      step: 20,
    },
    'Smooth?': {
      type: 'boolean',
      default: false,
    },
    'Color Mode': {
      type: 'dropdown',
      default: 'monochrome',
      options: ColorMode,
    },
    'Random Noise': {
      type: 'number',
      default: 0.4,
      step: 0.01,
      min: 0,
    },
    'Stroke Weight': {
      type: 'number',
      default: 2,
      min: 0,
      step: 0.2,
    },
    Stretch: {
      type: 'number',
      min: 1,
      default: 1,
      step: 0.1,
    },
  })
  const get = (prop: string) => getProp('topo', prop)
  const getProps = (): Props => ({
    size: get('Size'),
    contours: get('Contours'),
    colorMode: get('Color Mode'),
    height: get('Height'),
    smooth: get('Smooth?'),
    noise: get('Random Noise'),
    strokeWeight: get('Stroke Weight'),
    stretch: get('Stretch'),
  })

  let zoom: number

  function drawBand(
    band,
    halfWidth: number,
    contourHeight: number,
    stretch: number
  ) {
    band.forEach((coord) => {
      s.beginShape()
      coord.forEach((p: [number, number]) => {
        s.vertex(
          (p[0] - halfWidth) * stretch,
          (p[1] - halfWidth) * stretch,
          contourHeight
        )
      })
      s.endShape()
    })
  }

  function generateValues(n: number, noise: number, height: number): ValueData {
    if (n === 0) return { min: 0, max: 0, values: [] }
    const values = new Array(n * n)
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    for (let j = 0.5, k = 0; j < n; ++j) {
      for (let i = 0.5; i < n; ++i, k++) {
        const val = s.noise(i * noise, j * noise) * height
        values[k] = val
        if (val < min) min = val
        if (val > max) max = val
      }
    }
    return {
      values: values.map((v) => v - min),
      min,
      max,
    }
  }

  function drawContours(props: Props, valueData: ValueData) {
    const thresholds = Array.from({ length: props.contours }, (_, i) =>
      interpolate([0, props.contours - 1], [valueData.min, valueData.max], i)
    )
    const contours = d3Contours()
      .smooth(props.smooth)
      .size([props.size, props.size])
      .thresholds(thresholds)(valueData.values)
    contours.forEach((contour) => {
      contour.coordinates.forEach((band) => {
        if (props.colorMode !== 'monochrome') {
          const color = [
            interpolate(
              [valueData.min, valueData.max],
              [0, 270],
              contour.value
            ),
            100,
            100,
          ]
          if (props.colorMode === 'fill') {
            s.stroke('black')
            s.fill(...color)
          } else if (props.colorMode === 'stroke') {
            s.stroke(...color)
          }
        }
        drawBand(band, props.size / 2, contour.value, props.stretch)
      })
    })
  }

  function initialize() {
    s.clear()
    s.colorMode(s.HSB)
    s.stroke('white')
    zoom = 1000
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
    s.noCursor()
    s.fill('black')
    initialize()
  }

  s.draw = () => {
    s.clear()

    s.camera(0, 0, zoom, 0, 0, 0, 0, 1, 0)
    s.rotateY(interpolate([0, window.innerWidth], [0, Math.PI * 2], s.mouseX))
    s.rotateX(interpolate([0, window.innerHeight], [0, Math.PI * 2], s.mouseY))

    const props = getProps()

    s.stroke('white')
    s.strokeWeight(props.strokeWeight)
    s.fill('black')

    drawContours(
      props,
      generateValues(props.size, props.noise / 100, props.height)
    )
  }

  s.mouseWheel = (e) => {
    zoom += e.delta / 10
  }
}
