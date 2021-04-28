import { init as initProps, getProp } from 'utils/propConfig'
import { interpolate } from 'utils/math'
import { contours as d3Contours } from 'd3-contour'

type Props = {
  size: number
  contours: number
  height: number
  smooth: boolean
  monochrome: boolean
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
      default: 300,
      min: 20,
      step: 20,
    },
    'Smooth?': {
      type: 'boolean',
      default: false,
    },
    'Monochrome?': {
      type: 'boolean',
      default: true,
    },
  })
  const get = (prop: string) => getProp('topo', prop)
  const getProps = (): Props => ({
    size: get('Size'),
    contours: get('Contours'),
    monochrome: get('Monochrome?'),
    height: get('Height'),
    smooth: get('Smooth?'),
  })

  let drawn = false
  let timeouts: NodeJS.Timeout[] = []

  function drawBand(band, halfWidth: number, contourHeight: number) {
    band.forEach((coord) => {
      s.beginShape()
      coord.forEach((p: [number, number]) => {
        // if (p[0] < 0 || p[0] >= halfWidth || p[1] < 0 || p[1] >= halfWidth) return
        s.vertex(p[0] - halfWidth, p[1] - halfWidth, contourHeight)
      })
      s.endShape()
    })
  }

  function initialize() {
    s.clear()
    s.colorMode(s.HSB)
    s.stroke('white')
    s.strokeWeight(1)
    timeouts.forEach((timeout) => clearTimeout(timeout))
    timeouts = []
    drawn = false
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
    s.noCursor()
    s.fill('black')
    initialize()
  }

  s.draw = () => {
    // if (drawn) return
    s.clear()

    s.rotateY(interpolate([0, window.innerWidth], [0, Math.PI * 2], s.mouseX))
    s.rotateX(interpolate([0, window.innerHeight], [0, Math.PI * 2], s.mouseY))

    s.stroke('white')
    const props = getProps()

    const n = props.size
    const m = props.size
    const values = new Array(n * m)
    for (let j = 0.5, k = 0; j < m; ++j) {
      for (let i = 0.5; i < n; ++i, k++) {
        values[k] = s.noise(i / 250, j / 250) * props.height
      }
    }

    const thresholds = Array.from({ length: props.contours }, (_, i) =>
      interpolate([0, props.contours - 1], [0, props.height], i)
    )
    const contours = d3Contours()
      .smooth(props.smooth)
      .size([n, m])
      .thresholds(thresholds)(values)
    contours.forEach((contour) => {
      // timeouts.push(
      // setTimeout(() => {
      contour.coordinates.forEach((band) => {
        if (!props.monochrome) {
          s.stroke(
            interpolate([0, props.height], [0, 270], contour.value),
            100,
            100
          )
        }
        drawBand(band, props.size / 2, contour.value)
      })
      // }, 0)
      // )
    })

    drawn = true
  }
}
