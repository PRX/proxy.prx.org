'use strict';

const Proxy = require('./lib/proxy');
const Redirect = require('./lib/redirect');
const util = require('./lib/util');

const corporate = new Proxy(process.env.CORPORATE_HOST || 'corporate.prx.tech');
const exchange = new Redirect(process.env.EXCHANGE_HOST || 'exchange.prx.org');
const exchangePaths = [
  /^\/pieces\/([^\/]+)\/?$/,
  /^\/accounts\/([^\/]+)\/?$/,
  /^\/group_accounts\/([^\/]+)\/?$/,
  /^\/station_accounts\/([^\/]+)\/?$/,
  /^\/users\/([^\/]+)\/?$/,
];

/**
 * Proxy requests here and there
 */
exports.handler = function handler(event, context, callback) {
  // const loggedIn = util.isLoggedIn(event.headers['Cookie']);
  // const crawler = util.isCrawler(event.headers['User-Agent']);
  if (exchangePaths.some(p => p.test(event.path))) {
    console.log(`[INFO] 302 ${event.httpMethod} ${event.path}`);
    callback(null, exchange.redirect(event));
  } else {
    corporate.request(event).then(resp => {
      if (resp.originalPath) {
        console.log(`[INFO] ${resp.statusCode} ${resp.method} ${resp.originalPath} -> ${resp.path}`);
      } else {
        console.log(`[INFO] ${resp.statusCode} ${resp.method} ${resp.path}`);
      }
      callback(null, resp);
    }).catch(err => {
      console.error(`[ERROR] 500 ${event.httpMethod} ${event.path}`);
      console.error(err);
      callback(null, {statusCode: 500, body: 'Something went wrong', headers: {'content-type': 'text/plain'}});
    });
  }
}
