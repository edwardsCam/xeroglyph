import { interpolate, toRadians } from 'utils/math'

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

const setLineCountLabel = count => lineCountLabel.innerHTML = `line count: ${count}`
const setPeriodLabel = period => periodLabel.innerHTML = `period: ${period * 1000}ms`
const setPeriodProgressLabel = progress => periodProgressLabel.innerHTML = `cycle progress: ${(progress * 100).toFixed(0)}%`
const setDampFactorLabel = damp => dampFactorLabel.innerHTML = `dampening factor: ${damp.toFixed(1)}`

export default function init(spec) {
  return s => {
    const { props } = spec

    const { width, height, lineCount, period, minX, maxX } = props

    setLineCountLabel(lineCount)
    setPeriodLabel(period)

    const lines = []

    const initialTime = Date.now()
    let time = initialTime
    let animateTime = 0

    let pauseDampIncrease = false
    let isPausingDampIncrease = false
    let isStartingDampIncrease = false
    let dampIncrease = props.staticDampIncrease == null ? 0 : props.staticDampIncrease

    let pausePeriod = false
    let freezeTime = null

    let pauseCamera = false
    let cameraFreeze = null

    s.setup = () => {
      if (props.isColored) s.noStroke()
      s.createCanvas(window.innerWidth, window.innerHeight, props.is3d ? s.WEBGL : undefined)
      for (let i = 0; i < props.lineCount; i++) {
        const x = interpolate([0, props.lineCount - 1], [minX, maxX], i)
        lines.push(spec.setup(x))
      }

      window.addEventListener('keydown', e => {
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
          if (!pausePeriod) {
            freezeTime = null
          }
        } else if (e.key === 'e') {
          pauseCamera = !pauseCamera
          if (!pauseCamera) {
            cameraFreeze = null
          }
        }
      })
    }

    s.draw = () => {
      s.clear()
      if (pauseCamera && !cameraFreeze) {
        cameraFreeze = s.frameCount
      }
      if (props.is3d && props.cameraRotation) {
        const frame = cameraFreeze || s.frameCount
        s.rotateX(frame * props.cameraRotation.x)
        s.rotateY(frame * props.cameraRotation.y)
        s.rotateZ(frame * props.cameraRotation.z)
      }
      mutate()
      draw()
    }

    function mutate() {
      withClock(() => {
        const timeAsDegrees = animateTime * 360
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

          props.damp += dampIncrease
        } else if (props.dampCyclePeriod != null && props.dampCycleExtremity != null) {
          const r = toRadians(timeAsDegrees)
          dampIncrease = Math.sin(r / props.dampCyclePeriod) * props.dampCycleExtremity
          props.damp += dampIncrease
        }

        if (pausePeriod && !freezeTime) {
          freezeTime = timeAsDegrees
        }

        setDampFactorLabel(props.damp)
        setPeriodProgressLabel((animateTime % props.period) / props.period)
        lines.forEach((line, i) => {
          let t
          if (freezeTime) {
            t = toRadians(freezeTime + i * props.damp) / props.period
          } else {
            t = toRadians(timeAsDegrees + i * props.damp) / props.period
          }
          const mutatedLine = spec.mutate(line, t)
          for (let c = 0; c < line.length; c++) {
            line[c] = mutatedLine[c]
          }
        })
      })
    }

    function draw() {
      spec.draw(s, lines)
    }

    function withClock(callback) {
      const delta = Date.now() - time
      time += delta
      animateTime += delta / 1000
      callback()
    }
  }
}
