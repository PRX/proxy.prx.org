'use strict';

/**
 * Rewrite paths back to self
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
