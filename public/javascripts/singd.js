/* Simple isometric game concept demo using Node.js and socket.IO
 * Author: William Dias - twitter.com/diaswrd
 * Sprite credits: Reiner Prokein - http://reinerstilesets.de
 * This code is shared to help beginners in javascript and node.js server-side technology.
 * Feel free to use, edit and improve this code.
*/ 

//Class definitions
function Hud(options) {
	/*	 Hud Options:
		.container => Selector of the div where the Hud will be appended.
    */
	var defaultOpt = {
		container: "body",
	}
	
	this.options = $.extend({}, defaultOpt, options);
	this.container = $(this.options.container);
	this.init();
}

Hud.prototype = {
	init: function() {
		obj = this;
		
		obj.container.append("<div id='container-chat'>" +
								"<ul class='chat-tabs'>" +
									"<li>chat</li>" +
								"</ul>" +
								"<span class='bgr-mask'><!-- --></span>" +
								"<div id='chat-log'></div>" +
							 	"<input id='chat-input' type='text' placeholder='type a message to your friends...' />" +
							 "</div>");
		$('#container-chat').css({
			'width': window.innerWidth/3,
			'position':'absolute',
			'left': 5,
			'bottom': 5,
		});
		
		$("#chat-input").keyup(function(event) {
			if (event.keyCode == 13) {
				if ($("#chat-input").val().length > 0) {
					socket.send({
						chat_message: $("#chat-input").val()
					});
					obj.sendMsg($("#chat-input").val(), player.options.id, player.options.name);
					$("#chat-input").val('');
				}
			}
                        event.stopPropagation();
		});
	},
	sendMsg: function(message, player_id, player_name) {
		var obj = $("#pl-" + player_id);
		var	ballonLeft = 0;
		
		obj.find(".player-balloon p").text(player_name + ': ' + message);
		
		// trying to fix some break-line problems.
		obj.find(".player-balloon").css({'width': 180});
		
		if (obj.find(".player-balloon").is(':hidden')) {
			obj.find(".player-balloon").show();
			hideBallon = setTimeout(function() {
				obj.find(".player-balloon").fadeOut('fast');
			}, 5000);
		} else {
			clearTimeout(hideBallon);
			hideBallon = setTimeout(function() {
				obj.find(".player-balloon").fadeOut('fast');
			}, 5000);
		}
		
		if (obj.find(".player-balloon p").width() > obj.find('.player').width()) {
			ballonLeft = (obj.find('.player').width() - obj.find(".player-balloon p").width() - 6) / 2;
		}
		else if (obj.find(".player-balloon p").width() < obj.find('.player').width()) {
			ballonLeft = (obj.find('.player').width() - obj.find(".player-balloon p").width() - 12) / 2;
		}
		
		obj.find(".player-balloon").css({
			'width': obj.find(".player-balloon p").width() + 10,
			'height': obj.find(".player-balloon p").height() + 10,
			'left': Math.ceil(ballonLeft)
		});
		
		$("#chat-log").append('<p>'+ player_name +': '+ message +'</p>');
		$("#chat-log").scrollTop(9999);
	}
};

function Ground(options) {
	/*	 Ground Constructor Options:
		.container => Selector of the div where the ground tiles will be drawned.
		.size => The size of the ground in number of tiles. If pass 30, a 30x30 ground will be drawn.
    */
    var defaultOpt = {
		container: "body",
		size: 10
	}
    
    this.options = $.extend({}, defaultOpt, options);
	this.container = $(this.options.container);
	this.groundSize = this.options.size;
	this.groundMap = new Array();
	
	this.init();
}

Ground.prototype = {
	init: function() {
		var initial_x = ground_x = (30 * this.groundSize) - 30;
		var	initial_y = ground_y = 0;
		var	obj = this;
		var	hover = null;
        
		this.container.css({
			'top': Math.ceil(window.innerHeight/2) - (obj.groundSize * 15),
			'left': Math.ceil(window.innerWidth/2) - (obj.groundSize * 30)
		});
		
		for (i = 0; i < obj.groundSize; i++) {
			obj.groundMap[i] = new Array();
			for (j = 0; j < obj.groundSize; j++) {
				obj.groundMap[i][j] = {
					id: 'ground-'+ i +'-'+ j,
					x: ground_x,
					y: ground_y
				};
				obj.container.append('<span id="ground-'+ i +'-'+ j +'" class="ground" style="left:'+ ground_x +'px; top:'+ ground_y +'px; z-index:1;"><!-- --></span>');
				ground_x += 30;
				ground_y += 15;
			}
			initial_x -= 30;
			initial_y += 15;
			ground_x = initial_x;
			ground_y = initial_y;
		}
		
		window.onresize = function() {
			if (player && !obj.container.is(':animated')) {
				res_x = Math.ceil(window.innerWidth/2);
				res_y = Math.ceil(window.innerHeight/2);
				if (res_x >= 240 && res_y >= 180) {
					obj.container.css({
						'top': res_y - (obj.groundSize * 15),
						'left': res_x - (obj.groundSize * 30)
					});
					
					groundSize = Math.ceil(obj.groundSize/2) - 1;
					groundId = '#ground-'+ groundSize +'-'+ groundSize;
					centerPlayerLeft = parseInt($(groundId).css('left')) - parseInt(player.actualGround.css('left'));
					centerPlayerTop = parseInt($(groundId).css('top')) - parseInt(player.actualGround.css('top'));
					
					obj.container.css({
						'top': parseInt(obj.container.css('top')) + centerPlayerTop,
						'left': parseInt(obj.container.css('left')) + centerPlayerLeft + player.options.width/2
					});
					
					if ($.browser.webkit || $.browser.msie) {
						playerLeft = Math.round(player.actualGround.offset().left) + player.options.width/2 - 1;
					} else {
						playerLeft = Math.round(player.actualGround.offset().left);
					}
					$("#pl-" + player.options.id).css({
						top: Math.ceil(player.actualGround.offset().top) - player.options.height/2,
						left: playerLeft
					});
					
					$('#container-chat').css({
						'width': window.innerWidth/3
					});
				}
			}
        };
	}
};

function Player(options) {
	/*	 Player Constructor Options:
		.container => Selector of the div where the player tile will be drawned.
		.width => Width of the player.
		.height => Height of the player.
		.sprite => Url of sprite image.
		.coords => The id of the actual ".ground" tile he is, get from database.
		.orientation => The actual orientation of the player (so,no,sw,nw,se,ne,we,ea), get from db.
	*/
	var defaultOpt = {
		container: "body",
		width: 32,
		height: 33,
		sprite: "images/default_char.png",
		coords: "#ground-0-0",
		orientation: "so"
	}
	
	this.options = $.extend({}, defaultOpt, options);
	this.id = this.options.id;
	this.container = $(this.options.container);
	this.actualGround = $(this.options.coords);
	
	this.sprite_coords = {
		"so": {x:"0px" , y:"0px"},
		"we": {x:"0px" , y:"-34px"},
		"no": {x:"0px" , y:"-67px"},
		"sw": {x:"0px" , y:"-100px"},
		"nw": {x:"0px" , y:"-133px"}
	};
	
	this.init();
}

Player.prototype = {
	init: function () {
	    var obj = this;
		var playerSel = null;
		var orient = null;
		var	playerTop = 0;
        var playerLeft = 0;
        var groundSize = 0;
	    
	    obj.container.append("<div id='pl-"+ obj.id +"' class='player-box'>" +
								"<div class='player-balloon'>" +
									"<span class='bgr-mask'><!-- --></span>" +
									"<p></p>" +
								"</div>" +
								"<span class='player standing'><!-- --></span>" +
							"</div>");
		
		playerSel = "#pl-" + obj.id;
		
		groundSize = Math.ceil(game_ground.groundSize/2) - 1;
		groundId = '#ground-'+ groundSize +'-'+ groundSize;
		centerPlayerLeft = parseInt($(groundId).css('left')) - parseInt(obj.actualGround.css('left'));
		centerPlayerTop = parseInt($(groundId).css('top')) - parseInt(obj.actualGround.css('top'));
        
        obj.actualGround.addClass("gr-" + obj.id);
        
        if (obj.options.container == "body") {
			game_ground.container.css({
				'top': parseInt(game_ground.container.css('top')) + centerPlayerTop,
				'left': parseInt(game_ground.container.css('left')) + centerPlayerLeft + obj.options.width/2
			});
			
			$(".ground").bind('click', function() {
				if (!game_ground.container.is(':animated')) {
					$(".gr-" + obj.id).removeClass("gr-" + obj.id);
					$(this).addClass("gr-" + obj.id);
					obj.walk(obj.id,"#" + $(this).attr("id"));
				}
			});

                        // hack to support keyboard movement
                        // it's probably a lot easier to keep track of the x,y position of the player
                        // and then build the actualGround from that. but this is a quick hack.
                        // when we get a keycode, we check to see if it's an arrow key.
                        // if it is, we extract the current position from the actualGround.selector
                        // then we calculate the next position, if it's a new position, we call obj.walk()
                    
                        var convertSelectorToPoint = function ( selector ) {
                            var rv = [];
                            rv.push( selector.substr(8,1) );
                            rv.push( selector.substr(10,1) );
                            return( rv );
                        };

                        $("body").keyup( function( e ) {
                                var p = convertSelectorToPoint( obj.actualGround.selector );
                                var x =  + p[0];
                                var y =  + p[1];
                                switch( e.keyCode ) {
                                case 36:
                                    y = y - 1;
                                    break;
                                case 38:
                                    x = x - 1;
                                    y = y - 1;
                                    break;
                                case 33:
                                    x = x -1;
                                    break;
                                case 37:
                                    x = x + 1;
                                    y = y - 1;
                                    break;
                                case 39:
                                    x = x - 1;
                                    y = y + 1;
                                    break;
                                case 35:
                                    x = x + 1;
                                    break;
                                case 40:
                                    x = x + 1;
                                    y = y + 1;
                                    break;
                                case 34:
                                    y = y + 1;
                                    break;
                                }
                                if( x > 9 ) { x = 9; }
                                if( x < 0 ) { x = 0; }
                                if( y > 9 ) { y = 9; }
                                if( y < 0 ) { y = 0; }
                                var newSelector = '#ground-' + x + '-' + y;
                                if( newSelector != obj.actualGround.selector ) {
                                    obj.walk(obj.id, newSelector);
                                }
                            });
			
			playerTop = Math.ceil(obj.actualGround.offset().top) - obj.options.height/2;
			
			if ($.browser.webkit  || $.browser.msie) {
				playerLeft = Math.round(obj.actualGround.offset().left) + obj.options.width/2 - 1;
			} else {
				playerLeft = Math.round(obj.actualGround.offset().left);
			}
			
		} else {
			playerTop = parseInt(obj.actualGround.css('top')) - obj.options.height/2;
			playerLeft = parseInt(obj.actualGround.css('left'));
		}
        
		$(playerSel).css({
			'top': playerTop,
			'left': playerLeft
		});
		
		orient = h.getOrientation(obj.options.orientation);
		
		$(playerSel).find('.player').css({
			'width': obj.options.width,
			'height': obj.options.height,
			'position': 'absolute',
			'background': 'url('+ obj.options.sprite +') no-repeat',
			'background-position': (obj.options.width + parseInt(obj.sprite_coords[orient].x)) * - 1 + "px " + obj.sprite_coords[orient].y
		});
		
		if (isFlip) {
			$(playerSel).find('.player').addClass('flip-horizontal');
		}
	},
	
	walk: function (player_id, ground_sel) {
		var this_player = null;
		var	speed = null;
		var difference_y = 0;
		var difference_x = 0;
		var	k_speed = 10;
		
		if (player_id == player.id) {
			this_player = player;
		} else {
			for (i = 0; i < other_players.length; i++) {
				if (other_players[i].id == player_id) {
					this_player = other_players[i];
				}
			}
		}
		
		difference_y = parseInt($(ground_sel).css('top')) - parseInt(this_player.actualGround.css('top'));
		difference_x = parseInt($(ground_sel).css('left')) - parseInt(this_player.actualGround.css('left'));
		
		speed = Math.ceil(Math.sqrt(Math.pow(Math.abs(difference_x)/2, 2) + Math.pow(Math.abs(difference_y), 2)) * k_speed);
		
		if (difference_y >= 15) {
			//south, southwest, southeast
			if (difference_x >= 30) {
                this_player.orientation = "se";
			} else if (difference_x <= -30) {
	            this_player.orientation = "sw";
			} else {
	            this_player.orientation = "so";
			}
		} else if (difference_y <= -15) {
			//north, northwest, northeast
			if (difference_x >= 30) {
                this_player.orientation = "ne";
			} else if (difference_x <= -30) {
                this_player.orientation = "nw";
			} else {
                this_player.orientation = "no";
			}
		} else {
			//west, east
			if (difference_x < 0) {
                this_player.orientation = "we";
            } else {                                                                                                       
                this_player.orientation = "ea";
			}
		}
		
		if (player.id == this_player.id) {
			this.moveGround(difference_x, difference_y, speed);
			socket.send({
				player_move: {
					actualGround: "#" + $(ground_sel).attr("id"),
					orientation: this_player.orientation
				}
			});
		} else {
			this.moveAnotherPlayer(this_player.id, difference_x, difference_y, speed);
		}
		this_player.actualGround = $(ground_sel);
		this.walkAnimation(this_player, 0);
	},
	
	walkAnimation: function (this_player, i, ground_sel) {
		var obj = this_player;
		var	player_obj = $("#pl-" + obj.id);
		var	orient = null;
		var sprite_coords = obj.sprite_coords;
		
		orient = h.getOrientation(obj.orientation);
		
		if (game_ground.container.is(':animated') || player_obj.is(':animated')) {
            if (player_obj.find(".player").is(".standing")){
                player_obj.find(".player").removeClass().addClass("player");
            }
      
            if (!isFlip) {
				if(player_obj.find(".player").is(".flip-horizontal")) {
					player_obj.find(".player").removeClass("flip-horizontal");
				}
            } else {
                player_obj.find(".player").addClass("flip-horizontal");
            }
            
            if (i >= 6) {
				i = 0;
			}
			player_obj.find(".player").css({
				'background-position': (obj.options.width * i + parseInt(sprite_coords[orient].x)) * -1 + "px " + sprite_coords[orient].y
			});
            
            setTimeout(function() {
				obj.walkAnimation(obj, i+1);
			}, 120);
		} else {
			if (!isFlip) {
				player_obj.find(".player").removeClass().addClass("player standing");
				
			} else {
				player_obj.find(".player").removeClass().addClass("player standing flip-horizontal");
			}
			player_obj.find(".player").css({
				'background-position': (obj.options.width + parseInt(sprite_coords[orient].x)) * - 1 + "px " + sprite_coords[orient].y
			});
		}
	},
	
	moveGround: function(difference_x, difference_y, speed) {
		game_ground.container.animate({
			"top": (parseInt(game_ground.container.css('top')) - difference_y) + 'px', 
			"left": (parseInt(game_ground.container.css('left')) - difference_x) + 'px'}, 
			speed, 
			"linear"
		);
	},
	
	moveAnotherPlayer: function(player_id, difference_x, difference_y, speed) {
		var player_obj = $("#pl-" + player_id);
		player_obj.animate({
			"top":"+=" + difference_y,
			"left":"+=" +  difference_x},
			speed,
			"linear"
		);
	}
};

function Helper() {
	this.init();
}
Helper.prototype = {
	init: function() {},
	
	getOrientation: function(orientation) {
		isFlip = true;
		switch (orientation) {
			case "ea":
				return "we";
				break;
			case "se":
				return "sw";
				break;
			case "ne":
				return "nw";
				break;
			default:
				isFlip = false;
				return orientation;
				break;
		}
	}
};
var h = new Helper();
