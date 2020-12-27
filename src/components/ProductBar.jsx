import React from 'react';
import ProductCard from './ProductCard';
import { isEqual } from './Object';
import { buildQuery } from './URI';

export default class ProductBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      products: [],
      hovered: false
    };
    this.scrollInterval = null;
    this.scrollIntervalPoll = 20;
    this.scrollArea = React.createRef();
    this.scrollSpeed = this.props?.scrollSpeed || 20;
    this.controller = new AbortController();
    // maybe implement a ramping speed for more items (?)
  }

  componentWillUnmount() {
    clearInterval(this.scrollInterval);
    this.controller.abort();
  }

  handleMouseEnter() {
    const { scrollWidth, offsetWidth } = this.scrollArea.current;
    if (scrollWidth > offsetWidth && !this.state.hovered) this.setState({ hovered: true });
  }

  handleMouseLeave() { if (this.state.hovered) this.setState({ hovered: false }); }

  scrollXDown(direction) {
    clearInterval(this.scrollInterval);
    this.scrollInterval = setInterval(() => {
      this.scrollArea.current.scrollLeft += Math.sign(direction) * this.scrollSpeed;
    }, this.scrollIntervalPoll);
  }

  scrollXUp() { clearInterval(this.scrollInterval); }

  doFetch() {
    let { location = '', query = '' } = this.props;
    const signal = this.controller.signal;
    query = buildQuery(query);
    fetch('/api/products' + location + query, { signal })
      .then(res => {
        const json = res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => {
        const { products } = data;
        const fetchCB = this.props.fetchCB;
        this.setState({ products });
        if (fetchCB) fetchCB(products);
      }).catch(err => (async () => console.error(await err))());
  }

  componentDidUpdate(prevProps) { if (!isEqual(prevProps, this.props)) this.doFetch(); }

  componentDidMount() { this.doFetch(); }

  render() {
    return (
      <div className={'product-bar position-relative ' + this.props.className}>
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
            this.state.products.map((product, i) => {
              let endClass = ''
              switch(i) {
                case 0:
                  endClass = 'ml-0'
                  break
                case this.state.products.length - 1:
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
