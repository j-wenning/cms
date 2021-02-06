import React from 'react';

export default class RatingBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { rating: null };
  }

  handleClick(rating) {
    if (this.state.rating !== rating) {
      fetch('/api/product/rating', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, id: this.props.id })
      }).then(res => res.json())
        .then(data => this.setState({ rating: data.rating }))
        .catch(err => (async () => console.error(await err))());
    }
  }

  render() {
    const rating = this.state.rating || this.props.rating || 0;
    const ratingMax = 10;
    const ratingDiv = 2;
    return (
      <div className={'rating-bar ' + this.props.className}>
        <div>
          {
            [...new Array(ratingMax)].map((item, i) => (
              <React.Fragment key={i}>
                <input
                  type='checkbox'
                  onChange={() => this.handleClick(i + 1)}
                  checked={i < rating}
                  id={'rating-input-' + i}
                  className='rating-input' />
                <label htmlFor={'rating-input-' + i} className='rating-icon' />
              </React.Fragment>
            ))
          }
        </div>
        <small>({(rating / ratingDiv).toFixed(1)})</small>
      </div>
    );
  }
};
