import React from 'react';

export default class Img extends React.Component {
  constructor(props) {
    super(props);
    const { src = '', alt = '', className = '' } = props;
    this.state = {
      src,
      alt,
      className
    }
  }
  render() {
    const errSrc = 'Default.svg';
    const { src, alt, className } = this.state;
    return (
      <img
        src={'/images/' + src}
        alt={alt}
        onError={() => this.setState({ src: errSrc })}
        className={className} />
    );
  }
}
