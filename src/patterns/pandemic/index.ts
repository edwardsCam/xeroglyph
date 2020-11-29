import { init as initProps, getProp } from 'utils/propConfig.ts'
import {
  randomPoint,
  randomInRange,
  Point,
  coordWithAngleAndDistance,
  distance,
  interpolate,
} from 'utils/math.ts'

type Props = {
  n: number
  moveSpeed: number
  spreadRadius: number
  recoveryTime: number
  deathTime: number
}

type Info = {
  total: number
  healthy: number
  infected: number
  dead: number
}

type InfectionStatus = 'healthy' | 'infected' // | 'immune'

const normalizeVector = (vector: Point, max: number): Point => {
  let val: Point = { ...vector }
  val.x = Math.min(max, val.x)
  val.x = Math.max(-max, val.x)

  val.y = Math.min(max, val.y)
  val.y = Math.max(-max, val.y)

  return val
}

const PULSE_TIME = 50

const timeDifference = (date: Date): number =>
  new Date().getTime() - date.getTime()

let _id = 0

export default (s) => {
  initProps('pandemic', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    n: {
      type: 'number',
      default: 400,
      min: 5,
      step: 10,
    },
    moveSpeed: {
      type: 'number',
      default: 0.6,
      min: 0.1,
      step: 0.1,
    },
    spreadRadius: {
      type: 'number',
      default: 30,
      min: 1,
    },
    recoveryTime: {
      type: 'number',
      default: 1.5,
      min: 1,
      step: 0.5,
    },
    deathTime: {
      type: 'number',
      default: 20,
      min: 3,
    },
  })

  const get = (prop: string) => getProp('pandemic', prop)
  const getProps = (): Props => ({
    n: get('n'),
    moveSpeed: get('moveSpeed'),
    spreadRadius: get('spreadRadius'),
    recoveryTime: get('recoveryTime'),
    deathTime: get('deathTime'),
  })

  class Population {
    indivs: Individual[]
    deathCount: number

    constructor(props: Props) {
      this.indivs = []
      this.deathCount = 0
      for (let i = 0; i < props.n; i++) {
        this.indivs.push(new Individual(props, randomPoint()))
      }
    }

    mutate(props: Props) {
      let bringOutYourDead: number[] = []
      this.indivs.forEach((individual, i) => {
        if (individual.status === 'infected') {
          this.possiblyInfectOthers(individual, props.spreadRadius)
        }

        individual.mutate(props)
        if (individual.isDead(props)) {
          bringOutYourDead.push(i)
          this.deathCount++
        }
      })
      this.indivs = this.indivs.filter((_x, i) => !bringOutYourDead.includes(i))
    }

    possiblyInfectOthers(individual: Individual, spreadRadius: number) {
      const peopleWithinProximity = this.indivs.filter((other) => {
        if (individual.id === other.id) return false
        return distance(individual.location, other.location) < spreadRadius
      })
      peopleWithinProximity.forEach((nearbyIndividual) => {
        nearbyIndividual.infect()
      })
    }

    draw(props: Props) {
      this.indivs.forEach((individual) => individual.draw(props))
    }

    getInfo(): Info {
      const infected = this.indivs.reduce((count, individual) => {
        if (individual.status === 'infected') return count + 1
        return count
      }, 0)
      const total = this.indivs.length
      const healthy = total - infected
      return {
        total,
        healthy,
        infected,
        dead: this.deathCount,
      }
    }
  }

  class Individual {
    location: Point
    velocity: Point
    acceleration: Point
    status: InfectionStatus
    mostRecentInfection: Date | null
    ticksSurvived: number
    id: number

    constructor(props: Props, startPoint: Point) {
      this.location = startPoint
      this.velocity = { x: 0, y: 0 }
      this.acceleration = { x: 0, y: 0 }
      this.ticksSurvived = 0
      this.id = _id++
      if (Math.random() < 0.95) {
        this.status = 'healthy'
        this.mostRecentInfection = null
      } else {
        this.status = 'infected'
        this.mostRecentInfection = new Date()
      }
    }

    mutate(props: Props) {
      if (this.status === 'infected' && this.mostRecentInfection) {
        this.ticksSurvived++
        const infectionTime = timeDifference(this.mostRecentInfection)
        if (infectionTime > props.recoveryTime * 1000) {
          this.recover()
        }
      }
      this.move(props)
    }

    move(props: Props) {
      const randomTheta = randomInRange(0, Math.PI * 2)
      const randomSpeed = randomInRange(0, props.moveSpeed)
      const accelMax = randomSpeed / 15
      this.acceleration = coordWithAngleAndDistance(
        this.acceleration,
        randomTheta,
        accelMax
      )
      this.acceleration = normalizeVector(this.acceleration, accelMax)
      this.velocity.x += this.acceleration.x
      this.velocity.y += this.acceleration.y
      this.velocity = normalizeVector(this.velocity, props.moveSpeed)

      if (this.location.x < 0) {
        this.location.x = 0
        this.velocity.x *= -1
      }
      if (this.location.y < 0) {
        this.location.y = 0
        this.velocity.y *= -1
      }
      if (this.location.x >= window.innerWidth) {
        this.location.x = window.innerWidth
        this.velocity.x *= -1
      }
      if (this.location.y >= window.innerHeight) {
        this.location.y = window.innerHeight
        this.velocity.y *= -1
      }

      this.location.x += this.velocity.x
      this.location.y += this.velocity.y
    }

    draw(props: Props) {
      s.push()
      if (this.status === 'infected') {
        s.noFill()
        const pulse = s.frameCount % PULSE_TIME
        s.stroke('red')
        s.circle(
          this.location.x,
          this.location.y,
          interpolate([0, PULSE_TIME / 2], [0, props.spreadRadius], pulse)
        )
        s.fill('red')
      }
      s.circle(this.location.x, this.location.y, 7)
      s.pop()
    }

    infect() {
      this.status = 'infected'
      this.mostRecentInfection = new Date()
    }

    recover() {
      this.status = 'healthy'
      this.mostRecentInfection = null
    }

    isDead(props: Props): boolean {
      if (this.status === 'infected') {
        const framerate = s.frameRate()
        if (framerate) {
          return this.ticksSurvived / framerate > props.deathTime
        }
      }
      return false
    }
  }

  const showInfo = (n: number) => {
    const MARGIN = 20
    const topLeft = window.innerWidth - (100 + MARGIN)
    s.push()
    s.fill('grey')
    s.strokeWeight(2)
    s.stroke('black')
    s.rect(topLeft, MARGIN, 100, 85)
    s.noStroke()
    s.fill('black')

    const info = population.getInfo()
    s.text('Population: ' + info.total, topLeft + 5, MARGIN + 15)
    s.text('Healthy: ' + info.healthy, topLeft + 5, MARGIN + 27)
    s.text('Infected: ' + info.infected, topLeft + 5, MARGIN + 39)
    s.text('Dead: ' + info.dead, topLeft + 5, MARGIN + 51)
    s.text(
      'Infection: ' + Math.floor((info.infected * 100) / info.total) + '%',
      topLeft + 5,
      MARGIN + 63
    )
    s.text(
      'Survival: ' + Math.floor((info.total * 100) / n) + '%',
      topLeft + 5,
      MARGIN + 75
    )
    s.pop()
  }

  let population: Population

  function initialize() {
    s.clear()
    const props = getProps()
    population = new Population(props)
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  s.draw = () => {
    s.clear()
    const props = getProps()
    population.mutate(props)
    population.draw(props)

    showInfo(props.n)
  }
}
