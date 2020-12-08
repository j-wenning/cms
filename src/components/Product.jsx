import React from 'react';
import Img from './Img';
import { buildQuery } from './URI';

export default class Product extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      images: [],
      name: '',
      description: '',
      price: 0,
      discount: 0,
      hoveredCarousel: false,
      shippingMethods: [],
      shippingMethod: '',
      modalSrc: null,
      modalAlt: null,
    };
  }

  handleHover(toggled) { this.setState({ hoveredCarousel: toggled }); }

  componentDidMount() {
    const id = new URLSearchParams(window.location.search).get('id');
    const query = buildQuery({ id });
    if (isNaN(parseInt(id))) return window.location.replace('/');
    (async () => {
      const res = await fetch('/api/product' + query);
      const data = await res.json();
      if (res.ok) {
        const { images, name, description, price, discount, 'shipping_methods': shippingMethods } = data;
        this.setState({
          name, description, price, discount,
          images: images || [{}],
          shippingMethods: shippingMethods || [],
          shippingMethod: shippingMethods?.[0]
        });
      } else console.error(data);
    })();
  }

  render() {
    const { price, discount, modalSrc, modalAlt } = this.state;
    const regPrice = (price).toFixed(2);
    const curPrice = (price - discount).toFixed(2);
    const percentOff = (discount / price * 100).toFixed(0);
    return (
      <main className='position-relative'>
        <div
          className='modal fade'
          id='product-img-modal'
          tabIndex='-1'
          aria-labelledby='product-img-modal-label'
          aria-hidden='true'>
          <div className='modal-dialog product-modal-dialog'>
            <div className='modal-content product-modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title' id='product-img-modal-label'>Image Preview:</h5>
                <button type='button' className='close' data-dismiss='modal' aria-label='Close'>
                  <span aria-hidden='true'>&times;</span>
                </button>
              </div>
              <div className='modal-body text-center'>
                <Img
                  src={modalSrc}
                  alt={modalAlt}
                  className='product-modal-img' />
              </div>
            </div>
          </div>
        </div>
        <div className='container-fluid'>
          <div className='row'>
            <div className='col-12 col-md-6 col-xl-4'>
              <div
                onMouseEnter={() => this.handleHover(true)}
                onMouseLeave={() => this.handleHover(false)}
                id='product-img-carousel'
                className='position-relative carousel slide border border-dark'
                data-ride='carousel'>
                {
                  this.state.hoveredCarousel &&
                  <div className='position-absolute position-center-full bg-dark opacity-1/4 passthrough z-1'></div>
                }
                <ol className='carousel-indicators'>
                  {
                    this.state.images.map((img, i) => {
                      const isFirst = i === 0;
                      return (
                        <li
                          data-target='#product-img-carousel'
                          data-slide-to={i}
                          key={i}
                          className={isFirst ? 'active' : ''} />
                      )
                    })
                  }
                </ol>
                <div className='carousel-inner'>
                  {
                    this.state.images.map((img, i) => {
                      let { url, alt } = img;
                      const isFirst = i === 0;
                      return (
                        <button
                          onClick={() => this.setState({ modalSrc: url, modalAlt: alt })}
                          data-toggle='modal'
                          data-target='#product-img-modal'
                          className={'btn carousel-item ' + (isFirst ? 'active' : '')}
                          type='button'
                          key={i}>
                          <Img
                            src={url}
                            alt={alt}
                            className='d-block' />
                        </button>
                      );
                    })
                  }
                </div>
                {
                  this.state.images.length > 1 &&
                  <>
                    <a className='carousel-control-prev' href='#product-img-carousel' role='button' data-slide='prev'>
                      <span className='carousel-control-prev-icon' aria-hidden='true' />
                      <span className='sr-only'>Previous</span>
                    </a>
                    <a className='carousel-control-next' href='#product-img-carousel' role='button' data-slide='next'>
                      <span className='carousel-control-next-icon' aria-hidden='true' />
                      <span className='sr-only'>Next</span>
                    </a>
                  </>
                }
              </div>
            </div>
            <div className='col-12 col-md-6 col-xl-5'>
              <h4>{this.state.name}</h4>
              <h5>
                <span className='text-primary'>${curPrice}&nbsp;</span>
                {
                  this.state.discount > 0 &&
                  <span className='text-secondary'><del>${regPrice}</del> ({percentOff}% off)</span>
                }
              </h5>
              <p>{this.state.description}</p>
            </div>
            <div className='col-12 col-xl-3 d-flex flex-column order-first order-xl-0'>
              {
                this.state.shippingMethods.length > 0
                ? this.state.shippingMethods.map((method, i) => {
                  const isFirstMethod = method === this.state.shippingMethod;
                  const shipping = method.toLocaleUpperCase()[0] + method.substr(1).toLocaleLowerCase()
                  return (
                    <label key={i}>
                      <input
                        type='radio'
                        id={'product-order-radio-' + i}
                        onChange={() => {}}
                        defaultChecked={isFirstMethod}
                        className='mr-2'
                        name='product-order-radio' />
                      <span>{shipping} shipping</span>
                    </label>
                  );
                })
                : <p>No shipping methods available.</p>
              }
              <div>
                <a href='' className='btn btn-primary mr-2'>Buy now</a>
                <a href='' className='btn btn-secondary'>Add to cart</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
};
