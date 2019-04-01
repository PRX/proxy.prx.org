'use strict';

/**
 * Just rewrite to root url
 */
module.exports = (path) => {
  if (path.match(/^\/about-us\/contact/)) {
    return Promise.resolve('/company/about/#contact');
  } else if (path.match(/^\/contact/)) {
    return Promise.resolve('/company/about/#contact');
  } else {
    return Promise.resolve('');
  }
};
