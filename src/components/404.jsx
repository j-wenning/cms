import React from 'react';
import { Link } from 'react-router-dom';

export default class _404 extends React.Component {
  render() {
    return (
      <div className='container'>
        <div className="row">
          <div className="col">
            <h1 className='mt-3'>Page Not Found</h1>
            <p className='mt-3'>
              <Link to='/'>Home</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }
};
