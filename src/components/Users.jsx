import React from 'react';
import $ from 'jquery';

export default class Users extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      curUser: '',
    };
    this.toastRef = React.createRef();
  }

  setUser(e) {
    const { target: { value: uid } } = e;
    fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    }).then(async res => {
      if (!res.ok) throw await res.json();
    }).then(() => {
      this.setState({ curUser: uid });
      document.dispatchEvent(new Event('userUpdate'));
      $(this.toastRef.current).toast('show');
    }).catch(err => console.error(err));
  }

  componentDidMount() {
    fetch('/api/user')
      .then(async res => {
        const json = await res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => this.setState({ curUser: data.uid }))
      .catch(err => console.error(err));
    fetch('/api/users')
      .then(async res => {
        const json = await res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => this.setState({ users: data }))
      .catch(err => console.error(err));
  }

  render() {
    const { users, curUser } = this.state;
    return (
      <main>
        <div aria-live='polite' aria-atomic='true' className='w-100 d-flex justify-content-center align-items-center position-absolute' style={{ top: '70px' }}>
          <div ref={this.toastRef} className='toast' role='alert' aria-live='assertive' aria-atomic='true'>
            <div className='toast-header'>
              <strong className='mr-auto'>User successfully selected</strong>
              <button type='button' className='ml-2 mb-1 close' data-dismiss='toast' aria-label='Close'>
                <span aria-hidden='true'>&times;</span>
              </button>
            </div>
          </div>
        </div>
        <div className='container mt-5'>
          <div className='row'>
            <div className='col'>
              <h1>Select a user profile</h1>
              <select
                className='form-control mt-4'
                onChange={(e) => this.setUser(e)}
                value={curUser}>
                {
                  users.map(user => {
                    const { uid } = user;
                    return (<option value={uid} key={uid}>User {uid}</option>);
                  })
                }
              </select>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
