import { init as initProps, getProp } from 'utils/propConfig.ts'
import { Props, _PATTERNS, _ZECTANGLE_SHAPES } from './common'
import page71 from './page-71'
import zectangles from './zectangle'

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
    borderWeight: {
      type: 'number',
      default: 0.5,
      min: 0,
      step: 0.1,
      when: () => get('pattern') === 'Page 71',
    },
    n: {
      type: 'number',
      default: 6,
      min: 1,
      when: () => get('pattern') === 'Page 71',
    },
    degree: {
      type: 'number',
      default: 9,
      min: 1,
      when: () => get('pattern') === 'Zectangle',
    },
    shape: {
      type: 'dropdown',
      default: _ZECTANGLE_SHAPES[0],
      options: [..._ZECTANGLE_SHAPES],
      when: () => get('pattern') === 'Zectangle',
    },
  })

  let last: Props

  const get = (prop: string) => getProp('sacredGeometry', prop)
  const getProps = (): Props => ({
    pattern: get('pattern'),
    len: get('len'),
    innerWeight: get('innerWeight'),
    borderWeight: get('borderWeight'),
    n: get('n'),
    degree: get('degree'),
    shape: get('shape'),
  })

  const drawPattern = (props: Props): void => {
    s.stroke('white')
    switch (props.pattern) {
      case 'Page 71': {
        page71(s, props)
        break
      }
      case 'Zectangle': {
        zectangles(s, props)
        break
      }
    }
  }

  function initialize() {
    s.clear()
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  s.draw = () => {
    const props = getProps()
    if (last && Object.keys(last).every((prop) => last[prop] === props[prop])) {
      return
    }
    s.clear()
    drawPattern(props)
    last = props
  }
}
