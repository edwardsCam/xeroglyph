import * as _p5_ from 'p5'
import React from 'react'
import P5Wrapper from 'react-p5-wrapper'
import ReactDOM from 'react-dom'

import { board, city } from 'patterns/chipboard'
import InfinityCycle from 'patterns/infinity-cycle'
import Roots from 'patterns/roots'
import Swirl from 'patterns/swirl'

import AAA from 'patterns/exp'

const getPattern = () => {
  const patternParam = window.location.search.split('pattern=')
  if (patternParam.length <= 1) return Swirl

  const pattern = patternParam[1]
  switch (pattern) {
    case 'infinity': return InfinityCycle
    case 'swirl': return Swirl
    case 'chipboard': return board
    case 'city': return city
  }
}

class App extends React.Component {
  render() {
    return <P5Wrapper sketch={getPattern()} />
  }
}

ReactDOM.render(<App />, document.body)
