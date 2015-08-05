var uuid = require('node-uuid');
var Server = require('./server');
var WebSocketServer = require('websocket').server;
var clients = [];

function deleteClient(uid) {
    var i;

    for (i = 0; i < clients.length; i++) {
        if (clients[i].uid === uid) {
            clients.splice(i, 1);
            break;
        }
    }
}

function sendMessage(client, message) {
    client.sendUTF(JSON.stringify(message));
}

function init() {
    var server = Server().listen(8080);
    var webSocketServer = new WebSocketServer({
        httpServer: server
    });

    webSocketServer.on('request', function(request) {
        var socket = request.accept('chat-room', request.origin);
        var clientUid = uuid.v4();
        var confirmationMessage = {
            type: 'confirmation',
            uid: clientUid
        };

        clients.push({
            "uid": clientUid,
            "ws": socket
        });

        sendMessage(socket, confirmationMessage);

        socket.on('message', function(message) {
            var response = {
                type: 'response',
                code: 200
            };
            var requiredParameters = ['uid', 'timestamp', 'username', 'text'];
            var messageParameters;
            var parameter;
            var i;

            console.log(message);

            if (message.type === 'utf8') {
                message = JSON.parse(message.utf8Data);
                messageParameters = Object.keys(message);

                for (i = 0; i < requiredParameters.length; i++) {
                    parameter = requiredParameters[i];
                    if (!~messageParameters.indexOf(parameter)) {
                        response.code = 400;
                        response.message = 'Request is missing ' + parameter;
                        break;
                    }
                }

                if (response.code === 200) {
                    delete message.uid;
                    message.type = 'message';

                    for (i = 0; i < clients.length; i++) {
                        sendMessage(clients[i].ws, message);
                    }
                } else {
                    sendMessage(socket, response);
                }
            }
        });

        socket.on('close', function() {
            deleteClient(clientUid);
        });
    });

    console.log('Server is up and running!');

    return webSocketServer;
}

module.exports = {
    init: init,
    getClients: function() {
        return clients;
    }
};
