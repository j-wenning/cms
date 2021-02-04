import React from 'react';
import ReactMD from 'react-markdown';
import { Link, withRouter } from 'react-router-dom';
import Img from './Img';
import ProductBar from './ProductBar';
import RatingBar from './RatingBar';
import { buildQuery } from './URI';

class Product extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: null,
      images: [],
      name: '',
      description: '',
      information: '',
      price: 0,
      discount: 0,
      shippingMethods: [],
      shippingMethod: '',
      modalSrc: null,
      modalAlt: null,
      recommended: true,
      rating: null,
      userRating: null,
      ratingCount: null,
      qty: 0,
      buyQty: 1,
    };
  }

  setRecommended(recommended) { this.setState({ recommended: recommended.length > 0 }); }

  doFetch() {
    const id = new URLSearchParams(this.props.location.search).get('id');
    const query = buildQuery({ id });
    if (isNaN(parseInt(id))) return this.props.history.push('/');
    if (this.state.id === id) return;
    this.setState({ id });
    fetch('/api/product' + query)
      .then(res => {
        const json = res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => {
        const {
          images, name, description, information, price, discount,
          rating, qty,
          'shipping_methods': shippingMethods,
          'user_rating': userRating,
          'rating_count': ratingCount,
         } = data;
        this.setState({
          name, description, information, price, discount, rating, userRating,
          ratingCount, qty,
          images: images || [{}],
          shippingMethods: shippingMethods || [],
          shippingMethod: shippingMethods?.[0],
        });
      }).catch(err => (async () => console.error(await err))());
  }

  doCartFetch() {
    const { id } = this.state;
    fetch('/api/cart/product', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, qty: 1 }),
    }).then(res => { if (!res.ok) throw res.json(); })
      .then(() => document.dispatchEvent(new Event('cartQtyUpdate')))
      .catch(err => (async () => console.error(await err))());
  }

  doBuyNow() {
    const { id: pid, shippingMethods: methods, shippingMethod, buyQty: qty } = this.state;
    const shipping = btoa(JSON.stringify({
      methods,
      method: methods.findIndex(method => method.id === shippingMethod.id)
    }));
    this.props.history.push({
      pathname: '/checkout',
      search: buildQuery({ pid, qty, shipping }),
    });
  }

  updateBuyQty(val) { this.setBuyQty(this.state.buyQty + val); }

  setBuyQty(val) { this.setState({ buyQty: val === '' ? val : Math.min(Math.max(1, val), this.state.qty) }); }

  goBack(prevLocation) {
    if (prevLocation === '/') return this.props.history.push(prevLocation);
    this.props.history.goBack();
  }

  preventDefault(e, cb) {
    e.preventDefault();
    cb();
  }

  componentDidMount() { this.doFetch(); }

  componentDidUpdate() { this.doFetch(); }

  render() {
    const {
      id, images, name, description, information, price, discount,
      shippingMethods, modalSrc, modalAlt, recommended, rating, userRating,
      ratingCount, qty, buyQty
    } = this.state;
    const { prevLocation = '/' } = this.props.location.state || {};
    const regPrice = (price).toFixed(2);
    const curPrice = (price - discount).toFixed(2);
    const percentOff = (discount / price * 100).toFixed(0);
    return (
      <main className='position-relative mt-2'>
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
        <div
          className='modal fade'
          id='cart-modal'
          tabIndex='-1'
          aria-labelledby='cart-modal-label'
          aria-hidden='true'>
          <div className='modal-dialog'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title' id='cart-modal-label'>Product added to cart</h5>
                <button type='button' className='close' data-dismiss='modal' aria-label='Close'>
                  <span aria-hidden='true'>&times;</span>
                </button>
              </div>
              <div className='modal-footer justify-content-center justify-content-sm-end'>
                <Link
                  to={prevLocation}
                  onClick={e => this.preventDefault(e, () => this.goBack(prevLocation) )}
                  className='btn btn-secondary'
                  data-dismiss='modal'>Back to shopping</Link>
                <Link
                  to='/cart'
                  onClick={e => this.preventDefault(e, () => this.props.history.push('/cart'))}
                  className='btn btn-primary'
                  data-dismiss='modal'>View cart</Link>
              </div>
            </div>
          </div>
        </div>
        <div className='container'>
          <div className='row'>
            <div className='container col-12 col-xl-9'>
              <div className='row'>
                <div
                  id='product-img-carousel'
                  className='position-relative carousel slide col-12 col-md-6 mb-5'
                  data-ride='carousel'>
                  <ol className='carousel-indicators'>
                    {
                      images.map((img, i) => {
                        const isFirst = i === 0;
                        return (
                          <li
                            data-target='#product-img-carousel'
                            data-slide-to={i}
                            key={i}
                            className={`border border-dark ${isFirst ? 'active' : ''}`} />
                        )
                      })
                    }
                  </ol>
                  <div className='carousel-inner border border-dark rounded'>
                    {
                      images.map((img, i) => {
                        let { url, alt } = img;
                        const isFirst = i === 0;
                        return (
                          <button
                            onClick={() => this.setState({ modalSrc: url, modalAlt: alt })}
                            data-toggle='modal'
                            data-target='#product-img-modal'
                            className={'btn carousel-item text-center ' + (isFirst ? 'active' : '')}
                            type='button'
                            key={i}>
                            <Img
                              src={url}
                              alt={alt}
                              className='product-preview' />
                          </button>
                        );
                      })
                    }
                  </div>
                  {
                    images.length > 1 &&
                    <>
                      <a className='carousel-control-prev pl-3 pl-sm-2 pl-md-0' href='#product-img-carousel' role='button' data-slide='prev'>
                        <span className='carousel-control-prev-icon' aria-hidden='true' />
                        <span className='sr-only'>Previous</span>
                      </a>
                      <a className='carousel-control-next pr-3 pr-sm-2 pr-md-0' href='#product-img-carousel' role='button' data-slide='next'>
                        <span className='carousel-control-next-icon' aria-hidden='true' />
                        <span className='sr-only'>Next</span>
                      </a>
                    </>
                  }
                </div>
                <div className='col-12 col-md-6 mb-5'>
                  <h4>{name}</h4>
                  <h5>
                    <span className='text-primary'>${curPrice}&nbsp;</span>
                    {
                      discount > 0 &&
                      <span className='text-secondary'><del>${regPrice}</del> ({percentOff}% off)</span>
                    }
                  </h5>
                  <p>{description}</p>
                  <h4>Rating</h4>
                  <RatingBar className='mb-2' rating={userRating} id={id} />
                  <p className='text-info'>Average rating: {rating} stars</p>
                  <p className='text-info'>Total ratings: {ratingCount}</p>
                </div>
              </div>
              <div className='row'>
                <div className='col-12'>
                  <ReactMD className='product-markdown'>{information}</ReactMD>
                </div>
              </div>
            </div>
            <div className='col-12 col-xl-3 d-flex flex-column order-first order-xl-0 mb-5'>
              <h4>Purchase</h4>
              {
                shippingMethods.length > 0
                ? shippingMethods.map((method, i) => {
                  const isFirstMethod = i === 0;
                  let { id, name } = method;
                  name = name.toLocaleUpperCase()[0] + name.substr(1).toLocaleLowerCase();
                  return (
                    <label key={id}>
                      <input
                        type='radio'
                        id={'product-order-radio-' + id}
                        onChange={() => this.setState({ shippingMethod: method })}
                        defaultChecked={isFirstMethod}
                        className='mr-2'
                        name='product-order-radio' />
                      <span>{name} shipping</span>
                    </label>
                  );
                })
                : <p>No shipping methods available.</p>
              }
              {
                qty <= 0
                ? <p className='mb-1 text-danger'>Out of stock</p>
                : <>
                    <div className='input-group mb-3 justify-content-end justify-content-md-start'>
                      <div className='input-group-prepend'>
                        <button
                          onClick={() => this.updateBuyQty(-1)}
                          className='btn btn-outline-secondary'
                          type='button'>-</button>
                      </div>
                      <input
                        value={buyQty}
                        onChange={e => this.setBuyQty(e.target.value)}
                        type='number'
                        className='form-control product-qty-input'
                        aria-label='Quantity' />
                      <div className='input-group-append'>
                        <button
                          onClick={() => this.updateBuyQty(1)}
                          className='btn btn-outline-secondary'
                          type='button'>+</button>
                      </div>
                    </div>
                    <div>
                      <Link
                        to='/checkout'
                        onClick={e => this.preventDefault(e, () => this.doBuyNow())}
                        tabIndex={qty <= 0 ? -1 : 0}
                        aria-disabled={qty <= 0}
                        className={`btn btn-primary mr-2 ${qty <= 0 && 'disabled'}`}
                        >Buy now</Link>
                      <button
                        disabled={qty <= 0}
                        onClick={() => this.doCartFetch()}
                        data-toggle='modal'
                        data-target='#cart-modal'
                        className='btn btn-primary mr-2'
                        type='button'>Add to cart</button>
                    </div>
                  </>
              }
            </div>
          </div>
        </div>
        {
          recommended &&
          <div className='jumbotron col-12'>
            <h4 className='mb-5'>Related Products</h4>
            {
              id != null &&
              <ProductBar location='/related' query={{ id }} fetchCB={recommended => this.setRecommended(recommended)} />
            }
          </div>
        }
      </main>
    );
  }
};

export default withRouter(Product);
