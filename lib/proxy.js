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

  retries(index) {
    return [1000, 1000, 1000, 5000][index];
  }

  request(event) {
    return this.eventToOptions(event).then(opts => {
      let requestBody;
      if (event.body) {
        requestBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
      }
      return new Promise((resolve, reject) => {
        this._request(opts, requestBody, resolve, reject);
      });
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

  _request(opts, body, resolve, reject, attemptNum = 0) {
    let timeout, aborted = false, data = [];
    const req = this.protocol.request(opts, resp => {
      resp.on('data', chunk => data.push(chunk));
      resp.on('end', () => {
        clearTimeout(timeout);
        resolve([resp, data.length ? Buffer.concat(data) : null]);
      });
    });
    req.on('error', err => {
      if (!aborted) {
        clearTimeout(timeout);
        reject(err);
      }
    });
    if (body) {
      req.write(body);
    }
    req.end();

    // depending on which attempt this is, set a timeout
    const wait = this.retries(attemptNum);
    if (wait) {
      timeout = setTimeout(() => {
        aborted = true;
        req.abort();

        const info = `${opts.method} ${opts.hostname}${opts.path}`;
        console.warn(`[WARN] Timed out after ${wait}ms - ${info}`);

        this._request(opts, body, resolve, reject, attemptNum + 1);
      }, wait);
    }
  }

}
