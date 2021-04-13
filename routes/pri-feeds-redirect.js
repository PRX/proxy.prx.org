'use strict';

/**
 * Paths redirected to The World feeds
 */
module.exports = [
  /^\/feeds\?\//,
  /^.*\/feed\//,
  /feed$/,
  /^\/stories\/feed/,
  /^\/allstories\/feed/,
  /^\/collections\/[\d]\/feed/,
  /^\/sections\/[\d]\/feed/,
  /^\/verticals\/[\d]\/feed/,
  /^\/verticals-listing\/[\d]\/feed/,
  /^program\/[\d]\/feed/,
  /^\/programs\/[\d]\/[\d]\/feed/,
  /^\/fia\/nodes.rss$/,
  /^\/social-posts\//,
];
