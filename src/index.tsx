import React from 'react'
import P5Wrapper from 'react-p5-wrapper'
import ReactDOM from 'react-dom'

import Poi from 'patterns/poi'
import { board, city } from 'patterns/chipboard'
import InfinityCycle from 'patterns/infinity-cycle'
import Swirl from 'patterns/swirl'
import JoyDivision from 'patterns/joy-division'
import Coral from 'patterns/coral'
import Coral3D from 'patterns/coral-3d'
import Cubes from 'patterns/cubes'
import Field from 'patterns/field'
import Chonks from 'patterns/chonks'
import PixelSorting from 'patterns/pixel-sorting'
import Mountain from 'patterns/mountain'
import Starscape from 'patterns/starscape'
import SacredGeometry from 'patterns/sacred-geometry'
import Pandemic from 'patterns/pandemic'
import Flower from 'patterns/flower'
import SpaceColonization from 'patterns/space-colonization'
import Castles from 'patterns/castles'
import Beads from 'patterns/beads'
import ChaosGame from 'patterns/chaos-game'
import Topo from 'patterns/topo'
import Waveform from 'patterns/waveform'
import Bamboo from 'patterns/bamboo'
import Hometown from 'patterns/hometown'
// import Checkers from 'patterns/checkers'
import Eye from 'patterns/eye'
// import ISpy from 'patterns/i-spy'
// import Trinkets from 'patterns/trinkets'
import Tiles from 'patterns/tiles'
import Vida from 'patterns/vida'
// import VoiceRecognition from 'patterns/voice-recognition'
import PandorasBox from 'patterns/pandoras-box'
import Squid from 'patterns/squid'

import HelpModal from 'components/helpModal'
import Knobs from 'components/knobs'
import HomepageLink from 'components/homepageLink'

const patternMap = {
  field: {
    label: 'FlowField',
    component: Field,
  },
  waveform: {
    label: 'Waveform',
    component: Waveform,
  },
  topo: {
    label: 'Topo',
    component: Topo,
  },
  sacredGeometry: {
    label: 'Sacred Geometry',
    component: SacredGeometry,
  },
  chaosGame: {
    label: 'Chaos Game',
    component: ChaosGame,
  },
  spaceColonization: {
    label: 'Space Colonization',
    component: SpaceColonization,
  },
  hometown: {
    label: 'Hometown',
    component: Hometown,
  },
  chonks: {
    label: 'Chonks',
    component: Chonks,
  },
  starscape: {
    label: 'Starscape',
    component: Starscape,
  },
  bamboo: {
    label: 'Bamboo',
    component: Bamboo,
  },
  castles: {
    label: 'Castles',
    component: Castles,
  },
  flower: {
    label: 'Flower',
    component: Flower,
  },
  pandemic: {
    label: 'Pandemic',
    component: Pandemic,
  },
  chipboard: {
    label: 'Chipboard',
    component: board,
  },
  coral: {
    label: 'Coral',
    component: Coral,
  },
  pixelSorting: {
    label: 'Pixel Sorting',
    component: PixelSorting,
  },
  beads: {
    label: 'Beads',
    component: Beads,
  },
  tiles: {
    label: 'Tiles',
    component: Tiles,
  },
  poi: {
    label: 'Poi',
    component: Poi,
  },
  squid: {
    label: 'Squid',
    component: Squid,
  },
  mountain: {
    label: 'Mountain',
    component: Mountain,
  },
  motionDetection: {
    label: 'Motion Detection',
    component: Vida,
  },
  pandorasBox: {
    label: "Pandora's Box",
    component: PandorasBox,
  },
  eye: {
    label: 'Eye',
    component: Eye,
  },
  cubes: {
    label: 'Cubes',
    component: Cubes,
  },
  swirl: {
    label: 'Swirl',
    component: Swirl,
  },
  joyDivision: {
    label: 'Joy Division',
    component: JoyDivision,
  },
  infinity: {
    label: 'Infinity Cycle',
    component: InfinityCycle,
  },
  city: {
    label: 'Cityscape',
    component: city,
  },
  coral3d: {
    label: 'Coral 3D',
    component: Coral3D,
  },
}

type State = {
  init: boolean
  pattern: string | null
  isShowingHelpModal: boolean
  isShowingKnobs: boolean
}

class App extends React.Component<{}, State> {
  state: State = {
    init: true,
    pattern: null,
    isShowingHelpModal: true,
    isShowingKnobs: false,
  }

  initPattern() {
    const begin = () => {
      this.setState({
        isShowingHelpModal: false,
        isShowingKnobs: false,
        init: false,
      })
      window.removeEventListener('click', begin)
      window.addEventListener('click', () => this.toggleOptions())
    }

    setTimeout(() => {
      window.addEventListener('click', begin)
      window.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'i':
          case 'Escape':
            if (this.state.init) {
              begin()
            } else {
              this.setState((prevState) => ({
                isShowingHelpModal: !prevState.isShowingHelpModal,
                isShowingKnobs: false,
              }))
            }
            break
          case 'o':
            this.toggleOptions()
            break
        }
      })
    })
  }

  toggleOptions = () => {
    if (!this.state.init) {
      this.setState((prevState) => ({
        isShowingKnobs: !prevState.isShowingKnobs,
        isShowingHelpModal: false,
      }))
    }
  }

  componentDidMount() {
    window.addEventListener('popstate', function () {
      window.history.go(0)
    })

    const { search } = window.location
    if (search && search.startsWith('?pattern=')) {
      const [, pattern] = search.split('?pattern=')
      this.setState({ pattern })
    }
  }

  componentDidUpdate(_prevProps, prevState) {
    if (this.state.pattern && !prevState.pattern) {
      this.initPattern()
    }
  }

  render() {
    return this.state.pattern ? this.renderPattern() : this.renderIndex()
  }

  renderPattern() {
    const { pattern, init, isShowingKnobs, isShowingHelpModal } = this.state
    return (
      pattern && (
        <div>
          {!init && <P5Wrapper sketch={patternMap[pattern].component} />}
          {(isShowingHelpModal || init) && (
            <HelpModal pattern={pattern} initial={init} />
          )}
          {isShowingKnobs && <Knobs pattern={pattern} />}
        </div>
      )
    )
  }

  renderIndex() {
    const patterns = Object.keys(patternMap)

    return (
      <div className="index">
        <div className="index-list">
          <div className="index-column">
            {patterns
              .filter((_p, i) => !(i % 2))
              .map((pattern) => (
                <HomepageLink
                  key={pattern}
                  {...this.generateLinkProps(pattern)}
                />
              ))}
          </div>
          <div className="index-column">
            {patterns
              .filter((_p, i) => i % 2)
              .map((pattern) => (
                <HomepageLink
                  key={pattern}
                  {...this.generateLinkProps(pattern)}
                />
              ))}
          </div>
        </div>
        <div className="footer">
          <a
            className="footer-link"
            href="https://github.com/edwardsCam/xeroglyph"
            target="_blank"
            children="Code"
          />
        </div>
      </div>
    )
  }

  generateLinkProps = (pattern: string) => {
    const config = patternMap[pattern]
    return {
      label: config.label,
      href: `/?pattern=${pattern}`,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        window.history.pushState({ pattern }, '', `?pattern=${pattern}`)
        this.setState({ pattern })
      },
      className: pattern,
    }
  }
}

ReactDOM.render(<App />, document.body)
