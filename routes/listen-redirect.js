'use strict';

// helper to make a regexp-like matcher
function makeMatcher(regex, a, b, c, d) {
  return {
    test: (path, loggedIn, isCrawler, isMobile, hatesBeta) => {
      return regex.test(path)
        && (a === null || loggedIn === a)
        && (b === null || isCrawler === b)
        && (c === null || isMobile === c)
        && (d === null || hatesBeta === d);
    }
  }
}

/**
 * Paths (plus other state matchers) redirected to listen
 */
module.exports = [
  makeMatcher(/^\/pieces\//, false, false, null, false),
  makeMatcher(/^\/accounts\//, false, null, true, false),
  makeMatcher(/^\/group_accounts\//, false, null, true, false),
  makeMatcher(/^\/individual_accounts\//, false, null, true, false),
  makeMatcher(/^\/station_accounts\//, false, null, true, false),
  makeMatcher(/^\/users\//, false, null, true, false)
];
