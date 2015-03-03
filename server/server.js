/**
 * RTSP Streaming's server.js
 * --------------------------
 *  This script runs a server that fetchs stale images from a ffmpeg
 *  output and sends it with Socket.IO to a client in a volatile-manner.
 *
 *  Requires: Node.js, Socket.IO and FFmpeg, but compiled with libmjpeg 
 *  support and the last version from git-master tree.
 *
 * Created on: December 02, 2011.
 * Copyright © 2011, Jose Luis Rivas. All Rights Reserved.
 **/

/**
 * Variables for Socket.IO and HTTP server
 **/
var	http = require('express').createServer(),
		passport = require('passport'),
		DigestStrategy = require('passport-http').DigestStrategy;
		basedir = __dirname+'/',//__dirname + '/../',
		imgdir = 'img/', // Where JPGs are going to be stored
		io = require('socket.io').listen(http),
		fs = require('fs'),
		path = require('path');
		var count=1;
var exec = require('child_process').exec,
    child;

/**
 * Users for the system
 **/
var users = [
    { username: 'alcaldia', password: 'amalia saez'}
  , { username: 'desur', password: 'cedeno'}
	, { username: 'jorge', password: 'una contrasena muy fuerte'}
	, { username: 'sts', password: 'sin contrasena'}
	, { username: 'amtt', password: 'amtt'}
];

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}


// Use the DigestStrategy within Passport.
//   This strategy requires a `secret`function, which is used to look up the
//   password known to both the client and server.  Also required is a
//   `validate` function, which accepts credentials (in this case, a username
//   and nonce-related options), and invokes a callback with a user object.
passport.use(new DigestStrategy({ qop: 'auth' },
  function(username, done) {
    // Find the user by username.  If there is no user with the given username
    // set the user to `false` to indicate failure.  Otherwise, return the
    // user's password.
    findByUsername(username, function(err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      return done(null, user.password);
    })
  },
  function(username, options, done) {
    // asynchronous validation, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, set the user to `false` to indicate failure.  Otherwise,
      // return the authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        return done(null, user);
      })
    });
  }
));

/**
 * Configuring Express middleware
 **/
http.configure(function() {
	http.use(passport.initialize());
});

// It will listen on port 8081 avoiding other HTTP server on the same IP
http.listen(8081);

/**
 * Configuring Socket.IO
 **/
io.configure('prod', function(){
	io.enable('browser client minification');
	io.enable('browser client etag');
	io.enable('browser client gzip');
  io.set('log level', 1);

  io.set('transports', [
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
  ]);
});

io.configure('dev', function(){
  io.set('transports', ['websocket']);
});

/**
 * Request manager from Express, using authentication with passport-http to send
 * client/index.html
 **/
 //passport.authenticate('digest', { session: false })
http.get('/', function (req, res) {
//console.log(basedir);

	res.sendfile('/client/index.html',{root:basedir});
});
http.get('/iribarren.jpg', function (req, res) {
	res.sendfile('/client/iribarren.jpg',{root:basedir});
});
http.get('/amtt.png', function(req, res) {
	res.sendfile('/client/amtt.png',{root:basedir});
});
http.get('/001.jpg', function(req, res) {
	res.sendfile('/img/001_camaraip.jpg',{root:basedir});
});
http.get('/002.jpg', function(req, res) {
	res.sendfile('/img/002_camaraip.jpg',{root:basedir});
});
http.get('/003.jpg', function(req, res) {
	res.sendfile('/img/003_camaraip.jpg',{root:basedir});
});
http.get('/004.jpg', function(req, res) {
	res.sendfile('/img/004_camaraip.jpg',{root:basedir});
});

/**
 * Declaring inputs and outputs for the cameras
 **/
var inputs = [
	"rtsp://server3.stweb.tv/c5n/live_media",
	"rtsp://server3.stweb.tv/c5n/live_media",
	
	],
	outputs = [
	"001",
	"002",
	
	],
	totalchildren = inputs.length,
	children = new Array(totalchildren),
	loop = undefined,
	frequency=5;

var checker = function() {
	loop = setInterval( function() {
		for (var i = 0; i < totalchildren; i++) {
			if (children[i] == undefined) {
				callFFmpeg( i, inputs[i], outputs[i]);
			}
		};
		count++;
	}, frequency*1000);
}

var	rate = 1,
		suffixout = 'camaraip',
		outextension = 'jpg';

function callFFmpeg (i, input, prefixout,client, callback) {

	/**
	 * Variables for FFmpeg
	 **/
	var util = require('util'),
			exec = require('child_process').exec,
			rate = 4, // Video FPS rate.
			quality = 'qvga', // Quality of the image
			extraparams = '-b:v 32k',
			suffixout = 'camaraip', // Suffix for the JPEG output of FFmpeg
	//		prefixout001 = '001', prefixout002 = '002',
			outextension = 'jpg';

	/**
	 * Call to FFmpeg
	 **/
	 //ffmpeg -i rtsp://server3.stweb.tv/c5n/live_media -ss 00:00:01 -f image2 -vframes 1 thumb.jpg
	 //'ffmpeg -loglevel quiet -i ' + input + ' -r ' + rate + ' -s ' + quality + ' ' + extraparams + ' -f image2 -updatefirst 1 ' + basedir + imgdir + prefixout + '_' + suffixout + '.' + outextension
	 //example data con forma original:
	 //ffmpeg -loglevel quiet -i rtsp://server3.stweb.tv/c5n/live_media  -r 4 -s qvga -b:v 32k -f image2 -updatefirst 1 ../img/001_camaraip.jpg
	console.log("ffmpeg -i "+ input +" -ss 00:00:01 -f image2 -vframes 1 " + basedir + imgdir + prefixout + '_'+count+"_" + suffixout + '.' + outextension, {maxBuffer: 2048*1024});
		  var cmd = "ffmpeg -i "+ input +" -ss 00:00:01 -f image2 -vframes 1 " + basedir + imgdir + prefixout + '_'+count+"_" + suffixout + '.' + outextension
	children[i] = require('child_process').exec(cmd,{maxBuffer: 2048*1024}, function (error, stdout, stderr) {
				if (error !== null) {
					console.error('FFmpeg\'s ' + prefixout + ' exec error: ' + error);
					if(typeof callback == "function"){
						callback(client,basedir + imgdir + prefixout + '_'+count+"_" + suffixout + '.' + outextension);
					}else{
						console.log("not function: "+callback);
					}
				}
		}
		  	
	);
			
		

	
	children[i].on('exit', function (code) {
		console.log('FFmpeg child: ' + inputs[i] + ' exited and is being re-launched');
		children[i] = undefined;
	});
	children[i].on('SIGTERM', function() {
		console.log('FFmpeg child: ' + inputs[i] + ' got terminated and is being re-launched');
		children[i] = undefined;
	});
}


/**
 * Calling checker()
 **/
checker();

/**
 * Calling function `callSocket` to get Socket.IO running
 **/
callSocket('001');
callSocket('002');
callSocket('003');
callSocket('004');

function callSocket (cam) {
	console.log();
io.of('/' + cam).on('connection', function (client) {
	/**
	 * @name imageWatcher
	 * @desc Watchdog for any change on image files
	 * @params complete file path
	 **/
//	var imgcount = 0;
	console.log( basedir + imgdir);
	setInterval( function() {
		for (var i = 0; i < totalchildren; i++) {
			if (children[i] == undefined) {
				callFFmpeg( i, inputs[i], outputs[i],client, function (client,filename){

					if(count>=2){
						fs.readFile( filename,
							function(err, content) {
								if (err) {
									throw err;
								} else {
				
									console.log(content.toString('base64'));
									client.volatile.emit('message', {
										data: content.toString('base64')
									});
								}
							});
						
					}
				});
			}
		};
		count++;
	}, 1000/rate);
});
}

