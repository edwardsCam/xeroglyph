import { interpolateSmooth, interpolate, toRadians } from 'utils/Math'

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

export default s => {

  const props = {
    lineCount: 500,
    damp: 355,
    period: 15,

    staticDampIncrease: 0.01,

    // dampCyclePeriod: 18.9,
    // dampCycleExtremity: 1,
  }

  setLineCountLabel(props.lineCount)
  setPeriodLabel(props.period)

  const lines = []

  const width = 1500
  const height = 400

  const initialTime = Date.now()
  let time = initialTime
  let animateTime = 0

  let pauseDampIncrease = false
  let isPausingDampIncrease = false
  let isStartingDampIncrease = false
  let dampIncrease = props.staticDampIncrease == null ? 0 : props.staticDampIncrease

  const midWidth = window.innerWidth / 2
  const midHeight = window.innerHeight / 2

  s.setup = () => {
    const minX = midWidth - width / 2
    const maxX  = midWidth + width / 2
    s.createCanvas(window.innerWidth, window.innerHeight)
    for (let i = 0; i < props.lineCount; i++) {
      const x = interpolate([0, props.lineCount - 1], [minX, maxX], i)
      lines.push([ 0, 0, x, midHeight ])
    }

    window.addEventListener('keydown', e => {
      if (e.code == 'Space') {

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
      }
    })
  }

  s.draw = () => {
    s.clear()
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
      setDampFactorLabel(props.damp)
      setPeriodProgressLabel((animateTime % props.period) / props.period)
      lines.forEach((line, i) => {
        const t = toRadians(timeAsDegrees + i * props.damp) / props.period
        line[0] = height * Math.cos(t) + midWidth
        line[1] = height * Math.sin(t) + midHeight
      })
    })
  }

  function draw() {
    lines.forEach(line => s.line(...line))
  }

  function withClock(callback) {
    const delta = Date.now() - time
    time += delta
    animateTime += delta / 1000
    callback()
  }
}
