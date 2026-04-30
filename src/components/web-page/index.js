import React from "react";
import PropTypes from "prop-types";
import * as NProgress from "nprogress";
import parseUrl from "url-parse";

import "./style.scss";
import NavBar from "../nav-bar";

// Use electronAPI instead of direct electron require
const electronAPI = window.electronAPI;

// Updated User Agent for modern compatibility (especially YouTube)
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

class WebPage extends React.Component {
  webView = React.createRef();
  state = {
    url: this.props.url,
    showNav: this.props.showNav,
  };

  /**
   * Configures the loader and binds it to
   * the webview
   */
  configureLoader() {
    NProgress.configure({
      easing: "ease",
      speed: 800,
      minimum: 0.2,
      showSpinner: false,
    });

    const currentWebView = this.webView.current;
    currentWebView.addEventListener("did-start-loading", () => {
      NProgress.start();
    });

    currentWebView.addEventListener("did-stop-loading", () => {
      NProgress.done();
    });

    currentWebView.addEventListener("new-window", (event) => {
      const currentUrl = this.webView.current.getURL();
      const newUrl = event.url;

      const parsedCurrentUrl = parseUrl(currentUrl, true);
      const parsedNewUrl = parseUrl(newUrl, true);

      // Only allow opening windows from current domain to avoid ads-popups
      if (parsedNewUrl.host === parsedCurrentUrl.host) {
        this.props.onUrl(newUrl);
      }
    });

    // Capture link clicks on page and update state with new url
    currentWebView.addEventListener("did-navigate", (event) => {
      this.setState({
        url: event.url,
      });
      if (electronAPI) {
        electronAPI.send("history.add", event.url);
      }
    });

    // Also handle in-page navigation
    currentWebView.addEventListener("did-navigate-in-page", (event) => {
      this.setState({
        url: event.url,
      });
    });

    // Inject our PiP CSS and Ad-Blocker whenever DOM is ready
    currentWebView.addEventListener("dom-ready", () => {
      this.injectCustomScripts();
    });
  }

  injectCustomScripts() {
    const currentWebView = this.webView.current;
    if (!currentWebView) return;

    // CSS to strip all YouTube UI elements, making it a pure frameless video player
    const css = `
      ytd-app #masthead-container,
      ytd-app #page-manager ytd-watch-flexy #secondary,
      ytd-app #page-manager ytd-watch-flexy #related,
      ytd-app #page-manager ytd-watch-flexy ytd-comments,
      ytd-app #page-manager ytd-watch-flexy ytd-engagement-panel-section-list-renderer {
        display: none !important;
      }
      ytd-app #page-manager {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      ytd-watch-flexy[flexy] #primary.ytd-watch-flexy,
      ytd-watch-flexy[flexy] #player-theater-container.ytd-watch-flexy {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 999999 !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
        padding: 0 !important;
        margin: 0 !important;
        background: black !important;
      }
      .html5-video-player {
        width: 100% !important;
        height: 100% !important;
        background: black !important;
      }
      /* Remove scrollbars */
      ::-webkit-scrollbar {
        display: none !important;
      }
      body {
        overflow: hidden !important;
        background: black !important;
      }
    `;

    currentWebView.insertCSS(css);

    // JavaScript to click "Skip Ad" and bypass unskippable ads rapidly
    const js = `
      setInterval(() => {
        const isAdShowing = document.querySelector('.ad-showing');
        if (isAdShowing) {
          const video = document.querySelector('video');
          if (video && !isNaN(video.duration)) {
            // Fast forward to the end of the ad immediately
            video.currentTime = video.duration - 0.1;
          }
          const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
          if (skipBtn) {
            skipBtn.click();
          }
        }
        
        // Also eliminate static overlay ads if they pop up
        const overlayAds = document.querySelectorAll('.ytp-ad-overlay-container');
        for (let overlay of overlayAds) {
          overlay.style.display = 'none';
        }
      }, 250);
    `;
    currentWebView.executeJavaScript(js);
  }

  onReload = () => {
    this.webView.current.reloadIgnoringCache();
  };

  onBack = () => {
    if (!this.webView.current.canGoBack()) {
      return;
    }

    this.webView.current.goBack();
  };

  onForward = () => {
    if (!this.webView.current.canGoForward()) {
      return;
    }

    this.webView.current.goForward();
  };

  toggleNavBar = () => {
    this.setState((state) => ({
      showNav: !state.showNav,
    }));
  };

  showNavBar = () => {
    this.setState({
      showNav: true,
    });
  };

  bindNavBar() {
    if (electronAPI) {
      electronAPI.on("nav.toggle", this.toggleNavBar);
      electronAPI.on("nav.show", this.showNavBar);
      electronAPI.on("webPage.reload", this.onReload);
    }
  }

  unbindNavBar() {
    if (electronAPI) {
      electronAPI.removeEventListener("opacity.toggle", this.toggleNavBar);
      electronAPI.removeEventListener("nav.show", this.showNavBar);
    }
  }

  componentDidMount() {
    this.configureLoader();
    this.bindNavBar();
    this.unbindNavBar();
  }

  render() {
    return (
      <div className={"webpage " + (this.state.showNav && "with-nav")}>
        {this.state.showNav && (
          <NavBar
            url={this.state.url}
            onUrl={this.props.onUrl}
            onReload={this.onReload}
            onBack={this.onBack}
            onForward={this.onForward}
          />
        )}
        <webview
          plugins="true"
          useragent={USER_AGENT}
          ref={this.webView}
          id="view"
          className="page"
          src={this.props.url}
          autosize="on"
        />
      </div>
    );
  }
}

WebPage.propTypes = {
  url: PropTypes.string.isRequired,
  onUrl: PropTypes.func.isRequired,
};

export default WebPage;
