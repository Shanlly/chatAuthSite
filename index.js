
// required modules 
var bodyParser = require('body-parser');
var express = require("express");
var expressSession = require('express-session');
var mongodb = require('mongodb');

//variables needed
var app = express();
var db;

//use body-parser, req.body to each POST request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended:true
}));

// use Sessions, req.session to every request
app.use(expressSession({
	secret:"El Mook",
	resave: false,
	saveUninitialized: true
}));

//connecting to database and start server
mongodb.MongoClient.connect('mongodb://localhost', function(err, database){
	if(err){
		console.log(err);
		return;
	}
	console.log("Connected to Database!🗄");
	db = database;
	startListening();
});


// Get all chats
app.get('/api/chats', function(req, res) {
// Check if logged in
	if (!req.session.user) {
		res.status(403);
		res.send("forbidden");
		return;
	}
// return all chats as a JSON array.
	db.collection('chats').find({}).toArray(function(err, data){
		if (err) {
			console.log(err);
			res.status(500);
			res.send("error");
			return;
		}
		res.send(data);
	});
});

// Post a new chat
app.post('/api/newChat', function(req, res) {
	if (!req.session.user) {
		res.status(403);
		res.send("forbidden");
		return;
	}

// Add new chat
	db.collection('chats').insertOne({
		content: req.body.content,
		submitter: req.session.user._id
	}, function(err, data) {
		if (err) {
			console.log(err);
			res.status(500);
			res.send('Error inserting new chat');
			return;
		}
		res.send(data);
	});
});


// Post to login
app.post('/api/login', function(req, res) {
// see if user with the given username, password exists
	db.collection('users').findOne({
		username: req.body.username,
		password: req.body.password
	}, function(err, data) {
		if (data === null) {
			res.send("error");
			return;
		}
// associate this cookie (session) with this user (object)
		req.session.user = {
			_id : data._id,
			username: data.username
		};
		res.send("success");
	});
});


// Register a new user
app.post('/api/register', function(req, res) {
	db.collection('users').insertOne({
		username: req.body.username,
		password: req.body.password 
	}, function(err, data) {
		if (err) {
			console.log(err);
			res.status(500);
			res.send('Error inserting new user');
			return;
		}
		res.send(data);
	});
});

// serve files out of the static public folder 
app.use(express.static('public'));

// 404 Error handler
app.use(function(req, res, next) {
	res.status(404);
	res.send("File Not Found!💾");
});

// 500 Error handler
app.use(function(err, req, res, next) {
	console.log(err);
	res.status(500);
	res.send("Internal Server Error!🗃");
	res.send(err);
});

// start listening (but only after we've connected to the db!)
function startListening() {
	app.listen(8080, function() {
		console.log("📞http://localhost:8080");
	});
}
