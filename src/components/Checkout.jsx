import React from 'react';
import $ from 'jquery';
import { Link, withRouter } from 'react-router-dom';
import { months, countries } from './Lists';
import { parseQuery } from './URI';

class Checkout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      addresses:          [],
      paymentMethods:     [],
      shippingMethods:    [],
      curAddress:         null,
      curPaymentMethod:   null,
      curShippingMethod:  null,
      address1:           '',
      address1Blur:       false,
      address1Valid:      false,
      address2:           '',
      city:               '',
      cityBlur:           false,
      cityValid:          false,
      region:             '',
      regionBlur:         false,
      regionValid:        false,
      postalCode:         '',
      postalCodeBlur:     false,
      postalCodeValid:    false,
      country:            '',
      countryBlur:        false,
      countryValid:       false,
      cardNumber:         '',
      cardNumberBlur:     false,
      cardNumberValid:    false,
      securityCode:       '',
      securityCodeBlur:   false,
      securityCodeValid:  false,
      cardName:           '',
      cardNameBlur:       false,
      cardNameValid:      false,
      expiryMonth:        '',
      expiryMonthBlur:    false,
      expiryMonthValid:   false,
      expiryYear:         '',
      expiryYearBlur:     false,
      expiryYearValid:    false,
    };
    this.addressRef = React.createRef();
    this.addressDupeRef = React.createRef();
    this.addressPopTimeout = null;
    this.paymentMethodRef = React.createRef();
    this.paymentMethodDupeRef = React.createRef();
    this.paymentMethodPopTimeout = null;
  }

  filterInput(input, val) {
    this.setState(state => {
      val = (() => {
        switch(input) {
          case 'cardNumber':
            return this.state.cardNumber.length > val.length
              ? val.trim()
              : val.replace(/[^0-9]/g, '').replace(/\d{4}(?=\d)/g, val => val + ' ').substr(0, 19);
          case 'securityCode':
            return val.replace(/[^0-9]/g, '').substr(0, 4);
          case 'city':
          case 'region':
          case 'cardName':
            return val.trimLeft().replace(/[^\w'.\s]/g, '').replace(/\s+|\.+|'+/g, val => val.substr(0, 1));
          case 'address1':
          case 'address2':
            return val.trimLeft().replace(/[^\w'\s0-9]/g, '').replace(/\s+|\.+|'+/g, val => val.substr(0, 1));
          case 'expiryYear':
            return val.replace(/[^0-9]/g, '').substr(0, 2);
          case 'postalCode':
            return (this.state.postalCode.length > val.length && val.length < 7) || val.length === 5
              ? val.replace(/[^0-9]/g, '')
              : val.replace(/[^0-9]/g, '').replace(/\d{5}(?=\d)/g, val => val + '-').substr(0, 10);
          default:
            return this.state?.[input] !== undefined ? val : undefined;
        }
      })();
      return {
        ...state,
        [input]: val,
        [input + 'Valid']: (() => {
          switch(input) {
            case 'address1':
            case 'city':
            case 'region':
            case 'country':
            case 'securityCode':
            case 'cardName':
              return val.length > 0;
            case 'postalCode':
              return val.length === 5 || val.length === 10;
            case 'cardNumber':
              return val.replace(/[^0-9]/g, '').length === 16;
            case 'expiryMonth':
              return val !== '';
            case 'expiryYear':
              return val.length === 2;
            default:
              return false;
          }
        })()
      };
    });
  }

  handleBlur(input, toggle = true) { this.setState({ [input + 'Blur']: toggle }); }

  handleAddressSubmit(e) {
    e.preventDefault();
    const { address1, address2, city, region, country, postalCode } = this.state;
    fetch('/api/user/address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address1, address2, city, region, country, postalCode })
     }).then(res => {
      const json = res.json();
      if (res.ok) return json;
      throw json;
    }).then(data => {
      const { addresses } = this.state;
      const { id } = data;
      const newAddress = { id, address1, address2, city, region, postalCode };
      this.setState({ addresses: [newAddress, ...addresses ], curAddress: newAddress });
      $(this.addressRef.current).dropdown('hide');
      $(this.addressRef.current).dropdown('dispose');
      document.activeElement.blur();
      this.setState({
        address1: '', address2: '', city: '', region: '', country: '', postalCode: '',
        address1Valid: false, address2Valid: false, cityValid: false, regionValid: false, countryValid: false, postalCodeValid: false,
        address1Blur: false, address2Blur: false, cityBlur: false, regionBlur: false, countryBlur: false, postalCodeBlur: false,
      });
      e.target.reset();
    }).catch(err => (async () => {
      const { code, msg } = await err;
      if (code !== 400) return console.error({ code, msg });
      const btn = $(this.addressDupeRef.current);
      btn.popover({
        content: 'This address is already associated with your account.',
        placement: 'top',
        trigger: 'manual',
      }).popover('show');
      clearTimeout(this.addressPopTimeout);
      this.addressPopTimeout = setTimeout(() => btn.popover('dispose'), 2000);
    })());
  }

  handlePaymentMethodSubmit(e) {
    e.preventDefault();
    let { cardNumber, securityCode, cardName, expiryMonth, expiryYear } = this.state;
    cardNumber = cardNumber.replace(/[^0-9]/g, '');
    fetch('/api/user/paymentmethod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardNumber, securityCode, cardName, expiry: `20${expiryYear}-${expiryMonth}-28 00:00:00`})
    }).then(res => {
      const json = res.json();
      if (res.ok) return json;
      throw json;
    }).then(data => {
      const { paymentMethods } = this.state;
      const { id } = data;
      const _cardNumber = cardNumber.split('').map((val, index) => index < cardNumber.length - 4 ? '*' : val).join('');
      const name = cardName.split(' ').pop();
      const newPaymentMethod = { id, cardNumber: _cardNumber, name };
      this.setState({ paymentMethods: [newPaymentMethod, ...paymentMethods], curPaymentMethod: newPaymentMethod });
      $(this.paymentMethodRef.current).dropdown('hide');
      $(this.paymentMethodRef.current).dropdown('dispose');
      document.activeElement.blur();
      this.setState({
        cardNumber: '', securityCode: '', cardName: '', expiryMonth: '', expiryYear: '',
        cardNumberValid: false, securityCodeValid: false, cardNameValid: false, expiryMonthValid: false, expiryYearValid: false,
        cardNumberBlur: false, securityCodeBlur: false, cardNameBlur: false, expiryMonthBlur: false, expiryYearBlur: false,
      })
      e.target.reset();
    }).catch(err => (async () => {
      const { code, msg } = await err;
      if (code !== 400) return console.error({ code, msg });
      const btn = $(this.paymentMethodDupeRef.current);
      btn.popover({
        content: 'This payment method is already associated with your account.',
        placement: 'top',
        trigger: 'manual',
      }).popover('show');
      clearTimeout(this.paymentMethodPopTimeout);
      this.paymentMethodPopTimeout = setTimeout(() => btn.popover('dispose'), 2000);
    })());
  }

  async handleCheckout(e) {
    const {
      curAddress: { id: address },
      curPaymentMethod: { id: paymentMethod },
      curShippingMethod: { id: shippingMethod },
    } = this.state;
    e.preventDefault();
    try {
      const { pid, qty } = parseQuery(this.props.location.search);
      const res = await (
        pid == null
        ? fetch('/api/cart/checkout', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, paymentMethod, shippingMethod }),
        })
        : fetch('/api/cart/checkout?single', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, paymentMethod, shippingMethod, pid, qty }),
        })
      );
      const json = await res.json();
      if (res.ok) this.props.history.replace('/orders/' + json.oid);
      else throw json;
    } catch (err) { console.error(await err); }
  }

  removeAddress(id) {
    fetch('/api/user/address', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).then(res => {
      if (!res.ok) throw new Error('Invalid address');
      const addresses = this.state.addresses.filter(address => address.id !== id);
      this.setState({ addresses, curAddress: addresses[0] });
    }).catch(err => console.error(err));
  }

  removePaymentMethod(id) {
    fetch('/api/user/paymentmethod', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).then(res => {
      if (!res.ok) throw new Error('Invalid address');
      const paymentMethods = this.state.paymentMethods.filter(method => method.id !== id);
      this.setState({ paymentMethods, curPaymentMethod: paymentMethods[0] });
    }).catch(err => console.error(err));
  }

  componentDidMount() {
    let { pid, shipping } = parseQuery(this.props.location.search);
    let promise;
    fetch('/api/user/checkout')
      .then(async res => {
        const json = await res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => {
        let { addresses, paymentMethods } = data;
        let curAddress = null;
        let curPaymentMethod = null;
        if (!addresses) addresses = [];
        else curAddress = addresses[0];
        if (!paymentMethods) paymentMethods = [];
        else curPaymentMethod = paymentMethods[0];
        this.setState({ addresses, paymentMethods, curAddress, curPaymentMethod });
      }).catch(err => console.error(err));
    if (pid != null) {
      promise = new Promise(res => {
        const { methods, method } = JSON.parse(atob(shipping));
        this.setState({
          shippingMethods: methods,
          curShippingMethod: methods[method],
        });
        res(methods);
      });
    } else {
      promise = fetch('/api/cart/shippingmethods')
        .then(res => {
          const json = res.json();
          if (res.ok) return json;
          throw json;
        }).then(data => {
          let { shippingMethods } = data;
          let curShippingMethod = null;
          if (!shippingMethods) shippingMethods = [];
          else curShippingMethod = shippingMethods[0];
          this.setState({ shippingMethods, curShippingMethod });
          return shippingMethods;
        }).catch(err => console.error(err));
    }
    Promise.all([promise]).then(data => {
      const [{ length }] = data;
      if (length === 0) this.props.history.replace('/');
    });
  }

  render() {
    const {
      addresses, paymentMethods, shippingMethods,
      curAddress, curPaymentMethod, curShippingMethod,
      address1, address2, city, region, country, postalCode,
      cardNumber, securityCode, cardName, expiryMonth, expiryYear,
      address1Valid, cityValid, regionValid, countryValid, postalCodeValid,
      cardNumberValid, securityCodeValid, cardNameValid, expiryMonthValid, expiryYearValid,
      address1Blur, cityBlur, regionBlur, countryBlur, postalCodeBlur,
      cardNumberBlur, securityCodeBlur, cardNameBlur, expiryMonthBlur, expiryYearBlur,
    } = this.state;
    const validAddress = address1Valid && cityValid && regionValid && postalCodeValid && countryValid;
    const validPaymentMethod = cardNumberValid && cardNameValid && securityCodeValid && cardNameValid && expiryMonthValid && expiryYearValid;
    const canCheckout = curAddress != null && curPaymentMethod != null && curShippingMethod != null;
    return (
      <main>
        <div
          className='modal fade'
          id='checkout-confirmation-modal'
          tabIndex='-1'
          aria-labelledby='checkout-confirmation-label'
          aria-hidden='true'>
          <div className='modal-dialog'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title' id='checkout-confirmation-label'>Confirm your information</h5>
                <button type='button' className='close' data-dismiss='modal' aria-label='Close'>
                  <span aria-hidden='true'>&times;</span>
                </button>
              </div>
              <div className='modal-body'>
                <h5>Address</h5>
                <p className='m-0'>{curAddress?.address1}</p>
                {
                  !!curAddress?.address2 &&
                  <p className='m-0'>{curAddress?.address2}</p>
                }
                <p className='m-0'>{curAddress?.city}, {curAddress?.region}</p>
                <p>{curAddress?.postalCode}</p>
                <h5>Payment Method</h5>
                <p>{curPaymentMethod?.cardNumber}</p>
                <h5>Shipping Method</h5>
                <p><span className='text-capitalize'>{curShippingMethod?.name}</span> shipping</p>
              </div>
              <div className='modal-footer'>
                <button
                  className='btn btn-secondary'
                  data-dismiss='modal'
                  type='button'>Cancel</button>
                <Link
                  to='/orders/'
                  onClick={e => this.handleCheckout(e)}
                  className='btn btn-primary'
                  data-dismiss='modal'>Confirm</Link>
              </div>
            </div>
          </div>
        </div>
        <div className='container-fluid mb-4'>
          <div className='row'>
            <div className='col-12 alert alert-danger px-md-5' role='alert'>
              <strong>This is a demo application!</strong>  Please do not provide any real or sensitive information.
            </div>
          </div>
          <div className='row m-md-5'>
            <div className='col-12 col-md-4 col-xl-3 mb-4'>
              <div className='card h-100'>
                <div className='card-header'>
                  Shipping Methods
                </div>
                <div className='card-body'>
                  {
                    shippingMethods?.map((method, index) => {
                      const { id, name } = method;
                      const isFirst = index === 0;
                      return (
                        <div className='form-check' key={id}>
                          <input
                            onChange={() => this.setState({ curShippingMethod: method })}
                            type='radio'
                            className='form-check-input'
                            name='checkout-shipping-method'
                            id={'checkout-shipping-method-' + id}
                            defaultChecked={isFirst}
                            required />
                          <label htmlFor={'checkout-shipping-method-' + id} className='form-check-label container'>
                            <p><span className='text-capitalize'>{name}</span> shipping</p>
                          </label>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
            <div className='col-12 col-md-8 col-xl-4 mb-4'>
              <div className='card h-100'>
                <div className='card-header'>
                  Addresses
                </div>
                <div className='card-body'>
                  {
                    addresses?.map((address, index) => {
                      const { id, region, city, address1, address2, postalCode } = address;
                      const isFirst = index === 0;
                      return (
                        <div className='form-check' key={id}>
                          <input
                            onChange={() => this.setState({ curAddress: address })}
                            type='radio'
                            className='form-check-input'
                            name='checkout-address'
                            id={'checkout-address-' + id}
                            defaultChecked={isFirst}
                            required />
                          <label htmlFor={'checkout-address-' + id} className='form-check-label container'>
                            <div className='row'>
                              <div className='col-12 col-sm-6'>
                                <p className='mb-0'>{address1}</p>
                                {
                                  address2 &&
                                  <p className='mb-0'>{address2}</p>
                                }
                                <p className='mb-0'>{city}, {region}</p>
                                <p className='mb-0'>{postalCode}</p>
                              </div>
                              <div className='col-12 col-sm-6 text-right'>
                                <button
                                  onClick={() => this.removeAddress(id)}
                                  className='btn btn-outline-danger'
                                  type='button'>Remove</button>
                              </div>
                            </div>
                          </label>
                        </div>
                      );
                    })
                  }
                  <div ref={this.addressRef} className='dropdown mt-3'>
                    <button
                      className='btn btn-outline-primary'
                      id='checkout-address-dropdown'
                      data-toggle='dropdown'
                      data-offset='0,10'
                      aria-haspopup='true'
                      aria-expanded='false'
                      type='button'>Add new</button>
                    <form
                      style={{ zIndex: 1030 }}
                      onSubmit={e => this.handleAddressSubmit(e)}
                      className='dropdown-menu p-4 overflow-auto'
                      aria-describedby='checkout-address-dropdown'>
                      <div className='form-group'>
                        <label htmlFor='checkout-address-1'>Street address</label>
                        <input
                          onChange={e => this.filterInput('address1', e.currentTarget.value)}
                          onBlur={() => this.handleBlur('address1')}
                          value={address1}
                          type='text'
                          className='form-control'
                          id='checkout-address-1'
                          required />
                        {
                          address1Blur && !address1Valid &&
                          <p className='text-danger'>Please enter a street address</p>
                        }
                      </div>
                      <div className='form-group'>
                        <label htmlFor='checkout-address-2'>Address line 2 <small>(optional)</small></label>
                        <input
                          onChange={e => this.filterInput('address2', e.currentTarget.value)}
                          value={address2}
                          type='text'
                          className='form-control'
                          id='checkout-address-2' />
                      </div>
                      <div className='row'>
                        <div className='form-group col-12 col-sm-7'>
                          <label
                            htmlFor='checkout-city'
                            className='text-truncate mw-100'>City</label>
                          <input
                            onChange={e => this.filterInput('city', e.currentTarget.value)}
                            onBlur={() => this.handleBlur('city')}
                            value={city}
                            type='text'
                            className='form-control'
                            id='checkout-city'
                            required />
                          {
                            cityBlur && !cityValid &&
                            <p className='text-danger'>Please enter a city</p>
                          }
                        </div>
                        <div className='form-group col-12 col-sm-5'>
                          <label
                            htmlFor='checkout-region'
                            className='text-truncate mw-100'>State / Province / Region</label>
                          <input
                            onChange={e => this.filterInput('region', e.currentTarget.value)}
                            onBlur={() => this.handleBlur('region')}
                            value={region}
                            type='text'
                            className='form-control'
                            id='checkout-region'
                            required />
                          {
                            regionBlur && !regionValid &&
                            <p className='text-danger'>Please enter a region</p>
                          }
                        </div>
                      </div>
                      <div className='row'>
                        <div className='form-group col-12 col-sm-7'>
                          <label
                            htmlFor='checkout-country'
                            className='text-truncate mw-100'>Country</label>
                          <select
                            onChange={e => this.filterInput('country', e.currentTarget.value)}
                            onBlur={() => this.handleBlur('country')}
                            value={country}
                            className='form-control'
                            id='checkout-country'
                            required>
                            <option value='' disabled />
                            {
                              countries.map((country, index) => (
                                <option key={index} value={country}>{country}</option>
                              ))
                            }
                          </select>
                          {
                            countryBlur && !countryValid &&
                            <p className='text-danger'>Please select a country</p>
                          }
                        </div>
                        <div className='form-group col-12 col-sm-5'>
                          <label
                            htmlFor='checkout-postal-code'
                            className='text-truncate mw-100'>Postal code</label>
                          <input
                            onChange={e => this.filterInput('postalCode', e.currentTarget.value)}
                            onBlur={() => this.handleBlur('postalCode')}
                            value={postalCode}
                            type='tel'
                            className='form-control'
                            id='checkout-postal-code'
                            required />
                          {
                            postalCodeBlur && !postalCodeValid &&
                            <p className='text-danger'>Please enter a valid postal code</p>
                          }
                        </div>
                      </div>
                      <div className='text-right'>
                        {
                          <button
                            ref={this.addressDupeRef}
                            disabled={!validAddress}
                            className='btn btn-primary'
                            type='submit'>Add</button>
                        }
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div className='col-12 col-xl-5 mb-4'>
              <div className='card h-100'>
                <div className='card-header'>
                  Payment Methods
                </div>
                <div className='card-body'>
                  {
                    paymentMethods?.map((method, index) => {
                      const { id, cardNumber } = method;
                      const isFirst = index === 0;
                      return (
                        <div className='form-check' key={id}>
                          <input
                            onChange={() => this.setState({ curPaymentMethod: method })}
                            type='radio'
                            className='form-check-input'
                            name='checkout-payment-method'
                            id={'checkout-payment-method-' + id}
                            defaultChecked={isFirst}
                            required />
                          <label htmlFor={'checkout-payment-method-' + id} className='form-check-label container'>
                            <div className='row'>
                              <div className='col-12 col-md-6'>
                                <p className='mb-0'>{cardNumber}</p>
                              </div>
                              <div className='col-12 col-md-6 text-right'>
                                <button
                                  onClick={() => this.removePaymentMethod(id)}
                                  className='btn btn-outline-danger'
                                  type='button'>Remove</button>
                              </div>
                            </div>
                          </label>
                        </div>
                      );
                    })
                  }
                  <div ref={this.paymentMethodRef} className='dropdown mt-3'>
                    <button
                      className='btn btn-outline-primary'
                      id='checkout-payment-method-dropdown'
                      data-toggle='dropdown'
                      data-offset='0,10'
                      aria-haspopup='true'
                      aria-expanded='false'
                      type='button'>Add new</button>
                    <form
                      style={{ zIndex: 1030 }}
                      onSubmit={e => this.handlePaymentMethodSubmit(e)}
                      className='dropdown-menu p-4'
                      aria-describedby='checkout-payment-method-dropdown'>
                      <div className='form-group'>
                        <label htmlFor='checkout-card-number'>Card number</label>
                        <input
                          onChange={e => this.filterInput('cardNumber', e.currentTarget.value)}
                          onBlur={() => this.handleBlur('cardNumber')}
                          value={cardNumber}
                          type='tel'
                          className='form-control'
                          id='checkout-card-number'
                          required />
                        {
                          cardNumberBlur && !cardNumberValid &&
                          <p className='text-danger'>Please enter a valid card number</p>
                        }
                      </div>
                      <div className='form-group'>
                        <label htmlFor='checkout-card-security-code'>Security code</label>
                        <input
                          onChange={e => this.filterInput('securityCode', e.currentTarget.value)}
                          onBlur={() => this.handleBlur('securityCode')}
                          value={securityCode}
                          type='tel'
                          className='form-control'
                          id='checkout-card-security-code'
                          required />
                        {
                          securityCodeBlur && !securityCodeValid &&
                          <p className='text-danger'>Please enter a security code</p>
                        }
                      </div>
                      <div className='form-group'>
                        <label htmlFor='checkout-card-name'>Name on card</label>
                        <input
                          onChange={e => this.filterInput('cardName', e.currentTarget.value)}
                          onBlur={() => this.handleBlur('cardName')}
                          value={cardName}
                          type='tel'
                          className='form-control'
                          id='checkout-card-name'
                          required />
                        {
                          cardNameBlur && !cardNameValid &&
                          <p className='text-danger'>Please enter a card name</p>
                        }
                      </div>
                      <div className='form-group'>
                        <label htmlFor='checkout-card-expiry-month'>Expiration date</label>
                        <div className='container'>
                          <div className='row'>
                            <select
                              onChange={e => this.filterInput('expiryMonth', e.currentTarget.value)}
                              onBlur={() => this.handleBlur('expiryMonth')}
                              value={expiryMonth}
                              className='form-control col-4'
                              id='checkout-card-expiry-month'
                              required>
                              <option value='' disabled />
                              {
                                months.map((month, index) => (
                                  <option key={index} value={index + 1}>{month.substr(0, 3)}</option>
                                ))
                              }
                            </select>
                            <span className='col-1 lg-font'>/</span>
                            <input
                              onChange={e => this.filterInput('expiryYear', e.currentTarget.value)}
                              onBlur={() => this.handleBlur('expiryYear')}
                              value={expiryYear}
                              type='number'
                              className='form-control col-5'
                              required />
                            {
                              (
                                expiryMonthBlur && !expiryMonthValid &&
                                <p className='text-danger'>Please select a month</p>
                              ) ||
                              (
                                expiryYearBlur && !expiryYearValid &&
                                <p className='text-danger'>Please enter a valid year</p>
                              )
                            }
                          </div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <button
                          ref={this.paymentMethodDupeRef}
                          disabled={!validPaymentMethod}
                          className='btn btn-primary'
                          type='submit'>Add</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='row mx-sm-5'>
            <div className='col text-center text-sm-right'>
              <button
                disabled={!canCheckout}
                className='btn btn-primary'
                data-toggle='modal'
                data-target='#checkout-confirmation-modal'
                type='button'>Proceed to checkout</button>
            </div>
          </div>
        </div>
      </main>
    );
  }
}

export default withRouter(Checkout);
