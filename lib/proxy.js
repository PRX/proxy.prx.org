'use strict';

const http = require('http');
const https = require('https');
const util = require('./util');

/**
 * Make an http request based on an api-gateway event
 */
module.exports = class Proxy {

  constructor(host, useHttps = true) {
    this.host = host;
    this.protocol = useHttps ? https : http;
  }

  request(event, pathReplace, pathReplaceWith) {
    return new Promise((resolve, reject) => {
      let opts = this.eventToOptions(event);
      let originalPath, requestBody;
      if (pathReplace && pathReplaceWith) {
        originalPath = opts.path;
        opts.path = opts.path.replace(pathReplace, pathReplaceWith);
      }
      if (event.body) {
        requestBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
      }
      this._request(opts, requestBody, (err, resp, responseBody) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            method: opts.method,
            path: opts.path,
            originalPath: originalPath,
            status: resp.statusCode,
            headers: util.keysToLowerCase(resp.headers || {}),
            body: responseBody ? responseBody.toString('base64') : null
          });
        }
      });
    });
  }

  eventToOptions(event) {
    let opts = {};
    opts.hostname = this.host;
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
    opts.headers = util.keysToLowerCase(event.headers);
    delete opts.headers.host;
    return opts;
  }

  _request(opts, body, callback) {
    const req = this.protocol.request(opts, resp => {
      let data = [];
      resp.on('data', chunk => data.push(chunk));
      resp.on('end', () => callback(null, resp, data.length ? Buffer.concat(data) : null));
    });
    req.on('error', err => callback(err));
    if (body) {
      req.write(body);
    }
    req.end();
  }

}
