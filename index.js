'use strict';

const https = require('https');

/**
 * Proxy requests here and there
 */
exports.handler = (event, context, callback) => {
  const sendText = (code, text) => {
    callback(null, {statusCode: code, body: text, headers: {'content-type': 'text/plain'}});
  };
  const sendBuffer = (code, headers, buffer) => {
    callback(null, {
      statusCode: code,
      headers: keysToLowerCase(headers) || {},
      body: buffer.toString('base64'),
      isBase64Encoded: true
    });
  };
  const corpHost = process.env.CORPORATE_HOST || 'corporate.prx.tech';

  // assemble request options
  let opts = {}
  opts.hostname = corpHost;
  opts.method = event.httpMethod;
  opts.path = event.path;
  Object.keys(event.queryStringParameters || {}).forEach(key => {
    const sep = (opts.path.indexOf('?') === -1) ? '?' : '&';
    const val = event.queryStringParameters[key];
    if (val === '') {
      opts.path += sep + encodeURIComponent(key);
    } else {
      opts.path += sep + encodeURIComponent(key) + '=' + encodeURIComponent(val);
    }
  });
  opts.headers = keysToLowerCase(event.headers);
  delete opts.headers.host;

  // make request
  const req = https.request(opts, resp => {
    console.log(`${resp.statusCode} ${event.httpMethod} ${event.path}`);
    let data = [];
    resp.on('data', chunk => data.push(chunk));
    resp.on('end', () => {
      const buffer = Buffer.concat(data);
      sendBuffer(resp.statusCode, resp.headers, buffer);
    });
  }).on('error', err => {
    console.log(`500 ${event.httpMethod} ${event.path}`);
    console.error(err);
    sendText(500, 'Something went wrong');
  });

  // optional request body
  if (event.body) {
    if (event.isBase64Encoded) {
      const buff = Buffer.from(event.body, 'base64');
      req.write(buff);
    } else {
      req.write(event.body);
    }
  }

  // fire!
  req.end();
};

// consistently lowercase header keys
function keysToLowerCase(obj) {
  if (obj) {
    let lower = {};
    Object.keys(obj || {}).forEach(k => lower[k.toLowerCase()] = obj[k]);
    return lower;
  } else {
    return obj;
  }
}
