var globalVariables = {};

// polyfill for tests and browsers that don't support WebSocket API
globalVariables.WebSocket = (typeof window !== 'undefined' && window.WebSocket) || require('websocket').w3cwebsocket;

module.exports = globalVariables;
