import React from 'react';
import Featured from './Featured';
import ProductList from './ProductList';

export default class Home extends React.Component {
  render() {
    return (
      <main>
        <div className='jumbotron mb-0 mb-lg-5'>
          <h1 className='display-4'>Today's Deals</h1>
          <hr className='my-4' />
          <Featured />
        </div>
        <ProductList noQuery={true} />
      </main>
    );
  }
};
