'use strict';

describe('socket,', function() {
    var sinon = require('sinon');
    var expect = require('chai').expect;
    var rewire = require('rewire');
    var WebSocket = rewire('./socket');
    var webSocket;
    var clock;
    var stub;

    beforeEach(function() {
        stub = sinon.stub().returns({});
        WebSocket.__set__('WebSocketAPI', stub);
        webSocket = new WebSocket();
        clock = sinon.useFakeTimers();
    });

    afterEach(function() {
        clock.restore();
    });

    function logsError() {
        expect(webSocket.log[0].type).to.equal('error');
        expect(webSocket.log[0]).to.include.keys('content');
    }

    describe('constructor()', function() {
        function expectSocketFunction(functionType) {
            expect(webSocket.socket[functionType]).to.be.a('function');
        }

        it('creates a new web socket', function(){
            expect(webSocket.socket).to.be.an('object');
            expect(stub.calledWithNew()).to.equal(true);
        });

        it('creates an object to store all callbacks', function() {
            expect(webSocket.callbacks).to.deep.equal({
                message: null,
                response: null,
                confirmation: null,
                open: null,
                close: null,
                error: null
            });
        });

        it('creates an empty object for logs', function() {
            expect(webSocket.log).to.deep.equal({});
        });

        it('defines function for onopen', function() {
            expectSocketFunction('onopen');
        });

        it('defines function for onmessage', function() {
            expectSocketFunction('onmessage');
        });

        it('defines function for onclose', function() {
            expectSocketFunction('onclose');
        });

        it('defines function for onerror', function() {
            expectSocketFunction('onerror');
        });
    });

    describe('when it opens a connection,', function() {
        it('adds this event into the socket log with a timestamp', function() {
            webSocket.socket.onopen.call(webSocket);

            expect(webSocket.log[0].type).to.equal('connection open');
        });

        it('calls an appropriate callback if there is one', function() {
            var spy = sinon.spy();
            webSocket.on('open', spy);

            webSocket.socket.onopen.call(webSocket);

            expect(spy.called).to.equal(true);
        });
    });

    describe('when it receives a message,', function() {
        function getMessage(data) {
            return {
                data: JSON.stringify(data)
            };
        }

        it('adds this event into the socket log with a timestamp', function() {
            var data = {
                type: 'response'
            };
            var message = getMessage(data);

            webSocket.socket.onmessage.call(webSocket, message);

            expect(webSocket.log[0].type).to.equal('message');
            expect(webSocket.log[0].content).to.deep.equal(data);
        });

        describe('calls an appropriate callback if there is one, passing it parsed data object', function() {
            function onMessage(messageType) {
                var data = {
                    type: messageType
                };
                var message = getMessage(data);

                var spy = sinon.spy();

                webSocket.on(messageType, spy);

                webSocket.socket.onmessage.call(webSocket, message);

                expect(spy.calledWith(data)).to.equal(true);
            }

            it('calls response callback if message type is response', function() {
                onMessage('response');
            });

            it('calls connected callback if message type is confirmation', function() {
                onMessage('confirmation');
            });

            it('calls message callback if message type is message', function() {
                onMessage('message');
            });
        });

        it('saves uid if connection confirmation was sent from the server', function() {
            var message = getMessage({
                type: 'confirmation',
                uid: 10
            });

            webSocket.socket.onmessage.call(webSocket, message);

            expect(webSocket.uid).to.equal(10);
        });

        it('fails, noting this in a log, if the data received from server is not valid JSON', function() {
            var message = {
                type: 'message'
            };
            var expectToThrow = function() {
                webSocket.socket.onmessage.call(webSocket, message);
            };

            expect(expectToThrow).throw(Error);
            logsError();
        });
    });

    describe('when it closes connection', function() {
        it('adds this event into the socket log with a timestamp', function() {
            webSocket.socket.onclose.call(webSocket);

            expect(webSocket.log[0].type).to.equal('connection closed');
        });

        it('calls an appropriate callback if there is one', function() {
            var spy = sinon.spy();
            webSocket.on('close', spy);

            webSocket.socket.onclose.call(webSocket);

            expect(spy.called).to.equal(true);
        });
    });

    describe('in case an error occurs,', function() {
        var error = new Error('Something went terribly wrong!');

        it('adds this event into the socket log with a timestamp', function() {
            webSocket.socket.onerror.call(webSocket, error);

            logsError();
        });

        it('calls an appropriate callback if there is one', function() {
            var spy = sinon.spy();

            webSocket.on('error', spy);
            webSocket.socket.onerror.call(webSocket, error);

            expect(spy.calledWith(error)).to.equal(true);
        });
    });

    describe('when sending a message,', function() {
        var message = {
            username: 'Daryl',
            timestamp: 0,
            text: 'This is a message'
        };
        var send = WebSocket.prototype.send;
        var mockSocket;

        beforeEach(function() {
            mockSocket = {
                socket: {
                    readyState: 1,
                    send: sinon.spy()
                },
                uid: 10
            };
        });

        function expectToError(message) {
            var expectToThrow = function() {
                webSocket.send(message);
            };

            expect(expectToThrow).to.throw(Error);
            logsError();
        }

        it('sends a stringified message to the server, adding socket\'s uid to it', function() {
            var messageToServer = JSON.stringify({
                username: 'Daryl',
                timestamp: 0,
                text: 'This is a message',
                uid: 10
            });

            send.call(mockSocket, message);

            expect(mockSocket.socket.send.calledWith(messageToServer)).to.equal(true);
        });

        it('throws an error if message is not an object', function() {
            expectToError('Bad stuff');
        });

        it('throws an error if socket is not yet open', function() {
            mockSocket.socket.readyState = 0;
            expectToError(message);
        });

        it('throws an error if socket is closing', function() {
            mockSocket.socket.readyState = 2;
            expectToError(message);
        });

        it('throws an error if socket is closed', function() {
            mockSocket.socket.readyState = 3;
            expectToError(message);
        });
    });
});
