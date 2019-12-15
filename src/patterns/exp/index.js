import { interpolate } from 'utils/math'

class Drape {
  constructor({ createVector }, { x, res, damp = 1 }) {
    this.res = res
    this.damp = damp
    this.points = []
    this.forces = []
    for (let i = 0; i <= res; i++) {
      this.points.push({
        pos: createVector(x, interpolate([0, res], [10, window.innerHeight - 10], i)),
        vel: createVector(0, 0),
      })
    }
  }

  pushPoint(idx, vector, damp = 1) {
    this.forces.push({ idx, vector })
  }

  mutate() {
    this.forces.forEach(({ idx, vector }) => {
      this.points[idx].vel.add(vector)
    })
    this.forces = []

    this.points.forEach((point, i) => {
      point.vel.div(this.damp)
      point.pos.add(point.vel)
    })
  }
}

export default s => {
  const drapes = [
    new Drape(s, { x: 10, res: 10, damp: 1.01 })
  ]

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)

    setTimeout(() => {
      drapes[0].pushPoint(0, s.createVector(5, 0))
    }, 1000)
  }

  s.draw = () => {
    s.clear()
    drapes.forEach(drape => {
      drape.mutate()
      for (let i = 0; i < drape.points.length; i++) {
        if (i === 0) continue
        const prevPoint = drape.points[i - 1]
        const point = drape.points[i]
        s.line(
          prevPoint.pos.x,
          prevPoint.pos.y,
          point.pos.x,
          point.pos.y,
        )
      }
    })
  }
}
