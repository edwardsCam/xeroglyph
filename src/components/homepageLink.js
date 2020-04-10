import React from 'react'

export default class HomepageLink extends React.Component {
  render() {
    return (
      <a
        className={`homepage-link ${this.props.className}`}
        onClick={this.props.onClick}
        href={this.props.href}
      >
        {this.props.label}
      </a>
    )
  }
}
