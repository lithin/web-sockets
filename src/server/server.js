var http = require('http');
var server;

function Server() {
    return http.createServer(function(request, response) {
        response.writeHead(404);
        response.end();
    });
}

module.exports = function() {
    if (!server) {
        server = new Server();
    }

    return server;
};
