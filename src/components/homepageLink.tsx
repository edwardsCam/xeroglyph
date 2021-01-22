import React from 'react'

export default class HomepageLink extends React.Component<{
  className: string
  onClick: (e: React.MouseEvent) => any
  href: string
  label: string
}> {
  render() {
    const { className, onClick, href, label } = this.props
    return (
      <a className={`homepage-link ${className}`} onClick={onClick} href={href}>
        {label}
      </a>
    )
  }
}
