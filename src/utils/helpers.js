import isUrl from 'is-url';
import parseUrl from 'url-parse';

/**
 * Prepares the embed-able URL for the given youtube URL
 * @param url
 * @return {*}
 */
const prepareYoutubeUrl = (url) => {
  // Let the webview handle standard YouTube links natively to avoid Error 152/153
  // and we'll inject CSS/JS to hide the UI instead of relying on /embed/ which gets blocked
  return url;
};

/**
 * Prepares vimeo URL for embed functionality
 * @param url
 * @return {*}
 */
const prepareVimeoUrl = (url) => {
  const parsedUrl = parseUrl(url, true);
  if (!parsedUrl.host.includes('vimeo.com')) {
    return url;
  }

  const videoHash = parsedUrl.pathname.replace(/\//g, '');

  // Vimeo video ids are all numeric
  if (!/^\d+$/.test(videoHash)) {
    return url;
  }

  return `http://player.vimeo.com/video/${videoHash}?autoplay=1&loop=1`;
};

/**
 * Prepares twitch URL for embed functionality
 * @param url
 * @return {*}
 */
const prepareTwitchUrl = (url) => {
  const parsedUrl = parseUrl(url, true);
  if (!parsedUrl.host.includes('twitch.tv')) {
    return url;
  }

  // Return embed link only if on channel page
  if (!parsedUrl.query || !parsedUrl.query.channel) {
    return url;
  }

  return `https://player.twitch.tv?html5&channel=${parsedUrl.query.channel}`;
};

/**
 * Prepares dailymotion URL for embed functionality
 * @param url
 * @return {*}
 */
const prepareDailyMotionUrl = (url) => {
  url = url.replace(/^http(s)?:\/\/dai\.ly\//, 'http://www.dailymotion.com/video/');

  const parsedUrl = parseUrl(url, true);
  if (!parsedUrl.host.includes('dailymotion.com') || !parsedUrl.pathname.includes('/video')) {
    return url;
  }

  const videoHash = parsedUrl.pathname.replace(/\/video\//g, '');
  if (!videoHash) {
    return;
  }

  return `http://www.dailymotion.com/embed/video/${videoHash}`;
};

/**
 * Prepares the given URL for loading in webview
 * @param url
 * @param useembedVideos
 * @return string
 */
export const prepareUrl = function (url, useembedVideos = true) {
  url = url.trim();
  if (!url) {
    return '';
  }

  // Search on google if not a URL
  if (!isUrl(url) && !isUrl(`http://${url}`)) {
    return `https://www.google.com/search?q=${url}`;
  }

  url = /^http(s)?:\/\//.test(url) || /^file:\/\/\//.test(url) ? url : `http://${url}`;

  // Magic URLs turn a normal link to embed link for some video streaming services,
  // return the normal URL if that is not required
  if (!useembedVideos) {
    return url;
  }

  url = prepareYoutubeUrl(url);
  url = prepareVimeoUrl(url);
  url = prepareTwitchUrl(url);
  url = prepareDailyMotionUrl(url);

  return url;
};
