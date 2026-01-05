'use strict';

const PIECES = /^\/pieces\//;
const ACCOUNTS = /^\/([a-z]+_)?accounts\//;

/**
 * Rewrite piece/account paths
 */
module.exports = (path) => {
  if (PIECES.test(path)) {
    return Promise.resolve(path.replace(PIECES, '/stories/'));
  } else if (ACCOUNTS.test(path)) {
    return Promise.resolve(path.replace(ACCOUNTS, '/accounts/'));
  } else {
    return Promise.resolve(path);
  }
};
