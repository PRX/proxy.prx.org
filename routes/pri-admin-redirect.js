'use strict';

/**
 * Paths redirected to The World admin
 */
module.exports = [
  /^\/admin\//,
  /^\/node\/[\d]\/(edit|moderation|embedded|popout|log)$/,
  /^\/file\/[\d]+\/(edit|usage|delete)$/,
  /^\/user\//,
  /^\/profile\//,
  /^\/import\//,
];
