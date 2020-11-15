import { init as initProps, getProp } from 'utils/propConfig.ts'
import { Props, _PATTERNS } from './common'
import page71 from './page-71'

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
      default: 100,
      min: 5,
      step: 5,
    },
    innerWeight: {
      type: 'number',
      default: 1,
      min: 0,
      step: 0.1,
    },
    borderWeight: {
      type: 'number',
      default: 0.5,
      min: 0,
      step: 0.1,
    },
    n: {
      type: 'number',
      default: 6,
      min: 1,
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
  })

  const drawPattern = (props: Props): void => {
    s.stroke('white')
    switch (props.pattern) {
      case 'Page 71': {
        page71(s, props)
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
