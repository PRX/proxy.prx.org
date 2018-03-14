'use strict';

exports.handler = (event, context, callback) => {
  const sendText = (code, text) => {
    callback(null, {statusCode: code, body: text, headers: {'Content-Type': 'text/plain'}});
  };
  const sendJson = (code, data) => {
    callback(null, {statusCode: code, body: JSON.stringify(data, null, 2), headers: {'Content-Type': 'application/json'}});
  };
  const sendBinary = (buffer) => {
    callback(null, {statusCode: 200, isBase64Encoded: true, body: buffer.toString('base64'), headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.byteLength,
      'Content-Disposition': 'attachment',
      'Cache-Control': 'public, max-age=2592000'
    }});
  };
  const sendRedirect = (location) => {
    callback(null, {statusCode: 302, headers: {'Location': location}});
  };

  console.log('request: ' + JSON.stringify(event));
  sendText(200, 'Hello World');
};
