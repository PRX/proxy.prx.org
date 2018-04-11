'use strict';

const cookie = require('cookie');
const binaryCase = require('binary-case');
const prxSessionKey = process.env.PRX_SESSION_KEY || '_prx_session';

const MOBILE_REGEX = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i;
const MOBILE_SITE_REGEX = /beta\.prx\.|listen\.prx\.|localhost/i;
const ROBOT_REGEX = /googlebot|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|bingbot/i;

/**
 * Check for the presence of the prx-session cookie
 */
exports.isLoggedIn = (cookieStr) => {
  const cookies = cookie.parse(cookieStr || '');
  return cookies[prxSessionKey] ? true : false;
};

/**
 * Check if a user agent looks like a bot
 */
exports.isCrawler = (userAgent) => {
  return ROBOT_REGEX.test(userAgent || '');
};

/**
 * Check if a user agent looks like a mobile device
 */
exports.isMobile = (userAgent) => {
  return MOBILE_REGEX.test(userAgent || '');
};

/**
 * Sometimes you just can't go back
 */
exports.hatesMobileSite = (referrer, queryParams) => {
  const mParam = (queryParams || {})['m'];
  if (MOBILE_SITE_REGEX.test(referrer || '')) {
    return true;
  } else if ([0, '0', false, 'false'].indexOf(mParam) > -1) {
    return true;
  } else {
    return false;
  }
};

/**
 * Consistently lowercase header keys, except for this set-cookie hack:
 * https://forums.aws.amazon.com/thread.jspa?threadID=205782
 */
exports.keysToLowerCase = (obj) => {
  if (obj) {
    let lower = {};
    Object.keys(obj || {}).forEach(k => {
      const key = k.toLowerCase();
      const val = obj[k];
      if (typeof(val) === 'string') {
        lower[key] = val;
      } else if (Array.isArray(val) && val.length === 1) {
        lower[key] = val[0];
      } else if (Array.isArray(val)) {
        const iterator = binaryCase.iterator(key);
        val.forEach(subVal => {
          lower[iterator.next().value] = subVal;
        });
      } else {
        console.warn('WARN: unknown header value', k, typeof obj[k], obj[k]);
      }
    });
    return lower;
  } else {
    return obj;
  }
};

/**
 * Convert an object into an actual query string
 */
exports.queryToString = (obj) => {
  let str = '';
  Object.keys(obj || {}).forEach(key => {
    const sep = (str.indexOf('?') === -1) ? '?' : '&';
    const val = obj[key];
    if (val === '') {
      str += sep + encodeURIComponent(key);
    } else {
      str += sep + encodeURIComponent(key) + '=' + encodeURIComponent(val);
    }
  });
  return str;
};
