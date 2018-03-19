'use strict';

/**
 * Return a redirect
 */
module.exports = class Proxy {

  constructor(host, useHttps = true) {
    this.host = host;
    this.protocol = useHttps ? 'https' : 'http';
  }

  redirect(event, pathReplace, pathReplaceWith) {
    let loc = `${this.protocol}://${this.host}`;
    if (pathReplace && pathReplaceWith) {
      loc += event.path.replace(pathReplace, pathReplaceWith);
    } else {
      loc += event.path;
    }
    Object.keys(event.queryStringParameters || {}).forEach(key => {
      const sep = (loc.indexOf('?') === -1) ? '?' : '&';
      const val = event.queryStringParameters[key];
      if (val === '') {
        loc += sep + encodeURIComponent(key);
      } else {
        loc += sep + encodeURIComponent(key) + '=' + encodeURIComponent(val);
      }
    });
    return {
      statusCode: 302,
      headers: {'location': loc, 'content-type': 'text/plain', },
      body: `Moved to ${loc}`
    };
  }

}
