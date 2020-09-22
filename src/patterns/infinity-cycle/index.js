import { interpolate, toRadians } from 'utils/math.ts'
import { init as initProps, getProp } from 'utils/propConfig.ts'
import Scribble from '../../p5.scribble'

const labels = document.createElement('div')

labels.style.position = 'absolute'
labels.style.left = '10px'
labels.style.top = '10px'

const lineCountLabel = document.createElement('div')
const periodLabel = document.createElement('div')
const periodProgressLabel = document.createElement('div')
const dampFactorLabel = document.createElement('div')

labels.appendChild(lineCountLabel)
labels.appendChild(periodLabel)
labels.appendChild(periodProgressLabel)
labels.appendChild(dampFactorLabel)

document.body.appendChild(labels)

const setLineCountLabel = (count) =>
  (lineCountLabel.innerHTML = `line count: ${count}`)
const setPeriodLabel = (period) =>
  (periodLabel.innerHTML = `period: ${period * 1000}ms`)
const setPeriodProgressLabel = (progress) =>
  (periodProgressLabel.innerHTML = `cycle progress: ${(progress * 100).toFixed(
    0
  )}%`)
const setDampFactorLabel = (damp) =>
  (dampFactorLabel.innerHTML = `dampening factor: ${damp.toFixed(1)}`)

const interpolateColors = (color1, color2, p) => ({
  r: interpolate([0, 1], [color1.r, color2.r], p),
  g: interpolate([0, 1], [color1.g, color2.g], p),
  b: interpolate([0, 1], [color1.b, color2.b], p),
  o: interpolate([0, 1], [color1.o, color2.o], p),
})

export default (s) => {
  const get = (prop) => getProp('infinity', prop)
  const getProps = () => ({
    isFilled: false,
    is3d: true,
    cameraRotation: {
      x: 0.002,
      y: 0.003,
      z: 0.0025,
    },
    width: get('width'),
    height: get('height'),
    lineCount: get('lineCount'),
    damp: 0,
    period: get('period'),
    zigzag: get('zigzag'),

    staticDampIncrease: get('staticDampIncrease'),

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
    scribble: get('scribble'),
  })

  initProps('infinity', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    lineCount: {
      type: 'number',
      default: 100,
      min: 1,
      step: 1,
    },
    width: {
      type: 'number',
      default: 1000,
      min: 50,
      step: 10,
    },
    height: {
      type: 'number',
      default: 300,
      min: 50,
      step: 10,
    },
    period: {
      type: 'number',
      default: 20,
      min: 1,
      step: 1,
    },
    zigzag: {
      type: 'boolean',
      default: true,
    },
    staticDampIncrease: {
      type: 'number',
      default: 0.15,
      min: 0,
      step: 0.05,
    },
    scribble: {
      type: 'boolean',
      default: false,
    },
  })

  let lines,
    initialTime,
    time,
    animateTime,
    pauseDampIncrease,
    isPausingDampIncrease,
    isStartingDampIncrease,
    pausePeriod,
    periodOffset,
    freezeTime,
    pauseCamera,
    cameraFreeze,
    cameraOffset,
    damp,
    scribble

  function initialize() {
    scribble = new Scribble(s)
    const props = getProps()
    lines = []

    initialTime = Date.now()
    time = initialTime
    animateTime = 0

    pauseDampIncrease = false
    isPausingDampIncrease = false
    isStartingDampIncrease = false

    pausePeriod = false
    periodOffset = 0
    freezeTime = null

    pauseCamera = false
    cameraFreeze = null
    cameraOffset = 0

    damp = props.damp

    setLineCountLabel(props.lineCount)
    setPeriodLabel(props.period)

    if (props.isColored) s.noStroke()

    s.createCanvas(
      window.innerWidth,
      window.innerHeight,
      props.is3d ? s.WEBGL : undefined
    )

    const halfWidth = props.width / 2
    const halfScreenWidth = window.innerWidth / 2
    const minX = props.is3d ? -halfWidth : halfScreenWidth - halfWidth
    const maxX = props.is3d ? halfWidth : halfScreenWidth + halfWidth
    for (let i = 0; i < props.lineCount; i++) {
      const x = interpolate([0, props.lineCount - 1], [minX, maxX], i)
      lines.push(
        props.is3d ? [x, 0, 0, x, 100, 0] : [0, 0, x, window.innerHeight / 2]
      )
    }
  }

  s.setup = () => {
    initialize()
    window.addEventListener('keydown', (e) => {
      if (e.key == 'q') {
        if (isPausingDampIncrease) {
          isPausingDampIncrease = false
          isStartingDampIncrease = true
        } else if (isStartingDampIncrease) {
          isStartingDampIncrease = false
          isPausingDampIncrease = true
        } else if (pauseDampIncrease) {
          isStartingDampIncrease = true
        } else {
          isPausingDampIncrease = true
        }
      } else if (e.key === 'w') {
        pausePeriod = !pausePeriod
      } else if (e.key === 'e') {
        pauseCamera = !pauseCamera
        if (pauseCamera) {
          cameraFreeze = s.frameCount - cameraOffset
          cameraOffset = 0
        } else {
          cameraOffset = s.frameCount - cameraFreeze
          cameraFreeze = null
        }
      }
    })
  }

  s.draw = () => {
    const props = getProps()
    s.clear()
    if (props.is3d && props.cameraRotation) {
      const frame = cameraFreeze || s.frameCount - cameraOffset
      s.rotateX(frame * props.cameraRotation.x)
      s.rotateY(frame * props.cameraRotation.y)
      s.rotateZ(frame * props.cameraRotation.z)
    }
    mutate(props)
    draw(props)
  }

  function mutate(props) {
    withClock(() => {
      const timeAsDegrees = animateTime * 360
      let dampIncrease =
        props.staticDampIncrease == null ? 0 : props.staticDampIncrease
      if (props.staticDampIncrease != null) {
        if (isPausingDampIncrease) {
          dampIncrease -= props.staticDampIncrease / 80
          if (dampIncrease < 0) {
            dampIncrease = 0
            isPausingDampIncrease = false
            pauseDampIncrease = true
          }
        } else if (isStartingDampIncrease) {
          dampIncrease += props.staticDampIncrease / 80
          if (dampIncrease > props.staticDampIncrease) {
            dampIncrease = props.staticDampIncrease
            isStartingDampIncrease = false
            pauseDampIncrease = false
          }
        }

        damp += dampIncrease
      } else if (
        props.dampCyclePeriod != null &&
        props.dampCycleExtremity != null
      ) {
        const r = toRadians(timeAsDegrees)
        dampIncrease =
          Math.sin(r / props.dampCyclePeriod) * props.dampCycleExtremity
        damp += dampIncrease
      }

      if (pausePeriod && !freezeTime) {
        freezeTime = timeAsDegrees - periodOffset
        periodOffset = 0
      }
      if (freezeTime && !pausePeriod) {
        periodOffset = timeAsDegrees - freezeTime
        freezeTime = null
      }

      setDampFactorLabel(damp)
      setPeriodProgressLabel((animateTime % props.period) / props.period)
      lines.forEach((line, i) => {
        let t
        if (freezeTime) {
          t = toRadians(freezeTime + i * damp) / props.period
        } else {
          t = toRadians(timeAsDegrees - periodOffset + i * damp) / props.period
        }
        const cos = Math.cos(t)
        const sin = Math.sin(t)
        const { height } = props
        const mutatedLine = props.is3d
          ? [
              line[0],
              line[1],
              line[2],
              height * cos,
              height * sin,
              height * (cos + sin),
            ]
          : [
              height * cos + window.innerWidth / 2,
              height * sin + window.innerHeight / 2,
              line[2],
              line[3],
            ]
        for (let c = 0; c < line.length; c++) {
          line[c] = mutatedLine[c]
        }
      })
    })
  }

  function draw(props) {
    // spec.draw(s, lines)
    if (props.isFilled) {
      lines.forEach((line, i) => {
        if (i === 0) return

        const line1 = lines[i - 1]
        const line2 = lines[i]

        const p = interpolate([1, lines.length - 1], [0, 1], i)
        const { r, g, b, o } = interpolateColors(props.color2, props.color1, p)
        const fillColor = `rgba(${Math.floor(r)}, ${Math.floor(
          g
        )}, ${Math.floor(b)}, ${o})`
        s.fill(fillColor)
        s.stroke(fillColor)
        if (props.zigzag) {
          if (!props.is3d) {
            if (i % 2) {
              s.triangle(
                line1[2],
                line1[3],
                line2[0],
                line2[1],
                line2[2],
                line2[3]
              )
            } else {
              s.triangle(
                line1[0],
                line1[1],
                line1[2],
                line1[3],
                line2[0],
                line2[1]
              )
            }
          }
        } else if (props.is3d) {
          s.quad(
            line1[0],
            line1[1],
            line1[2],
            line1[3],
            line2[0],
            line2[1],
            line2[2],
            line2[3]
          )
        } else {
          s.triangle(line1[0], line1[1], line1[2], line1[3], line2[0], line2[1])
        }
      })
    } else {
      const { r, g, b, a } = props.color1
      s.stroke(`rgba(${r}, ${g}, ${b}, ${a})`)

      const drawFn = props.scribble
        ? (...args) => scribble.scribbleLine(...args)
        : (...args) => s.line(...args)
      if (props.zigzag) {
        lines.forEach((line, i) => {
          if (i === 0) return
          const line1 = lines[i - 1]
          const line2 = lines[i]

          if (props.is3d) {
            if (i % 2) {
              drawFn(line1[3], line1[4], line1[5], line2[0], line2[1], line1[2])
            } else {
              drawFn(line1[0], line1[1], line1[2], line2[3], line2[4], line2[5])
            }
          } else if (i % 2) {
            drawFn(line1[2], line1[3], line2[0], line2[1])
          } else {
            drawFn(line1[0], line1[1], line2[2], line2[3])
          }
        })
      } else {
        lines.forEach((line) => drawFn(...line))
      }
    }
  }

  function withClock(callback) {
    const delta = Date.now() - time
    time += delta
    animateTime += delta / 1000
    callback()
  }
}
