'use strict';

const Proxy = require('./lib/proxy');
const Redirect = require('./lib/redirect');
const util = require('./lib/util');

// These are the domains that this application is handling traffic for
const HOSTS = (process.env.CANONICAL_HOSTS || 'www.prx.org,proxy.prx.org,proxy.staging.prx.tech,localhost:3000').split(',');
const PRI_HOSTS = ['pri.org', 'www.pri.org', 'beta.pri.org', 'www-proxy-test.pri.org'];
const SOUNDRISE_HOSTS = ['wearesoundrise.com', 'www.wearesoundrise.com'];

// Values set using the x-prx-domain header
// This is for cases where the proxy is running behind a CDN and is not getting
// the viewer request domain. It allow for explicit handling of traffic from
// specific CDNs (i.e., different CDNs would handle different domains, like
// one for prx.org and one for pri.org).
const PRI_HEADER_DOMAIN = 'pri.org';
const SOUNDRISE_HEADER_DOMAIN = 'wearesoundrise.com';

// These are the domains that traffic is redirected to or used to fetch data
// when being proxied. They are NOT domains for traffic being handled by this
// application.
const PRX_HOST = process.env.PRX_HOST || 'www.prx.org';
const EXCHANGE_HOST = process.env.EXCHANGE_HOST || 'exchange.prx.org';
const LISTEN_HOST = process.env.LISTEN_HOST || 'beta.prx.org';
const HELP_HOST = process.env.HELP_HOST || 'help.prx.org';
const CORPORATE_HOST = process.env.CORPORATE_HOST || 'corporate.prx.tech';
const THEWORLD_HOST = process.env.THEWORLD_HOST || 'theworld.org';
const THEWORLD_ADMIN_HOST = process.env.THEWORLD_ADMIN_HOST || 'admin.theworld.org';
const THEWORLD_EMBEDS_HOST = process.env.THEWORLD_EMBEDS_HOST || 'embedded.theworld.org';
const THEWORLD_FEEDS_HOST = process.env.THEWORLD_FEEDS_HOST || 'feeds.theworld.org';
const THEWORLD_FILES_HOST = process.env.THEWORLD_FILES_HOST || 'files.theworld.org';
const THEWORLD_SITEMAP_HOST = process.env.THEWORLD_SITEMAP_HOST || 'sitemap.theworld.org';
const SOUNDRISE_HOST = process.env.SOUNDRISE_HOST || 'www.wearesoundrise.com';

const PRX_ROUTES = [
  [require('./routes/exchange-proxy'), new Proxy(EXCHANGE_HOST)],
  [require('./routes/listen-redirect'), new Redirect(LISTEN_HOST, require('./routes/listen-rewrite'))],
  [require('./routes/exchange-redirect'), new Redirect(EXCHANGE_HOST)],
  [require('./routes/help-redirect'), new Redirect(HELP_HOST, require('./routes/help-rewrite'))],
  [[/./], new Proxy(CORPORATE_HOST)],
];

const PRI_ROUTES = [
  [require('./routes/pri-admin-redirect'), new Redirect(THEWORLD_ADMIN_HOST, null, true, 301)],
  [require('./routes/pri-embed-redirect'), new Redirect(THEWORLD_EMBEDS_HOST, null, true, 301)],
  [require('./routes/pri-feeds-redirect'), new Redirect(THEWORLD_FEEDS_HOST, null, true, 301)],
  [require('./routes/pri-files-redirect'), new Redirect(THEWORLD_FILES_HOST, null, true, 301)],
  [require('./routes/pri-sitemap-redirect'), new Redirect(THEWORLD_SITEMAP_HOST, null, true, 301)],
  [[/./], new Redirect(THEWORLD_HOST, null, true, 301)],
];

const SOUNDRISE_REDIRECT = new Redirect(PRX_HOST, (_p) => Promise.resolve('/sponsorship'));

/**
 * Proxy requests here and there
 */
exports.handler = async function handler(event) {
  const apiId = event.requestContext.apiId;
  HOSTS.push(`${apiId}.execute-api.${process.env.AWS_REGION}.amazonaws.com`);

  const headers = util.keysToLowerCase(event.headers);

  let route;
  let domain = 'default';

  if (PRI_HOSTS.includes(headers.host) || headers['x-prx-domain'] === PRI_HEADER_DOMAIN) {
    domain = 'pri';
    // Handle pri.org traffic
    PRI_ROUTES.find(([matchers, obj]) => {
      if (matchers.some(m => m.test(event.path))) {
        return route = obj;
      }
    });
  } else if (SOUNDRISE_HOSTS.includes(headers.host) || headers['x-prx-domain'] === SOUNDRISE_HEADER_DOMAIN) {
    // Handle wearesoundrise.com traffic
    domain = 'soundrise';
    route = SOUNDRISE_REDIRECT;
  } else if (HOSTS.includes(headers.host)) {
    // Handle prx.org traffic
    domain = 'prx';
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
    return {
      statusCode: 302,
      headers: { 'location': loc, 'content-type': 'text/plain' },
      body: `Moved to ${loc}`
    };
  }

  // async handle proxying or redirecting
  if (route) {
    return route.request(event).then(resp => {
      const name = route.constructor.name;
      const path = `${route.host}${event.path}`;

      console.info(JSON.stringify({
        statusCode: resp.statusCode,
        httpMethod: event.httpMethod,
        routeType: name,
        routeDestination: path,
        domain: domain,
      }))

      return resp;
    }).catch(err => {
      console.error(`[ERROR] 500 ${event.httpMethod} ${event.path}`);
      console.error(err);
      return {statusCode: 500, body: 'Something went wrong', headers: {'content-type': 'text/plain'}};
    });
  } else {
    console.error(`[ERROR] No handler for ${event.httpMethod} ${event.path}`);
    return {statusCode: 500, body: 'No handler for request', headers: {'content-type': 'text/plain'}};
  }
};
