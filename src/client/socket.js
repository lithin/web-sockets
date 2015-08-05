var WebSocketAPI = require('../core/global').WebSocket;

function Socket() {
    this.socket = new WebSocketAPI('ws://localhost:8080', 'chat-room');

    this.callbacks = {
        message: null,
        response: null,
        confirmation: null,
        open: null,
        close: null,
        error: null
    };
    this.log = {};

    // make the socket log available in the browser window
    if (window) {
        if (!window.socketLog) {
            window.socketLog = [];
        }
        window.socketLog.push(this.log);
    }

    // bind events - every event is written in a log and runs a callback
    this.socket.onopen = (function() {
        addLog.call(this, 'connection open');
        runCallback.call(this, 'open');
    }).bind(this);

    this.socket.onclose = (function() {
        addLog.call(this, 'connection closed');
        runCallback.call(this, 'close');
    }).bind(this);

    this.socket.onerror = (function(e) {
        addLog.call(this, 'error', e);
        runCallback.call(this, 'error', e);
    }).bind(this);

    this.socket.onmessage = (function(e) {
        try {
            var data = JSON.parse(e.data);

            addLog.call(this, 'message', data);

            if (data.type === 'confirmation' && data.uid) {
                this.uid = data.uid;
            }

            runCallback.call(this, data.type, data);
        } catch (e) {
            addLog.call(this, 'error', e.message);

            throw new Error('Data received from the server was not valid JSON');
        }
    }).bind(this);
}

Socket.prototype.send = function(message) {
    var error;

    if (typeof message === 'object' && this.socket.readyState === 1) {
        message.uid = this.uid;

        this.socket.send(JSON.stringify(message));
    } else {
        error = new Error('Socket is not ready or message is not valid');
        addLog.call(this, 'error', error);
        throw error;
    }
};

Socket.prototype.on = function(event, callback) {
    if (typeof event !== 'string' || typeof callback !== 'function' || this.callbacks[event] === undefined) {
        throw new Error('Function "on" is missing required arguments.');
    }

    this.callbacks[event] = callback;
};

Socket.prototype.disconnect = function() {
    this.socket.close();
};

function addLog(type, content) {
    var log = {
        type: type
    };

    if (content) {
        log.content = content;
    }

    this.log[Date.now()] = log;
}

function runCallback(type, data) {
    if (this.callbacks[type]) {
        this.callbacks[type](data);
    }
}

module.exports = Socket;
