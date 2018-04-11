'use strict';

const http = require('http');
const https = require('https');
const util = require('./util');

/**
 * Make an http request based on an api-gateway event
 */
module.exports = class Proxy {

  constructor(host, rewrite, useHttps = true) {
    this.host = host;
    this.rewrite = rewrite;
    this.protocol = useHttps ? https : http;
  }

  request(event) {
    return this.eventToOptions(event).then(opts => {
      let requestBody;
      if (event.body) {
        requestBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
      }
      return this._request(opts, requestBody);
    }).then(([resp, responseBody]) => {
      return {
        statusCode: resp.statusCode,
        headers: util.keysToLowerCase(resp.headers || {}),
        body: responseBody ? responseBody.toString('base64') : null,
        isBase64Encoded: true
      };
    });
  }

  eventToOptions(event) {
    return new Promise((resolve, reject) => {
      let opts = {};
      opts.hostname = this.host;
      opts.method = event.httpMethod;
      opts.path = event.path + util.queryToString(event.queryStringParameters);
      opts.headers = util.keysToLowerCase(event.headers);
      delete opts.headers.host;

      // optionally rewrite path
      if (this.rewrite) {
        return this.rewrite(opts.path).then(newPath => {
          opts.path = newPath;
          resolve(opts);
        });
      } else {
        resolve(opts);
      }
    });
  }

  _request(opts, body) {
    return new Promise((resolve, reject) => {
      const req = this.protocol.request(opts, resp => {
        let data = [];
        resp.on('data', chunk => data.push(chunk));
        resp.on('end', () => resolve([resp, data.length ? Buffer.concat(data) : null]));
      });
      req.on('error', err => reject(err));
      if (body) {
        req.write(body);
      }
      req.end();
    });
  }

}
