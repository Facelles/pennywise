import React from "react";
import debounce from "lodash.debounce";

import "./style.scss";

// Use electronAPI instead of direct electron require
const electronAPI = window.electronAPI;

class Settings extends React.Component {
  state = {
    opacity: electronAPI ? electronAPI.getOpacity() : 100,
  };

  componentDidMount() {
    if (electronAPI) {
      electronAPI.on("opacity.sync", this.onOpacitySync);
    }
  }

  componentWillUnmount() {
    if (electronAPI) {
      electronAPI.removeEventListener("opacity.sync", this.onOpacitySync);
    }
  }

  // Debounce the setter so to avoid bombarding
  // electron with the opacity change requests
  setOpacity = debounce((opacity) => {
    if (electronAPI) {
      electronAPI.setOpacity(opacity);
    }
  }, 400);

  onOpacitySync = (event, opacity) => {
    this.setState({ opacity });
  };

  onOpacityChange = (e) => {
    this.setState({
      opacity: e.target.value,
    });

    this.setOpacity(e.target.value);
  };

  render() {
    return (
      <div className="settings-wrap">
        <div className="setting-controls">
          <div className="setting-control opacity-picker">
            <label htmlFor="opacity-picker">
              <i className="fa fa-lightbulb-o" />
            </label>
            <input
              type="range"
              onChange={this.onOpacityChange}
              value={this.state.opacity}
              min="20"
              max="100"
              className="slider"
              id="opacity-picker"
            />
          </div>
        </div>
      </div>
    );
  }
}

export default Settings;
