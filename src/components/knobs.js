import React from 'react'
import { getConfig, getValues, getProp, setProp } from 'utils/propConfig'

export default class Knobs extends React.Component {
  render() {
    const { pattern } = this.props
    const { config, values } = getConfig(pattern)

    const knobs = Object.entries(config).map(([prop, propConfig], i) => {
      if (typeof propConfig.when === 'function' && !propConfig.when()) {
        return null
      }
      if (propConfig.type === 'number') {
        const step = propConfig.step == null ? 1 : propConfig.step
        const min = propConfig.min == null ? 1 : propConfig.min
        const max = propConfig.max == null ? undefined : propConfig.max
        return (
          <label className="knob">
            {`${prop}: `}
            <input
              autoFocus={i === 0}
              key={prop}
              min={min}
              max={max}
              onChange={e => {
                setProp(pattern, prop, Number(e.target.value))
                this.forceUpdate()
              }}
              step={step}
              type="number"
              value={values[prop]}
            />
          </label>
        )
      }
      if (propConfig.type === 'boolean') {
        return (
          <label className="knob">
            {`${prop}: `}
            <input
              autoFocus={i === 0}
              key={prop}
              onChange={e => {
                setProp(pattern, prop, Boolean(e.target.checked))
                this.forceUpdate()
              }}
              type="checkbox"
              checked={values[prop]}
            />
          </label>
        )
      }
      if (propConfig.type === 'func') {
        return (
          <button
            autoFocus={i === 0}
            key={prop}
            onClick={propConfig.callback}
            children={propConfig.label}
          />
        )
      }
      return null
    })
    return <div className="knobs">{knobs}</div>
  }
}
