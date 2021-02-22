import React from 'react';

export default class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      phone: {},
    };
  }

  componentDidMount() {
    const email = atob('d2VubmluZy5qdXN0aW5AZ21haWwuY29t');
    const phoneNum = atob('NzE0NzI2MzE4MA==');
    const phoneStr = `(${phoneNum.substr(0, 3)}) ${phoneNum.substr(3, 3)}-${phoneNum.substr(6)}`;
    setTimeout(() => {
      this.setState({
        email,
        phone: { num: phoneNum, str: phoneStr },
      });
    }, 500); // anti-scrape
  }

  render() {
    const { email, phone } = this.state;
    return (
      <footer className='footer mt-auto'>
        <div className='container-fluid py-5 bg-dark'>
          <div className='row mb-5 mx-2 text-light'>
            <div className='col-12 col-md-6 col-xl-8'>
              <h4>About</h4>
              <p>This page was created solely for demonstrative purposes, and is not to be used as a legitimate retail webpage.  Please do not enter any sensitive information.  For site problems or business inquiries, utilize the supplied contacts.</p>
            </div>
            <div className='col-12 col-md-6 col-lg-3 col-xl-2'>
              <ul className='list-unstyled'>
                <li>
                  <h4>Contact Me</h4>
                </li>
                <li>
                  <a
                    href={'mailto:' + email}
                    className='text-reset w-fit'>{email}</a>
                </li>
                <li>
                  <a
                    href={'tel:' + phone.num}
                    className='text-reset w-fit'>{phone.str}</a>
                </li>
              </ul>
            </div>
            <div className='col-12 col-lg-3 col-xl-2 order-lg-first'>
              <ul className='list-unstyled'>
                <li>
                  <h4>External Links</h4>
                </li>
                <li>
                  <a
                    href='https://github.com/j-wenning/'
                    className='text-reset d-flex align-items-center w-fit'
                    target='_blank'>
                    <span>GitHub</span>
                    <img src='/bootstrap/github.svg' alt='' className='ml-2 filter-invert' />
                  </a>
                </li>
                <li>
                  <a
                    href='https://www.linkedin.com/in/j-wenning/'
                    className='text-reset d-flex align-items-center w-fit'
                    target='_blank'>
                    <span>LinkedIn</span>
                    <img src='/bootstrap/linkedin.svg' alt='' className='ml-2 filter-invert' />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    );
  }
};
