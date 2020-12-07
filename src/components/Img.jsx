import React from 'react';
import { difference } from './Set';

export default class Img extends React.Component {
  constructor(props) {
    super(props);
    this.state = {}
    this.getPropsAsState();
  }

  getPropsAsState() {
    const {src, alt, className } = this.props;
    this.setState({ src, alt, className, err: false });
  }

  componentDidUpdate(prevProps) {
    const isNewProps = difference(Object.values(prevProps), Object.values(this.props)).size > 0;
    if (isNewProps) this.getPropsAsState();
  }

  componentDidMount() { this.getPropsAsState(); }

  render() {
    let { src, alt, className, err } = this.state;
    if (err) {
      src = 'Default.svg';
      alt = 'Missing image';
    }
    return (
      <img
        src={'/images/' + src}
        alt={alt}
        onError={() => this.setState({ err: true })}
        className={className} />
    );
  }
}
