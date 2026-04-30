import React from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as Pennywise } from '../../icons/pennywise.svg';
import './style.scss';

class EmptyPage extends React.Component {
  onKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.props.onUrl(e.target.value);
    }
  };

  render() {
    return (
      <div className='empty-page'>
        <Pennywise/>
        <h1>Pennywise</h1>
        <p>Enter the URL below to get started – I will float it for you</p>
        <input type="text" placeholder="Enter a URL you would like to see float" onKeyPress={ this.onKeyPress } autoFocus/>
        <div className="shortcuts-hint">
          <p>Shortcuts: <b>Cmd+Shift+H</b> (Hide/Show) | <b>Cmd+Shift+T</b> (Toggle Always-on-top) | <b>Cmd+Shift+Y</b> (History) | <b>Cmd+Shift+X</b> (Ghost mode)</p>
        </div>
      </div>
    );
  }
}

EmptyPage.propTypes = {
  onUrl: PropTypes.func.isRequired
};

export default EmptyPage;
