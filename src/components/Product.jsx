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
    };
  }

  setRecommended(recommended) { this.setState({ recommended: recommended.length > 0 }); }

  doFetch() {
    const id = new URLSearchParams(window.location.search).get('id');
    const query = buildQuery({ id });
    if (isNaN(parseInt(id))) return this.props.history.push('/');
    if (this.state.id === id) return;
    this.setState({ id });
    (async () => {
      const res = await fetch('/api/product' + query);
      const data = await res.json();
      if (res.ok) {
        const {
          images, name, description, information, price, discount,
          rating,
          'shipping_methods': shippingMethods,
          'user_rating': userRating,
          'rating_count': ratingCount,
         } = data;
        this.setState({
          name, description, information, price, discount, rating, userRating,
          ratingCount,
          images: images || [{}],
          shippingMethods: shippingMethods || [],
          shippingMethod: shippingMethods?.[0],
        });
        console.log(rating, userRating, ratingCount)
      } else console.error(data);
    })();
  }

  componentDidMount() { this.doFetch(); }

  componentDidUpdate() { this.doFetch(); }

  render() {
    const {
      id, images, name, description, information, price, discount, shippingMethod,
      shippingMethods, modalSrc, modalAlt, recommended, rating, userRating,
      ratingCount,
    } = this.state;
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
        <div className='container-fluid'>
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
              <h4>Preferred Shipping Method</h4>
              {
                shippingMethods.length > 0
                ? shippingMethods.map((method, i) => {
                  const isFirstMethod = method === shippingMethod;
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
                <Link to='/' className='btn btn-primary mr-2'>Buy now</Link>
                <Link to='/' className='btn btn-secondary'>Add to cart</Link>
              </div>
            </div>
          </div>
          {
            recommended &&
            <div className='row'>
              <div className='jumbotron col-12'>
                <h4 className='mb-5'>Related products</h4>
                {
                  id != null &&
                  <ProductBar location='/related' query={{ id }} fetchCB={recommended => this.setRecommended(recommended)} />
                }
              </div>
            </div>
          }
        </div>
      </main>
    );
  }
};

export default withRouter(Product);
