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
	socket.on('message', function(obj){
		if ('buffer' in obj) {
			player = new Player({
				id: obj.buffer.your_id,
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
			
			for (i = 0; i < obj.buffer.other_players.length; i++) {
				other_players[i] = new Player({
					id: obj.buffer.other_players[i].player_id,
					name: obj.buffer.other_players[i].player_name,
					container: "#container",
					width: 32,
					height: 33,
					sprite: "images/default_char.png",
					coords: obj.buffer.other_players[i].actualGround,
					orientation: obj.buffer.other_players[i].orientation,
				});
			}
		} else if ('player_move' in obj) {
			for (i = 0; i < other_players.length; i++) {
				if (other_players[i].id == obj.player_move.player_id) {
					$(".gr-" + other_players[i].id).removeClass("gr-" + other_players[i].id);
					$(obj.player_move.actualGround).addClass("gr-" + other_players[i].id);
					other_players[i].walk(other_players[i].id,obj.player_move.actualGround);
				}
			}
		} else if ('new_player' in obj) {
			var new_player = new Player({
				id: obj.new_player.player_id,
				name: obj.new_player.player_name,
				container: "#container", 
				width: 32,
				height: 33,
				sprite: "images/default_char.png",
				coords: obj.new_player.actualGround
			});
			other_players.push(new_player);
		} else if ('chat' in obj) {
			default_hud.sendMsg(obj.chat.message, obj.chat.player_id, obj.chat.player_name);
		} else if ('player_leave' in obj) {
			$("#pl-" + obj.player_leave).remove();
		}
	}); 
	socket.on('disconnect', function(){ window.location.reload(); });
});
