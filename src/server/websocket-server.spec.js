'use strict';

describe('websocket server,', function() {
    var sinon = require('sinon');
    var expect = require('chai').expect;
    var rewire = require('rewire');
    var WebSocket = require('./../core/global').WebSocket;
    var WebSocketServer = rewire('./websocket-server');
    var httpServer;
    var httpServerStub;
    var server;
    var socket;

    beforeEach(function() {
        var http;

        if (!server) {
            http = require('http');

            httpServer = http.createServer(function(request, response) {
                response.end();
            });
            sinon.spy(httpServer, 'listen');
            httpServerStub = sinon.stub().returns(httpServer);
            WebSocketServer.__set__('Server', httpServerStub);

            server = WebSocketServer.init();
        }

        socket = new WebSocket('ws://localhost:8080', 'chat-room');
    });

    afterEach(function() {
        socket.close();
    });

    describe('server', function() {
        it('hooks itself onto an http server', function() {
            expect(httpServerStub.called).to.equal(true);
        });

        it('starts listening at http port 8080', function() {
            expect(httpServer.listen.calledWith(8080)).to.equal(true);
        });
    });

    describe('when a connection is opened,', function() {
        it('saves the client for future reference', function(done) {
            socket.onopen = function() {
                var clients = WebSocketServer.getClients();
                expect(clients.length).to.equal(1);
                done();
            };
        });

        it('sends back client uid to the socket', function(done) {
            socket.onmessage = function(response) {
                response = JSON.parse(response.data);
                if (response.type === 'confirmation') {
                    expect(response.uid).to.equal(WebSocketServer.getClients()[0].uid);
                    done();
                }
            };
        });
    });

    describe('when a connection closes,', function() {
        it('deletes the client from our list', function() {
            socket.close();

            expect(WebSocketServer.getClients().length).to.equal(0);
        });
    });

    describe('when it receives a message from client,', function() {
        var sendMessage = function() {
            if (socket.readyState === 1) {
                socket.send(JSON.stringify(message));
            } else {
                socket.onopen = function open() {
                    socket.send(JSON.stringify(message));
                };
            }
        };
        var waitForCode = function(code, done) {
            socket.onmessage = function(response) {
                response = JSON.parse(response.data);
                if (response.type === 'response') {
                    expect(response.code).to.equal(code);
                    if (code === 400) {
                        expect(response.message).to.be.a('string');
                    }
                    done();
                }
            };
        };
        var message;

        beforeEach(function() {
            message = {
                uid: 10,
                username: 'Daryl',
                timestamp: 0,
                text: 'This is a message'
            };
        });

        it('returns a confirmation code 200', function(done) {
            waitForCode(200, done);

            sendMessage();
        });

        it('sends this message to all other clients, stripped of socket uid', function(done) {
            var socket2 = new WebSocket('ws://localhost:8080', 'chat-room');
            var responseMessage = {
                username: 'Daryl',
                timestamp: 0,
                text: 'This is a message',
                type: 'message'
            };

            socket2.onopen = sendMessage;

            socket2.onmessage = function(response) {
                response = JSON.parse(response.data);
                if (response.type === 'message') {
                    expect(response).to.deep.equal(responseMessage);
                    done();
                }
            };
        });

        it('returns bad request code 400 if the message JSON does not contain socket uid', function(done) {
            waitForCode(400, done);

            delete message.uid;
            sendMessage();
        });

        it('returns bad request code 400 if the message JSON does not contain username', function(done) {
            waitForCode(400, done);

            delete message.username;
            sendMessage();
        });

        it('returns bad request code 400 if the message JSON does not contain a timestamp', function(done) {
            waitForCode(400, done);

            delete message.timestamp;
            sendMessage();
        });

        it('returns bad request code 400 if the message JSON does not contain text', function(done) {
            waitForCode(400, done);

            delete message.text;
            sendMessage();
        });
    });
});
