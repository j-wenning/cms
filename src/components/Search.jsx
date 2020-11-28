import React from 'react';
import ProductList from './ProductList';

export default class Search extends React.Component {
  constructor(props) {
    super(props);
    this.state = { search: null };
  }

  componentDidMount() {
    this.setState({
      search: new URLSearchParams(document.location.search).get('s')
    });
  }

  render() {
    return (
      <main>
        <h1>Search results for: <span>{ this.state.search || '...'}</span></h1>
        <ProductList />
      </main>
    );
  }
};
