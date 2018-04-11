'use strict';

/**
 * Return a redirect
 */
module.exports = class Proxy {

  constructor(host, rewrite, useHttps = true) {
    this.host = host;
    this.rewrite = rewrite;
    this.protocol = useHttps ? 'https' : 'http';
  }

  request(event) {
    if (this.rewrite) {
      return this.rewrite(event.path).then(newPath => {
        return this._request(event, newPath);
      });
    } else {
      return this._request(event, event.path);
    }
  }

  _request(event, path) {
    let loc = `${this.protocol}://${this.host}${path || ''}`;
    Object.keys(event.queryStringParameters || {}).forEach(key => {
      const sep = (loc.indexOf('?') === -1) ? '?' : '&';
      const val = event.queryStringParameters[key];
      if (val === '') {
        loc += sep + encodeURIComponent(key);
      } else {
        loc += sep + encodeURIComponent(key) + '=' + encodeURIComponent(val);
      }
    });
    return Promise.resolve({
      statusCode: 302,
      headers: {'location': loc, 'content-type': 'text/plain', },
      body: `Moved to ${loc}`
    });
  }

}
