'use strict';

const Pusher = require('pusher');
const pushherConfig = require('./pusher.config');

const pusher = new Pusher(pushherConfig);

module.exports = { pusher };