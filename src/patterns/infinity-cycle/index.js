import init from './base'
import { interpolate } from 'utils/math'

const interpolateColors = (color1, color2, p) => ({
  r: interpolate([0, 1], [color1.r, color2.r], p),
  g: interpolate([0, 1], [color1.g, color2.g], p),
  b: interpolate([0, 1], [color1.b, color2.b], p),
  o: interpolate([0, 1], [color1.o, color2.o], p),
})

const width = 1000
const height = 300

const midWidth = window.innerWidth / 2
const midHeight = window.innerHeight / 2

const is3d = false
const isFilled = false

const props = {
  isFilled,
  is3d,
  cameraRotation: {
    x: 0.002,
    y: 0.003,
    z: 0.0025,
  },
  width,
  height,
  minX: is3d ? (-width / 2) : (midWidth - width / 2),
  maxX: is3d ? (width / 2) : (midWidth + width / 2),
  lineCount: 50,
  damp: 0,
  period: 10,
  zigzag: true,

  staticDampIncrease: 0.2,

  // dampCyclePeriod: 80,
  // dampCycleExtremity: 0.8,

  color1: {
    r: 0,
    g: 0,
    b: 0,
    o: 0.4,
  },
  color2: {
    r: 255,
    g: 255,
    b: 255,
    o: 1,
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
    if (isFilled) {
      lines.forEach((line, i) => {
        if (i === 0) return

        const line1 = lines[i - 1]
        const line2 = lines[i]

        const p = interpolate([1, lines.length - 1], [0, 1], i)
        const { r, g, b, o } = interpolateColors(props.color2, props.color1, p)
        const fillColor = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${o})`
        s.fill(fillColor)
        s.stroke(fillColor)
        if (props.zigzag) {
          if (is3d) {
            if (i % 2) {
              // s.triangle(line1[0], line1[1], line1[2], line2[0], line2[1], line2[2], line2[3], line2[4], line2[5])
            } else {

            }
          } else {
            if (i % 2) {
              s.triangle(line1[2], line1[3], line2[0], line2[1], line2[2], line2[3])
            } else {
              s.triangle(line1[0], line1[1], line1[2], line1[3], line2[0], line2[1])
            }
          }
        } else {
          if (is3d) {
            s.quad(line1[0], line1[1], line1[2], line1[3], line1[4], line1[5], line2[3], line2[4], line2[5], line2[0], line2[1], line2[2])
          } else {
            s.quad(line1[0], line1[1], line1[2], line1[3], line2[2], line2[3], line2[0], line2[1])
          }
        }
      })
    } else {
      const { r, g, b, a } = props.color1
      s.stroke(`rgba(${r}, ${g}, ${b}, ${a})`)
      if (props.zigzag) {
        lines.forEach((line, i) => {
          if (i === 0) return
          const line1 = lines[i - 1]
          const line2 = lines[i]

          if (is3d) {
            if (i % 2) {
              s.line(line1[3], line1[4], line1[5], line2[0], line2[1], line1[2])
            } else {
              s.line(line1[0], line1[1], line1[2], line2[3], line2[4], line2[5])
            }
          } else {
            if (i % 2) {
              s.line(line1[2], line1[3], line2[0], line2[1])
            } else {
              s.line(line1[0], line1[1], line2[2], line2[3])
            }
          }
        })
      } else {
        lines.forEach(line => s.line(...line))
      }
    }
  },
  props,
})
