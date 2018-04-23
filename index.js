'use strict';

const Proxy = require('./lib/proxy');
const Redirect = require('./lib/redirect');
const util = require('./lib/util');

const HOSTS = (process.env.CANONICAL_HOSTS || 'www.prx.org,proxy.prx.org,proxy.staging.prx.tech,localhost:3000').split(',');

const EXCHANGE_HOST = process.env.EXCHANGE_HOST || 'exchange.prx.org';
const LISTEN_HOST = process.env.LISTEN_HOST || 'beta.prx.org';
const HELP_HOST = process.env.HELP_HOST || 'help.prx.org';
const CORPORATE_HOST = process.env.CORPORATE_HOST || 'corporate.prx.tech';
const ROUTES = [
  [require('./routes/exchange-proxy'), new Proxy(EXCHANGE_HOST)],
  [require('./routes/listen-redirect'), new Redirect(LISTEN_HOST, require('./routes/listen-rewrite'))],
  [require('./routes/exchange-redirect'), new Redirect(EXCHANGE_HOST)],
  [require('./routes/help-redirect'), new Redirect(HELP_HOST, require('./routes/help-rewrite'))],
  [[/./], new Proxy(CORPORATE_HOST)],
];

/**
 * Proxy requests here and there
 */
exports.handler = function handler(event, context, callback) {
  const headers = util.keysToLowerCase(event.headers);
  const loggedIn = util.isLoggedIn(headers['cookie']);
  const isCrawler = util.isCrawler(headers['user-agent']);
  const isMobile = util.isMobile(headers['user-agent']);
  const hatesMobile = util.hatesMobileSite(headers['referer'], event.queryStringParameters);

  // make sure we're at a canonical host
  if (HOSTS.length && headers['host'] && HOSTS.indexOf(headers['host']) === -1) {
    const loc = `https://${HOSTS[0]}${event.path}${util.queryToString(event.queryStringParameters)}`;
    return callback(null, {
      statusCode: 302,
      headers: {'location': loc, 'content-type': 'text/plain', },
      body: `Moved to ${loc}`
    });
  }

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
