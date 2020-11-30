import React from 'react';

export default class ProductCard extends React.Component {
  constructor(props) {
    super(props);
    this.defaultImg = 'Default.svg';
    const { 'image_url': image = this.defaultImg, name, description, price, discount } = props.product;
    this.state = { image };
    this.name = name;
    this.price = price;
    this.description = description;
    this.regPrice = (price).toFixed(2);
    this.curPrice = (price - discount).toFixed(2);
    this.discount = (discount / price * 100).toFixed(0);
  }

  render() {
    return (
      <div className={'p-0 card d-inline-block whitespace-normal ' + this.props?.className}>
        <div className='card-body d-flex flex-column justify-content-between'>
          <div className='mb-2 card-img-top text-center'>
            <img
              className={this.props?.imgClass}
              src={`/images/${this.state.image}`}
              onError={() => this.setState({ image: this.defaultImg })}
              alt='' />
          </div>
          <h5 title={this.name} className='card-title text-truncate'>{this.name}</h5>
          {
            !this.props.hideDesc &&
            <p title={this.description} className={'card-text text-featured ' + this.props.descClass}>{this.description}</p>
          }
          <p title={`$${this.curPrice}`} className={'mb-0 card-text text-warning'}>&#36;{this.curPrice}</p>
          <p className='card-text text-truncate'>
            {
              this.discount > 0
              ? <><del>&#36;{this.regPrice}</del> (<small>{this.discount}% off</small>)</>
              : <>&nbsp;</>
            }
          </p>
        </div>
      </div>
    );
  }
};
