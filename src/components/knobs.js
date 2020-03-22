import React from 'react'
import { getConfig, setProp } from 'utils/propConfig'

export default class Knobs extends React.Component {
  render() {
    const { pattern } = this.props
    const { config, values } = getConfig(pattern)

    const knobs = Object.entries(config).map(([prop, propConfig], i) => {
      if (typeof propConfig.when === 'function' && !propConfig.when()) {
        return null
      }

      switch (propConfig.type) {
        case 'number': {
          const step = propConfig.step == null ? 1 : propConfig.step
          const min = propConfig.min == null ? 1 : propConfig.min
          const max = propConfig.max == null ? undefined : propConfig.max
          return (
            <label key={prop} className="knob">
              {`${prop}: `}
              <input
                autoFocus={i === 0}
                min={min}
                max={max}
                onChange={e => {
                  setProp(pattern, prop, Number(e.target.value))
                  if (propConfig.onChange) {
                    propConfig.onChange(e.target.value)
                  }
                  this.forceUpdate()
                }}
                step={step}
                type="number"
                value={values[prop]}
              />
            </label>
          )
        }
        case 'boolean':
          return (
            <label key={prop} className="knob">
              {`${prop}: `}
              <input
                autoFocus={i === 0}
                onChange={e => {
                  setProp(pattern, prop, Boolean(e.target.checked))
                  if (propConfig.onChange) {
                    propConfig.onChange(e.target.value)
                  }
                  this.forceUpdate()
                }}
                type="checkbox"
                checked={values[prop]}
              />
            </label>
          )
        case 'func':
          return (
            <button
              autoFocus={i === 0}
              key={prop}
              onClick={propConfig.callback}
              children={propConfig.label}
            />
          )

        case 'dropdown':
          return (
            <label key={prop}>
              {`${prop}: `}
              <select
                name={prop}
                onChange={e => {
                  setProp(pattern, prop, e.target.value)
                  if (propConfig.onChange) {
                    propConfig.onChange(e.target.value)
                  }
                  this.forceUpdate()
                }}
                value={values[prop]}
              >
                {propConfig.options.map(opt => (
                  <option key={opt} value={opt} children={opt} />
                ))}
              </select>
            </label>
          )

        default:
          return null
      }
    })
    return <div className="knobs">{knobs}</div>
  }
}
