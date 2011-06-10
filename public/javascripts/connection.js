/* Simple isometric game concept demo using Node.js and socket.IO
 * Author: William Dias - twitter.com/diaswrd
 * Sprite credits: Reiner Prokein - http://reinerstilesets.de
 * This code is shared to help beginners in javascript and node.js server-side technology.
 * Feel free to use, edit and improve this code.
*/

var socket = null;
var default_hud = null;
var	game_ground = null;
var	player = null;
var	name = "";
var other_players = new Array();

//Socket messages handle
var actionReceivers = {
	'buffer': function(data) {
		player = new Player({
			id: data.your_id,
			name: name,
			container: "body", 
			width: 32,
			height: 33,
			sprite: "images/default_char.png",
			coords: "#ground-1-1"
		});
		
		default_hud = new Hud({
			container: "body"
		});
		
		for (i = 0; i < data.other_players.length; i++) {
			other_players[i] = new Player({
				id: data.other_players[i].player_id,
				name: data.other_players[i].player_name,
				container: "#container",
				width: 32,
				height: 33,
				sprite: "images/default_char.png",
				coords: data.other_players[i].actualGround,
				orientation: data.other_players[i].orientation,
			});
		}
	},
	'player_move': function(data) {
		for (i = 0; i < other_players.length; i++) {
			if (other_players[i].id == data.player_id) {
				$(".gr-" + other_players[i].id).removeClass("gr-" + other_players[i].id);
				$(data.actualGround).addClass("gr-" + other_players[i].id);
				other_players[i].walk(other_players[i].id,data.actualGround);
			}
		}
	},
	'new_player': function(data) {
		var new_player = new Player({
			id: data.player_id,
			name: data.player_name,
			container: "#container", 
			width: 32,
			height: 33,
			sprite: "images/default_char.png",
			coords: data.actualGround
		});
		other_players.push(new_player);
	},
	'chat': function(data) {
		default_hud.sendMsg(data.message, data.player_id, data.player_name);
	},
	'player_leave': function(data) {
		$("#pl-" + data).remove();
		for (i = 0; i < other_players.length; i++) {
			if (data == other_players[i].id) {
				other_players.splice(i, 1);
			}
		}
	}
};

//Socket.IO client-side connections 
$(document).ready(function (){ 
	socket = new io.Socket(null, {port: 8080});
	socket.connect();
	socket.on('connect', function(client){			
		game_ground = new Ground({
			container: "#container",
			size: 10
		});			
		name = prompt("Please, enter your character name","");
		if (name == '' || name == 'null' || name == null){
			name = 'Unknown';
		}
		socket.send({
			player_name: name
		});
	}); 
	socket.on('message', function(obj) {
		for (action in obj) {
			if (action in actionReceivers) {
				actionReceivers[action](obj[action]);
			}
		}
	}); 
	socket.on('disconnect', function(){ window.location.reload(); });
});
