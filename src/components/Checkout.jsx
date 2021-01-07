import React from 'react';
import { months, countries } from './Lists';

export default class Checkout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      addresses:          [],
      paymentMethods:     [],
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
  }

  componentDidMount() {
    fetch('/api/user/checkout')
      .then(res => {
        const json = res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => this.setState({ ...data }))
        .catch(err => (async () => console.error(await err))());
  }

  filterInput(input, val) {
    this.setState(state => {
      const result = {
        ...state,
        [input]: (() => {
          switch(input) {
            case 'cardNumber':
              return this.state.cardNumber.length > val.length
                ? val.trim()
                : val.replace(/[^0-9]/g, '').replace(/\d{4}/g, val => val + ' ').substr(0, 19);
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
                : val.replace(/[^0-9]/g, '').replace(/\d{5}/g, val => val + '-').substr(0, 10);
            default:
              return this.state?.[input] !== undefined ? val : undefined;
          }
        })(),
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

  render() {
    const {
      addresses, paymentMethods,
      address1, address2, city, region, postalCode,
      country, cardNumber, securityCode, cardName, expiryMonth, expiryYear,
      address1Valid, cityValid, regionValid, postalCodeValid,
      address1Blur, cityBlur, regionBlur, postalCodeBlur,
      countryValid, cardNumberValid, securityCodeValid, cardNameValid, expiryMonthValid, expiryYearValid,
      countryBlur, cardNumberBlur, securityCodeBlur, cardNameBlur, expiryMonthBlur, expiryYearBlur,
      validAddress, validPaymentMethod,
    } = this.state;
    return (
      <main>
        <div className='container'>
          <div className='row'>
            <form className='col-12'>
              <div className='row'>
                <div className='col-6'>
                  <h3>Addresses</h3>
                  {
                    addresses.map((address, index) => {
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
                          <label htmlFor={'checkout-address-' + id} className='form-check-label'>
                            <p className='mb-0'>{address1}</p>
                            {
                              address2 &&
                              <p className='mb-0'>{address2}</p>
                            }
                            <p className='mb-0'>{city}, {region}</p>
                            <p className='mb-0'>{postalCode}</p>
                          </label>
                        </div>
                      );
                    })
                  }
                  <div className='form-check'>
                    <input
                      type='radio'
                      className='form-check-input'
                      name='checkout-address'
                      id='checkout-address-manual' />
                    <label htmlFor='checkout-address-manual' className='form-check-label'>
                      <form className='col-12 d-block'>
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
                            id='checkout-address-2'
                            required />
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
                              <p className="text-danger">Please select a country</p>
                            }
                          </div>
                          <div className='form-group col-5'>
                            <label htmlFor='checkout-region'>State/Province/Region</label>
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
                              <p className="text-danger">Please enter a region</p>
                            }
                          </div>
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
                              <p className="text-danger">Please enter a city</p>
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
                              <p className="text-danger">Please enter a valid postal code</p>
                            }
                          </div>
                        </div>
                        <div className='text-right'>
                          <button
                            disabled={!validAddress}
                            className='btn btn-primary'
                            type='submit'>Add</button>
                        </div>
                      </form>
                    </label>
                  </div>
                </div>
                <div className='col-6'>
                  <h3>Payment Methods</h3>
                  {
                    paymentMethods.map((method, index) => {
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
                          <label htmlFor={'checkout-payment-method-' + id} className='form-check-label'>
                            <p className='font-weight-bold mb-0'>{cardNumber}</p>
                            <p>Cardholder surname: <span className='font-weight-bold'>{name}</span></p>
                          </label>
                        </div>
                      );
                    })
                  }
                  <div className='form-check'>
                    <input
                      type='radio'
                      className='form-check-input'
                      name='checkout-payment-method'
                      id='checkout-payment-method-manual'
                      required />
                    <label htmlFor='checkout-payment-method-manual' className='form-check-label'>
                      <form className='col-12 d-block'>
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
                            <p className="text-danger">Please enter a valid card number</p>
                          }
                        </div>
                        <div className='form-group'>
                          <label htmlFor='checkout-card-number'>Security code</label>
                          <input
                            onChange={e => this.filterInput('securityCode', e.currentTarget.value)}
                            onBlur={() => this.handleBlur('securityCode')}
                            value={securityCode}
                            type='tel'
                            className='form-control'
                            id='checkout-card-number'
                            required />
                          {
                            securityCodeBlur && !securityCodeValid &&
                            <p className="text-danger">Please enter a security code</p>
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
                            <p className="text-danger">Please enter a card name</p>
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
                                  <p className="text-danger">Please select a month</p>
                                ) ||
                                (
                                  expiryYearBlur && !expiryYearValid &&
                                  <p className="text-danger">Please enter a valid year</p>
                                )
                              }
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <button
                            disabled={!validPaymentMethod}
                            className='btn btn-primary'
                            type="submit">Add</button>
                        </div>
                      </form>
                    </label>
                  </div>
                </div>
              </div>
              <button className='btn btn-primary' type='submit'>Submit</button>
            </form>
          </div>
        </div>
      </main>
    );
  }
}
