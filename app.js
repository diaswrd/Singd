/* Simple isometric game concept demo using Node.js and socket.IO
 * Author: William Dias - twitter.com/diaswrd
 * This code is shared to help beginners in javascript and node.js server-side technology.
 * Feel free to use, edit and improve this code.
 * And sorry for don't wrote tests, I'm still learning about node unit tests.
*/

/* Module dependencies. */
var express = require('express'),
	io = require('socket.io');

/* Helpers */
var buffer = new Array(); //Users buffer.

/* Create server */
var app = module.exports = express.createServer();

app.register('.html', require('ejs'));

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', function(req, res){
  res.render('index', {
    title: 'Simple Isometric Node Game Demo'
  });
});
app.listen(8080);
console.log("Express server listening on port %d", app.address().port);  
  
// Socket.IO 
var socket = io.listen(app); 
socket.on('connection', function(client) {
	client.send({ 
		buffer: {
			your_id: client.sessionId,
			other_players: buffer
		} 
	});
	client.on('message', function(message) {
	  if ('player_name' in message) {
		  var player_obj = {
				player_id: client.sessionId,
				player_name: message.player_name,
				actualGround: "#ground-1-1",
				orientation: "so"
		  };
		  client.player_name = message.player_name;
		  client.broadcast({ 
			new_player: player_obj
		  });
		  buffer.push(player_obj);
	  } else if ('player_move' in message) {
		  client.broadcast({
			  player_move: { 
				player_id: client.sessionId, 
				actualGround: message.player_move.actualGround
			  } 
		  });
		  for (i = 0; i < buffer.length; i++) {
			  if (buffer[i].player_id == client.sessionId) {
				  buffer[i].actualGround = message.player_move.actualGround;
				  buffer[i].orientation = message.player_move.orientation;
			  }
		  }
	  } else if ('chat_message' in message) {
		client.broadcast({
			chat: {
				player_id: client.sessionId,
				player_name: client.player_name, 
				message: message.chat_message
			}
		});
	  }
	});
	client.on('disconnect', function() {
		for (i = 0; i < buffer.length; i++) {
			if (buffer[i].player_id == client.sessionId) {
				buffer.splice(i, 1);
		    }
		}
		client.broadcast({
			player_leave: client.sessionId
		});
	}); 
});
