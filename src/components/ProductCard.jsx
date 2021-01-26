import React from 'react';
import { Link } from 'react-router-dom'
import Img from './Img';
import { buildQuery } from './URI';

export default class ProductCard extends React.Component {
  constructor(props) {
    super(props);
    const { img } = props.product;
    const { url, alt } = (img || {});
    this.state = { url, alt };
  }

  render() {
    const { id, name, description, price, discount } = this.props.product;
    const regPrice = (price).toFixed(2);
    const curPrice = (price - discount).toFixed(2);
    const percentOff = (discount / price * 100).toFixed(0);
    const query = buildQuery({ id });
    return (
      <Link
        to={{
          pathname: '/product',
          search: query,
          state: { prevLocation: this.props.location }
        }}
        className={'p-0 card d-inline-block whitespace-normal text-reset text-decoration-none ' + this.props?.className}>
        <div className='card-body d-flex flex-column justify-content-between'>
          <div className='mb-2 card-img-top text-center'>
            <Img
              src={this.state.url}
              alt={this.state.alt}
              className={this.props?.imgClass} />
          </div>
          <h5 title={name} className='card-title text-truncate'>{name}</h5>
          {
            !this.props.hideDesc &&
            <p title={description} className={'card-text text-featured ' + this.props.descClass}>{description}</p>
          }
          <p title={`$${curPrice}`} className={'mb-0 card-text text-warning'}>&#36;{curPrice}</p>
          <p className='card-text text-truncate'>
            {
              discount > 0
              ? <><del>&#36;{regPrice}</del> (<small>{percentOff}% off</small>)</>
              : <>&nbsp;</>
            }
          </p>
        </div>
      </Link>
    );
  }
};
