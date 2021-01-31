import { init as initProps, getProp } from 'utils/propConfig.ts'

type Props = {}

export default (s) => {
  initProps('${PATTERN}', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
  })
  const get = (prop: string) => getProp('${PATTERN}', prop)
  const getProps = (): Props => ({})

  function initialize() {
    s.clear()
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  s.draw = () => {
    s.fill('white')
    s.circle(25, 25, 25)
  }
}
