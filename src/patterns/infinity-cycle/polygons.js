import { interpolateSmooth, interpolate, toRadians } from 'utils/math'

function interpolateColors(color1, color2, p) {
  return {
    r: interpolate([0, 1], [color1.r, color2.r], p),
    g: interpolate([0, 1], [color1.g, color2.g], p),
    b: interpolate([0, 1], [color1.b, color2.b], p),
    o: interpolate([0, 1], [color1.o, color2.o], p),
  }
}

export default s => {

  const props = {
    lineCount: 200,
    damp: 6,
    period: 4,
    color1: {
      r: 159,
      g: 211,
      b: 199,
      o: 1,
    },
    color2: {
      r: 56,
      g: 81,
      b: 112,
      o: 1,
    },

    // dampCyclePeriod: 12,
    // dampCycleExtremity: 0.2,
  }

  const lines = []

  const width = 1400
  const height = 400

  const initialTime = Date.now()
  let time = initialTime
  let animateTime = 0

  const midWidth = window.innerWidth / 2
  const midHeight = window.innerHeight / 2

  s.setup = () => {
    s.noStroke()
    s.createCanvas(window.innerWidth, window.innerHeight)

    const minX = midWidth - width / 2
    const maxX  = midWidth + width / 2

    for (let i = 0; i < props.lineCount; i++) {
      let x = interpolate([0, props.lineCount - 1], [minX, maxX], i)
      lines.push([ 0, 0, x, midHeight ])
    }
  }

  s.draw = () => {
    s.clear()
    mutate()
    draw()
  }

  function mutate() {
    withClock(() => {
      const timeAsDegrees = animateTime * 360
      if (props.dampCyclePeriod != null && props.dampCycleExtremity != null) {
        const r = toRadians(timeAsDegrees)
        const dampIncrease = Math.sin(r / props.dampCyclePeriod) * props.dampCycleExtremity
        props.damp += dampIncrease
      }
      lines.forEach((line, i) => {
        const t = toRadians(timeAsDegrees + (i * props.damp)) / props.period
        line[0] = height * Math.cos(t) + midWidth
        line[1] = height * Math.sin(t) + midHeight
      })
    })
  }

  function draw() {
    for (let i = 1; i < props.lineCount; i++) {
      const line1 = lines[i - 1]
      const line2 = lines[i]

      const p = interpolate([1, props.lineCount - 1], [0, 1], i)
      const { r, g, b, o } = interpolateColors(props.color1, props.color2, p)
      s.fill(`rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${o})`)
      s.quad(line1[0], line1[1], line1[2], line1[3], line2[2], line2[3], line2[0], line2[1])
    }
  }

  function withClock(callback) {
    const delta = Date.now() - time
    time += delta
    animateTime += delta / 1000
    callback()
  }

  function drawLine(lineArgs, i) {
    if (i === 0) return
    s.line(...lineArgs)
  }
}
