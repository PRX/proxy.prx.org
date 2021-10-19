'use strict';

const Proxy = require('./lib/proxy');
const Redirect = require('./lib/redirect');
const util = require('./lib/util');

// These are the domains that this application is handling traffic for
const HOSTS = (process.env.CANONICAL_HOSTS || 'www.prx.org,proxy.prx.org,proxy.staging.prx.tech,localhost:3000').split(',');
const PRI_HOSTS = ['pri.org', 'www.pri.org', 'www-proxy-test.pri.org'];

// These are the domains that traffic is redirected to or used to fetch data
// when being proxied. They are NOT domains for traffic being handled by this
// application.
const EXCHANGE_HOST = process.env.EXCHANGE_HOST || 'exchange.prx.org';
const LISTEN_HOST = process.env.LISTEN_HOST || 'beta.prx.org';
const HELP_HOST = process.env.HELP_HOST || 'help.prx.org';
const CORPORATE_HOST = process.env.CORPORATE_HOST || 'corporate.prx.tech';
const THEWORLD_HOST = process.env.THEWORLD_HOST || 'theworld.org';
const THEWORLD_ADMIN_HOST = process.env.THEWORLD_ADMIN_HOST || 'admin.theworld.org';
const THEWORLD_FEEDS_HOST = process.env.THEWORLD_FEEDS_HOST || 'feeds.theworld.org';
const THEWORLD_FILES_HOST = process.env.THEWORLD_FILES_HOST || 'files.theworld.org';

const PRX_ROUTES = [
  [require('./routes/exchange-proxy'), new Proxy(EXCHANGE_HOST)],
  [require('./routes/listen-redirect'), new Redirect(LISTEN_HOST, require('./routes/listen-rewrite'))],
  [require('./routes/exchange-redirect'), new Redirect(EXCHANGE_HOST)],
  [require('./routes/help-redirect'), new Redirect(HELP_HOST, require('./routes/help-rewrite'))],
  [[/./], new Proxy(CORPORATE_HOST)],
];

const PRI_ROUTES = [
  [require('./routes/pri-admin-redirect'), new Redirect(THEWORLD_ADMIN_HOST, null, true, 301)],
  [require('./routes/pri-feeds-redirect'), new Redirect(THEWORLD_FEEDS_HOST, null, true, 301)],
  [require('./routes/pri-files-redirect'), new Redirect(THEWORLD_FILES_HOST, null, true, 301)],
  [require('./routes/pri-files-redirect'), new Redirect(THEWORLD_SITEMAP_HOST, null, true, 301)],
  [[/./], new Redirect(THEWORLD_HOST, null, true, 301)],
];

/**
 * Proxy requests here and there
 */
exports.handler = function handler(event, context, callback) {
  const apiId = event.requestContext.apiId;
  HOSTS.push(`${apiId}.execute-api.${process.env.AWS_REGION}.amazonaws.com`);

  const headers = util.keysToLowerCase(event.headers);

  let route;

  if (PRI_HOSTS.includes(headers.host)) {
    // Handle pri.org traffic
    PRI_ROUTES.find(([matchers, obj]) => {
      if (matchers.some(m => m.test(event.path))) {
        return route = obj;
      }
    });
  } else if (HOSTS.includes(headers.host)) {
    // Handle prx.org traffic
    const loggedIn = util.isLoggedIn(headers['cookie']);
    const isCrawler = util.isCrawler(headers['user-agent']);
    const isMobile = util.isMobile(headers['user-agent']);
    const hatesMobile = util.hatesMobileSite(headers['referer'], event.queryStringParameters);

    // test paths
    PRX_ROUTES.find(([matchers, obj]) => {
      if (matchers.some(m => m.test(event.path, loggedIn, isCrawler, isMobile, hatesMobile))) {
        return route = obj;
      }
    });
  } else {
    const loc = `https://${HOSTS[0]}${event.path}${util.queryToString(event.queryStringParameters)}`;
    return callback(null, {
      statusCode: 302,
      headers: { 'location': loc, 'content-type': 'text/plain' },
      body: `Moved to ${loc}`
    });
  }

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
      callback(null, {statusCode: 500, body: 'Something went wrong', headers: {'content-type': 'text/plain'}});
    });
  } else {
    console.error(`[ERROR] No handler for ${event.httpMethod} ${event.path}`);
    callback(null, {statusCode: 500, body: 'No handler for request', headers: {'content-type': 'text/plain'}});
  }
}
