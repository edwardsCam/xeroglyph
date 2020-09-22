import React from 'react'
import { getConfig, setProp } from 'utils/propConfig.ts'

export default class Knobs extends React.Component<{ pattern: string }> {
  render() {
    const { pattern } = this.props
    const { config, values } = getConfig(pattern)

    const knobs = Object.entries(config).map(([prop, propConfig], i) => {
      if (typeof propConfig.when === 'function' && !propConfig.when()) {
        return null
      }

      const onChange = (getValue) => (e) => {
        setProp(pattern, prop, getValue(e))
        if (propConfig.onChange) {
          propConfig.onChange(e.target.value)
        }
        this.forceUpdate()
      }

      // @ts-ignore
      switch (propConfig.type) {
        case 'number': {
          const step = propConfig.step == null ? 1 : propConfig.step
          const min = propConfig.min == null ? 1 : propConfig.min
          const max = propConfig.max == null ? undefined : propConfig.max
          return (
            <label key={prop} className="knob">
              {`${prop}: `}
              <input
                className="knob-short-input"
                autoFocus={i === 0}
                min={min}
                max={max}
                onChange={onChange((e) => Number(e.target.value))}
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
                className="knob-short-input"
                autoFocus={i === 0}
                onChange={onChange((e) => Boolean(e.target.checked))}
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
              className="knob"
            />
          )

        case 'dropdown':
          return (
            propConfig.options && (
              <label key={prop}>
                {`${prop}: `}
                <select
                  name={prop}
                  onChange={onChange((e) => e.target.value)}
                  value={values[prop]}
                >
                  {propConfig.options.map((opt) => (
                    <option key={opt} value={opt} children={opt} />
                  ))}
                </select>
              </label>
            )
          )

        case 'string':
          return (
            <label key={prop} className="knob">
              {`${prop}: `}
              <input
                className="knob-text"
                name={prop}
                onChange={onChange((e) => e.target.value)}
                value={values[prop]}
              />
            </label>
          )

        default:
          return null
      }
    })
    return <div className="knobs">{knobs}</div>
  }
}
