type PatternConfig = {
  [propName: string]: {
    type:
      | 'number'
      | 'boolean'
      | 'func'
      | 'dropdown'
      | 'string'
      | 'string-multiline'
    default?: any
    min?: number
    max?: number
    step?: number
    when?: () => boolean
    onChange?: (e: any) => any
    callback?: () => any
    label?: string
    labelFn?: () => string
    options?: string[]
  }
}

type Pattern = {
  config: PatternConfig
  values: {
    [propName: string]: any
  }
}

const index: {
  [pattern: string]: Pattern
} = {}

const getConfig = (pattern: string): Pattern => index[pattern]
const getProp = (pattern: string, prop: string): any =>
  index[pattern].values[prop]
const setProp = (pattern: string, prop: string, value: any): void => {
  index[pattern].values[prop] = value
}

const init = (pattern: string, props: PatternConfig): void => {
  index[pattern] = {
    config: props,
    values: Object.entries(props).reduce((obj, entry) => {
      obj[entry[0]] = entry[1].default
      return obj
    }, {}),
  }
}

export { getConfig, getProp, setProp, init }
