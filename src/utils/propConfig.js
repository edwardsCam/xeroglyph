const index = {}

const getConfig = pattern => index[pattern]
const getProp = (pattern, prop) => index[pattern].values[prop]
const setProp = (pattern, prop, value) => {
  index[pattern].values[prop] = value
}

const init = (pattern, props) => {
  index[pattern] = {}
  index[pattern].config = props
  index[pattern].values = Object.entries(props).reduce((obj, entry) => {
    obj[entry[0]] = entry[1].default
    return obj
  }, {})
}

export { getConfig, getProp, setProp, init }
