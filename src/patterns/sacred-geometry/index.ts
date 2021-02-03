import { init as initProps, getProp } from 'utils/propConfig.ts'
import { Props, _PATTERNS, _ZECTANGLE_SHAPES } from './common'
import page71 from './page-71'
import zectangles from './zectangle'
import arrows from './arrows'
import snowflake from './snowflake'

export default (s) => {
  initProps('sacredGeometry', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    pattern: {
      type: 'dropdown',
      default: _PATTERNS[0],
      options: [..._PATTERNS],
    },
    len: {
      type: 'number',
      default: 80,
      min: 5,
      step: 5,
    },
    innerWeight: {
      type: 'number',
      default: 1,
      min: 0,
      step: 0.1,
      when: () => get('pattern') === 'Page 71',
    },
    strokeWeight: {
      type: 'number',
      default: 1,
      min: 0,
      step: 0.1,
    },
    n: {
      type: 'number',
      default: 6,
      min: 1,
      when: () => get('pattern') === 'Page 71',
    },
    degree: {
      type: 'number',
      default: 6,
      min: 1,
      step: 0.1,
      when: () => get('pattern') === 'Zectangle',
    },
    shape: {
      type: 'dropdown',
      default: _ZECTANGLE_SHAPES[0],
      options: [..._ZECTANGLE_SHAPES],
      when: () => get('pattern') === 'Zectangle',
    },
    roughness: {
      type: 'number',
      min: 0,
      step: 0.25,
      default: 0.5,
    },
  })

  let last: Props | undefined

  const get = (prop: string) => getProp('sacredGeometry', prop)
  const getProps = (): Props => ({
    pattern: get('pattern'),
    len: get('len'),
    innerWeight: get('innerWeight'),
    strokeWeight: get('strokeWeight'),
    n: get('n'),
    degree: get('degree'),
    shape: get('shape'),
    roughness: get('roughness'),
  })

  const drawPattern = (props: Props): void => {
    // s.stroke('#d4a45d')
    s.stroke('#755dd4')
    switch (props.pattern) {
      case 'Page 71': {
        page71(s, props)
        break
      }
      case 'Zectangle': {
        zectangles(s, props)
        break
      }
      case 'Arrows': {
        arrows(s, props)
        break
      }
      case 'Snowflake': {
        snowflake(s, props)
        break
      }
    }
  }

  function initialize() {
    s.clear()
    last = undefined
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.colorMode(s.HSB)
    initialize()
  }

  s.draw = () => {
    const props = getProps()
    if (last && Object.keys(last).every((prop) => last[prop] === props[prop])) {
      return
    }
    s.clear()
    s.push()
    // s.fill('#755dd4')
    s.fill('#d4a45d')
    s.rect(0, 0, window.innerWidth, window.innerHeight)
    s.pop()
    drawPattern(props)
    last = props
  }
}
