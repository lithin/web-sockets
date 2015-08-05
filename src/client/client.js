var $ = require('./../../bower_components/jquery/dist/jquery.min');
var Socket = require('./socket');

function openSocket($element, username) {
    var $chat = $element.find('.chat');
    var $notification = $element.find('.notification');
    var socket = new Socket();
    var open = false;

    socket.on('open', function() {
        open = true;

        $element.find('.chat form').submit(function() {
            var input = $('input', this);

            socket.send({
                text: input.val(),
                username: username,
                timestamp: Date.now()
            });

            input.val('');

            return false;
        });

        $element.find('.leave').click(function() {
            socket.disconnect();
        });

        $element.find('.connect').addClass('hidden');
        $chat.removeClass('hidden');
    });

    socket.on('response', function() {
        $chat.addClass('hidden');
        $notification.text('Something went wrong with your message. Please try to send it again.').removeClass('hidden');
    });

    socket.on('error', function() {
        $chat.addClass('hidden');
        $notification.text('Something went wrong with the connection. Please come back later.').removeClass('hidden');
    });

    socket.on('message', function(message) {
        var $newElement = $('<li><strong></strong><span></span></li>');
        $newElement.find('strong').text(message.username + ':');
        $newElement.find('span').text(message.text);
        $element.find('.room').append($newElement);
    });

    socket.on('close', function() {
        var text = 'You were disconnected from the server!';

        if (open) {
            $chat.addClass('hidden');
        } else {
            text = 'It seems like the server is down. Sorry!';
        }

        $notification.text(text).removeClass('hidden');
    });
}

$('.client').each(function() {
    var $client = $(this);
    $client.find('.connect form').on('submit', function() {
        openSocket($client, $('input', this).val());

        return false;
    });
});
