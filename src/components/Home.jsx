import React from 'react';
import ProductBar from './ProductBar';
import ProductList from './ProductList';

export default class Home extends React.Component {
  render() {
    return (
      <main>
        <div className='jumbotron mb-0'>
          <h1 className='display-4'>Today's Deals</h1>
          <hr className='my-4' />
          <ProductBar query={{ deals: true }} />
        </div>
        <ProductList noQuery={true} />
      </main>
    );
  }
};
