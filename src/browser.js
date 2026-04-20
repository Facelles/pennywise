import React from "react";

import EmptyPage from "./components/empty-page";
import WebPage from "./components/web-page";
import { prepareUrl } from "./utils/helpers";

// Use electronAPI instead of direct electron require
const electronAPI = window.electronAPI;
let yargs = {};
try {
  yargs = electronAPI ? electronAPI.getArgv() : {};
} catch (e) {
  console.log("Could not get argv:", e);
  yargs = {};
}

class Browser extends React.Component {
  state = {
    url: yargs.url ? prepareUrl(yargs.url) : "",
    showNav: !yargs.hidenav ? true : false,
    embedVideosEnabled: true,
  };

  onUrl = (url) => {
    this.setState({
      url: prepareUrl(url, this.state.embedVideosEnabled),
    });
  };

  onembedVideosSet = (event, embedVideosEnabled) => {
    this.setState({ embedVideosEnabled });
  };

  onUrlRequested = (event, url) => {
    this.onUrl(url);
  };

  componentDidMount() {
    if (electronAPI) {
      electronAPI.on("embedVideos.set", this.onembedVideosSet);
      electronAPI.on("url.requested", this.onUrlRequested);
    }
  }

  componentWillUnmount() {
    if (electronAPI) {
      electronAPI.removeEventListener("embedVideos.set", this.onembedVideosSet);
    }
  }

  render() {
    return (
      <div className="browser-wrap">
        {this.state.url ? (
          <WebPage
            url={this.state.url}
            onUrl={this.onUrl}
            showNav={this.state.showNav}
          />
        ) : (
          <EmptyPage onUrl={this.onUrl} />
        )}
      </div>
    );
  }
}

export default Browser;
