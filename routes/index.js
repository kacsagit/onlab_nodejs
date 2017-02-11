var express = require('express');
var app = express();
var server  = require('http').createServer(app);
var mysql = require('mysql');
var io = require('socket.io').listen(server);

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sampleDB'
});

connection.connect(function(error) {
    if (!!error) {
        console.log(error);
    } else {
        console.log("Connected");
    }

});

// This responds with "Hello World" on the homepage
app.get('/', function (req, res) {
    console.log("Got a GET request for the homepage");

    //res.send('get');
    connection.query("Select * from mySampleTable", function (error, rows, fields) {
        if (!!error) {
            console.log('Error in query'+error);
        } else {
            console.log("Success");
            console.log(rows[0].Name);
            res.json(rows);
        }
    });

});

// This responds a POST request for the homepage
app.post('/', function (req, res) {
    console.log("Got a POST request for the homepage");
    res.send('Hello POST');
});

// This responds a DELETE request for the /del_user page.
app.delete('/del_user', function (req, res) {
    console.log("Got a DELETE request for /del_user");
    res.send('Hello DELETE');
});

// This responds a GET request for the /list_user page.
app.get('/list_user', function (req, res) {
    console.log("Got a GET request for /list_user");
    res.send('Page Listing');
});

// This responds a GET request for abcd, abxcd, ab123cd, and so on
app.get('/ab*cd', function (req, res) {
    console.log("Got a GET request for /ab*cd");
    res.send('Page Pattern Match');
});

var server = server.listen(8081, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)
});



io.on('connection',function(socket){
    console.log("A user is connected");
});


module.exports = express.Router();
