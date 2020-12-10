import React from 'react';
import ProductCard from './ProductCard';
import { buildQuery } from './URI';

export default class ProductBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      featured: [],
      hovered: false
    };
    this.scrollInterval = null;
    this.scrollIntervalPoll = 20;
    this.scrollArea = React.createRef();
    this.scrollSpeed = this.props?.scrollSpeed || 20;
    // maybe implement a ramping speed for more items (?)
  }

  componentWillUnmount() { clearInterval(this.scrollInterval); }

  handleMouseEnter() {
    const { scrollWidth, offsetWidth } = this.scrollArea.current;
    if (scrollWidth > offsetWidth) this.setState({ hovered: true });
  }

  handleMouseLeave() { this.setState({ hovered: false }); }

  scrollXDown(direction) {
    clearInterval(this.scrollInterval);
    this.scrollInterval = setInterval(() => {
      this.scrollArea.current.scrollLeft += Math.sign(direction) * this.scrollSpeed;
    }, this.scrollIntervalPoll);
  }

  scrollXUp() { clearInterval(this.scrollInterval); }

  componentDidMount() {
    let { location = '', query = '' } = this.props;
    query = buildQuery(query);
    (async () => {
      const res = await fetch('/api/products' + location + query);
      const data = await res.json();
      if (res.ok) {
        const { products } = data;
        this.setState({ featured: products });
      } else console.error(data);
    })();
  }

  render() {
    return (
      <div className={'position-relative ' + this.props.className}>
        <div
          ref={this.scrollArea}
          onMouseEnter={() => this.handleMouseEnter()}
          onMouseLeave={() => this.handleMouseLeave()}
          className='p-0 mx-0 container-fluid card-deck displaybar'>
          {
            this.state.hovered &&
            <div className='h-100 w-100 position-absolute position-center d-flex justify-content-between align-items-center passthrough z-1'>
              <button
                onMouseDown={() => this.scrollXDown(-1)}
                onMouseUp={() => this.scrollXUp()}
                onMouseLeave={() => this.scrollXUp()}
                type='button'
                className='btn btn-secondary opacity-4/5'>
                <img src='/bootstrap/chevron-left.svg' alt='' className='my-5 filter-invert' />
              </button>
              <button
                onMouseDown={() => this.scrollXDown(1)}
                onMouseUp={() => this.scrollXUp()}
                onMouseLeave={() => this.scrollXUp()}
                type='button'
                className='btn btn-secondary opacity-4/5'>
                <img src='/bootstrap/chevron-right.svg' alt='' className='my-5 filter-invert' />
              </button>
            </div>
          }
          {
            this.state.featured.map((product, i) => {
              let endClass = ''
              switch(i) {
                case 0:
                  endClass = 'ml-0'
                  break
                case this.state.featured.length - 1:
                  endClass = 'mr-0'
                  break
                default: break
              }
              return (
                <ProductCard
                  product={product}
                  hideDesc={true}
                  className={endClass + ' product-col-1 product-col-md-3 product-col-lg-6'}
                  imgClass='img-thumbnail-1 img-md-thumbnail-3 img-lg-thumbnail-6'
                  key={product.id} />
              )
            })
          }
        </div>
      </div>
    );
  }
};
