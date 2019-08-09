import init from './base'
import { interpolate } from 'utils/math'

const interpolateColors = (color1, color2, p) => ({
  r: interpolate([0, 1], [color1.r, color2.r], p),
  g: interpolate([0, 1], [color1.g, color2.g], p),
  b: interpolate([0, 1], [color1.b, color2.b], p),
  o: interpolate([0, 1], [color1.o, color2.o], p),
})

const width = 800
const height = 250

const midWidth = window.innerWidth / 2
const midHeight = window.innerHeight / 2

const is3d = true
const isColored = false

const props = {
  isColored,
  is3d,
  cameraRotation: {
    x: 0.005,
    y: 0.004,
    z: 0.003,
  },
  width,
  height,
  minX: is3d ? (-width / 2) : (midWidth - width / 2),
  maxX: is3d ? (width / 2) : (midWidth + width / 2),
  lineCount: 300,
  damp: 358,
  period: 4,

  staticDampIncrease: 0.001,

  // dampCyclePeriod: 50,
  // dampCycleExtremity: 0.5,

  color1: {
    r: 56,
    g: 81,
    b: 112,
    o: 1,
  },
  color2: {
    r: 255,
    g: 255,
    b: 255,
    o: 0.1,
  },
}

export default init({
  setup: x => is3d ? [ x, 0, 0, x, 100, 0 ] : [ 0, 0, x, midHeight ],
  mutate: (line, t) => {
    const cos = Math.cos(t)
    const sin = Math.sin(t)
    if (is3d) {
      return [
        line[0],
        line[1],
        line[2],
        height * cos,
        height * sin,
        height * (cos + sin),
      ]
    } else {
      return [
        height * cos + midWidth,
        height * sin + midHeight,
        line[2],
        line[3],
      ]
    }
  },
  draw: (s, lines) => {
    if (isColored) {
      lines.forEach((line, i) => {
        if (i === 0) return

        const line1 = lines[i - 1]
        const line2 = lines[i]

        const p = interpolate([1, lines.length - 1], [0, 1], i)
        const { r, g, b, o } = interpolateColors(props.color2, props.color1, p)
        const fillColor = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${o})`
        s.fill(fillColor)
        s.stroke(fillColor)
        if (is3d) {
          s.quad(line1[0], line1[1], line1[2], line1[3], line1[4], line1[5], line2[3], line2[4], line2[5], line2[0], line2[1], line2[2])
        } else {
          s.quad(line1[0], line1[1], line1[2], line1[3], line2[2], line2[3], line2[0], line2[1])
        }
      })
    } else {
      lines.forEach(line => s.line(...line))
    }
  },
  props,
})
