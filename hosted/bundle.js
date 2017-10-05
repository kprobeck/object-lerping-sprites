"use strict";

var canvas = void 0;
var ctx = void 0;
var walkImage = void 0;
//our websocket connection
var socket = void 0;
var hash = void 0;

var squares = {};

var update = function update(data) {
	if (!squares[data.hash]) {
		squares[data.hash] = data;
		return;
	}

	//if we were using io.sockets.in or socket.emit
	//to forcefully move this user back because of
	//collision, error, invalid data, etc
	/**
 if(data.hash === hash) {
 //force update user somehow
 return;
 } **/

	if (squares[data.hash].lastUpdate >= data.lastUpdate) {
		return;
	}

	var square = squares[data.hash];
	square.lastUpdate = data.lastUpdate;
	square.prevX = data.prevX;
	square.prevY = data.prevY;
	square.destX = data.destX;
	square.destY = data.destY;
	square.alpha = 0;
};

var removeUser = function removeUser(hash) {
	if (squares[hash]) {
		delete squares[hash];
	}
};

var setUser = function setUser(data) {
	hash = data.hash;
	squares[hash] = data;
	requestAnimationFrame(redraw);
};

var lerp = function lerp(v0, v1, alpha) {
	return (1 - alpha) * v0 + alpha * v1;
};

var updatePosition = function updatePosition() {
	var square = squares[hash];

	square.prevX = square.x;
	square.prevY = square.y;

	if (square.moveUp && square.destY > 0) {
		square.destY -= 2;
	}
	if (square.moveDown && square.destY < 400) {
		square.destY += 2;
	}
	if (square.moveLeft && square.destX > 0) {
		square.destX -= 2;
	}
	if (square.moveRight && square.destX < 400) {
		square.destX += 2;
	}

	square.alpha = 0;

	//moved to sendWithLag to simulate lag
	//socket.emit('movementUpdate', square);
};

var redraw = function redraw(time) {
	updatePosition();

	ctx.clearRect(0, 0, 500, 500);

	var keys = Object.keys(squares);

	for (var i = 0; i < keys.length; i++) {

		var square = squares[keys[i]];

		//if alpha less than 1, increase it by 0.05
		if (square.alpha < 1) square.alpha += 0.05;

		if (square.hash === hash) {
			ctx.fillStyle = 'blue';
		} else {
			ctx.fillStyle = 'black';
		}

		square.x = lerp(square.prevX, square.destX, square.alpha);
		square.y = lerp(square.prevY, square.destY, square.alpha);

		ctx.fillRect(square.x, square.y, square.width, square.height);
	}

	requestAnimationFrame(redraw);
};

var keyDownHandler = function keyDownHandler(e) {
	var keyPressed = e.which;
	var square = squares[hash];

	// W OR UP
	if (keyPressed === 87 || keyPressed === 38) {
		square.moveUp = true;
	}
	// A OR LEFT
	else if (keyPressed === 65 || keyPressed === 37) {
			square.moveLeft = true;
		}
		// S OR DOWN
		else if (keyPressed === 83 || keyPressed === 40) {
				square.moveDown = true;
			}
			// D OR RIGHT
			else if (keyPressed === 68 || keyPressed === 39) {
					square.moveRight = true;
				}

	//if one of these keys is down, let's cancel the browsers
	//default action so the page doesn't try to scroll on the user
	if (square.moveUp || square.moveDown || square.moveLeft || square.moveRight) {
		e.preventDefault();
	}
};

var keyUpHandler = function keyUpHandler(e) {
	var keyPressed = e.which;
	var square = squares[hash];

	// W OR UP
	if (keyPressed === 87 || keyPressed === 38) {
		square.moveUp = false;
	}
	// A OR LEFT
	else if (keyPressed === 65 || keyPressed === 37) {
			square.moveLeft = false;
		}
		// S OR DOWN
		else if (keyPressed === 83 || keyPressed === 40) {
				square.moveDown = false;
			}
			// D OR RIGHT
			else if (keyPressed === 68 || keyPressed === 39) {
					square.moveRight = false;
				}
};

var sendWithLag = function sendWithLag() {
	socket.emit('movementUpdate', squares[hash]);
};

var init = function init() {
	walkImage = document.querySelector('#walk');
	canvas = document.querySelector('#canvas');
	ctx = canvas.getContext('2d');

	socket = io.connect();

	socket.on('connect', function () {
		setInterval(sendWithLag, 100);
	});

	socket.on('joined', setUser);

	socket.on('updatedMovement', update);

	socket.on('left', removeUser);

	document.body.addEventListener('keydown', keyDownHandler);
	document.body.addEventListener('keyup', keyUpHandler);
};

window.onload = init;
