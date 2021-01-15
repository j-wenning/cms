import React from 'react';
import { months, countries } from './Lists';
import $ from 'jquery';

export default class Checkout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      addresses:          [],
      paymentMethods:     [],
      shippingMethods:    [],
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
      validAddress:       false,
      validPaymentMethod: false,
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
      const result = {
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
      const {
        address1Valid, cityValid, regionValid, postalCodeValid, countryValid,
        cardNumberValid, securityCodeValid, cardNameValid, expiryMonthValid, expiryYearValid,
      } = result;
      return {
        ...result,
        validAddress: address1Valid && cityValid && regionValid && postalCodeValid && countryValid,
        validPaymentMethod: cardNumberValid && cardNameValid && securityCodeValid && cardNameValid && expiryMonthValid && expiryYearValid
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
      this.setState({ addresses: [{ id, address1, address2, city, region, postalCode }, ...addresses ] });
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
      this.setState({ paymentMethods: [{ id, cardNumber: _cardNumber, name }, ...paymentMethods] });
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

  removeAddress(id) {
    fetch('/api/user/address', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).then(res => {
      const json = res.json();
      if (res.ok) return json;
      throw json;
    }).then(data => {
      const { id } = data;
      const addresses = this.state.addresses.filter(address => address.id !== id);
      this.setState({ addresses });
    }).catch(err => (async () => console.log(await err))())
  }

  componentDidMount() {
    fetch('/api/user/checkout')
      .then(res => {
        const json = res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => {
        let { addresses, paymentMethods } = data;
        if (!addresses) addresses = [];
        if (!paymentMethods) paymentMethods = [];
        this.setState({ addresses, paymentMethods });
      }).catch(err => (async () => console.error(await err))());
    fetch('/api/cart/shippingmethods')
      .then(res => {
        const json = res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => {
        let { shippingMethods } = data;
        if (!shippingMethods) shippingMethods = [];
        this.setState({ shippingMethods });
      }).catch(err => (async () => console.error(await err))());
  }

  render() {
    const {
      addresses, paymentMethods, shippingMethods,
      address1, address2, city, region, country, postalCode,
      cardNumber, securityCode, cardName, expiryMonth, expiryYear,
      address1Valid, cityValid, regionValid, countryValid, postalCodeValid,
      cardNumberValid, securityCodeValid, cardNameValid, expiryMonthValid, expiryYearValid,
      address1Blur, cityBlur, regionBlur, countryBlur, postalCodeBlur,
      cardNumberBlur, securityCodeBlur, cardNameBlur, expiryMonthBlur, expiryYearBlur,
      validAddress, validPaymentMethod,
    } = this.state;
    return (
      <main>
        <div className='container-fluid'>
          <div className='card-deck m-5'>
            <div className='card'>
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
                          type='radio'
                          className='form-check-input'
                          name='checkout-address'
                          id={'checkout-address-' + id}
                          defaultChecked={isFirst}
                          required />
                        <label htmlFor={'checkout-address-' + id} className='form-check-label container'>
                          <div className='row'>
                            <div className='col-6'>
                              <p className='mb-0'>{address1}</p>
                              {
                                address2 &&
                                <p className='mb-0'>{address2}</p>
                              }
                              <p className='mb-0'>{city}, {region}</p>
                              <p className='mb-0'>{postalCode}</p>
                            </div>
                            <div className='col-6 text-right'>
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
                    onSubmit={e => this.handleAddressSubmit(e)}
                    className='dropdown-menu p-4'
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
                      <div className='form-group col-7'>
                        <label htmlFor='checkout-city'>City</label>
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
                      <div className='form-group col-5'>
                        <label htmlFor='checkout-region'>State / Province / Region</label>
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
                      <div className='form-group col-7'>
                        <label htmlFor='checkout-country'>Country</label>
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
                      <div className='form-group col-5'>
                        <label htmlFor='checkout-postal-code'>Postal code</label>
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
            <div className='card'>
              <div className='card-header'>
                Payment Methods
              </div>
              <div className='card-body'>
                {
                  paymentMethods?.map((method, index) => {
                    const { id, cardNumber, name } = method;
                    const isFirst = index === 0;
                    return (
                      <div className='form-check' key={id}>
                        <input
                          type='radio'
                          className='form-check-input'
                          name='checkout-payment-method'
                          id={'checkout-payment-method-' + id}
                          defaultChecked={isFirst}
                          required />
                        <label htmlFor={'checkout-payment-method-' + id} className='form-check-label container'>
                          <div className='row'>
                            <div className='col-6'>
                              <p className='font-weight-bold mb-0'>{cardNumber}</p>
                              <p>Cardholder surname: <span className='font-weight-bold'>{name}</span></p>
                            </div>
                            <div className='col-6 text-right'>
                              <button
                                onClick={() => 1}
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
                                <option key={index} value={index}>{month.substr(0, 3)}</option>
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
            <div className='card'>
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
          <div className='row'>
            <button className='btn btn-primary' type='submit'>Submit</button>
          </div>
        </div>
      </main>
    );
  }
}
