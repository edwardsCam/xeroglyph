import React from 'react'
import P5Wrapper from 'react-p5-wrapper'
import ReactDOM from 'react-dom'

import { board, city } from 'patterns/chipboard'
import InfinityCycle from 'patterns/infinity-cycle'
import Swirl from 'patterns/swirl'

import HelpModal from 'components/helpModal'

const defaultPattern = 'swirl'

const patternMap = {
  infinity: InfinityCycle,
  swirl: Swirl,
  chipboard: board,
  city: city
}

const getPattern = () => {
  const patternParam = window.location.search.split('pattern=')
  return patternParam.length > 1 ? patternParam[1] : 'swirl'
}

const getSketch = () => patternMap[getPattern()]

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isShowingHelpModal: false
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', e => {
      if (e.key == 'i') {
        this.setState(prevState => ({ isShowingHelpModal: !prevState.isShowingHelpModal }))
      }
    })
  }

  render() {
    return (
      <div>
        <P5Wrapper sketch={getSketch()} />
        {this.state.isShowingHelpModal && <HelpModal pattern={getPattern()} />}
      </div>
    )
  }
}

ReactDOM.render(<App />, document.body)
