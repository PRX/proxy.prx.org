'use strict';

const Proxy = require('./lib/proxy');
const Redirect = require('./lib/redirect');
const util = require('./lib/util');

const EXCHANGE_HOST = process.env.EXCHANGE_HOST || 'exchange.prx.org';
const LISTEN_HOST = process.env.LISTEN_HOST || 'beta.prx.org';
const CORPORATE_HOST = process.env.CORPORATE_HOST || 'corporate.prx.tech';
const LISTEN_REWRITE = require('./routes/listen-rewrite');
const ROUTES = [
  [require('./routes/exchange-proxy'), new Proxy(EXCHANGE_HOST)],
  [require('./routes/listen-redirect'), new Redirect(LISTEN_HOST, LISTEN_REWRITE)],
  [require('./routes/exchange-redirect'), new Redirect(EXCHANGE_HOST)],
  [[/./], new Proxy(CORPORATE_HOST)],
];

/**
 * Proxy requests here and there
 */
exports.handler = function handler(event, context, callback) {
  const loggedIn = util.isLoggedIn(event.headers['Cookie']);
  const isCrawler = util.isCrawler(event.headers['User-Agent']);
  const isMobile = util.isMobile(event.headers['User-Agent']);
  const hatesMobile = util.hatesMobileSite(event.headers['Referer'], event.queryStringParameters);

  // test paths
  let route;
  ROUTES.find(([matchers, obj]) => {
    if (matchers.some(m => m.test(event.path, loggedIn, isCrawler, isMobile, hatesMobile))) {
      return route = obj;
    }
  });

  // async handle proxying or redirecting
  if (route) {
    route.request(event).then(resp => {
      const name = route.constructor.name;
      const path = `${route.host}${event.path}`;
      console.log(`[INFO] ${name} ${resp.statusCode} ${event.httpMethod} ${path}`);
      callback(null, resp);
    }).catch(err => {
      console.error(`[ERROR] 500 ${event.httpMethod} ${event.path}`);
      console.error(err);
      callback(null, ApiResponse.error('Something went wrong'));
    });
  } else {
    console.error(`[ERROR] No handler for ${event.httpMethod} ${event.path}`);
    callback(null, ApiResponse.error('Something went wrong'));
  }
}
