'use strict';

/**
 * Paths redirected/rewritten back to self
 *
 * MAKE SURE these don't produce an infinite redirect loop
 */
module.exports = [
  /^\/about-us\/contact/,
  /^\/contact/,
];
