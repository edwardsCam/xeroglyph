import React from 'react'
import { getConfig, getValues, getProp, setProp } from 'utils/propConfig'

export default class Knobs extends React.Component {
  render() {
    const { pattern } = this.props
    const { config, values } = getConfig(pattern)

    const knobs = Object.entries(config).map(([ prop, propConfig ], i) => {
      if (propConfig.type === 'number') {
        const step = propConfig.step == null ? 1 : propConfig.step
        const min = propConfig.min == null ? 1 : propConfig.min
        return (
          <label className='knob'>
            {`${prop}: `}
            <input autoFocus={i === 0} key={prop} value={values[prop]} type='number' step={step} onChange={e => {
              setProp(pattern, prop, e.target.value)
              this.forceUpdate()
            }} min={min} />
          </label>
        )
      }
    })
    return (
      <div className='knobs'>
        {knobs}
      </div>
    )
  }
}
