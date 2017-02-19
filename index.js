var cool = require('cool-ascii-faces');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var mysql = require('mysql');
var bodyParser = require('body-parser')

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var db_config = {

    host: 'us-cdbr-iron-east-04.cleardb.net',
    user: 'bea824782eebcb',
    password: 'c8e130b4',
    database: 'heroku_9cfec1cbd3c0c63'
}

var connection;

function handleDisconnect() {
    connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                    // the old one cannot be reused.

    connection.connect(function (error) {
        if (!!error) {
            console.log(error);
        } else {
            console.log("Connected");
        }

    });

    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

handleDisconnect();

// This responds with "Hello World" on the homepage
    app.get('/', function (req, res) {
        console.log("Got a GET request for the homepage");

        connection.query("Select * from onlab", function (error, rows, fields) {
            if (!!error) {
                console.log('Error in query' + error);
            } else {
                console.log("Success");
                res.json(rows);
            }
        });

    });

// parse application/json
app.use(bodyParser.json())

// This responds a POST request for the homepage
    app.post('/', function (req, res) {
        console.log("Got a POST request for the homepage");
        //res.send('Hello  POST');
        console.log(req.body);
        var post  = {latitude: req.body.latitude, longitude: req.body.longitude ,place: req.body.place};
        connection.query("INSERT INTO onlab SET ?",post,function (error,result) {
            if (!!error) {
                console.log('Error in query' + error);;
            } else {
                console.log("Success");
                console.log(result.insertId);
               // res.json(result.insertId);
            }
        });
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


    app.get('/cool', function (request, response) {
        response.send(cool());
    });

    app.listen(app.get('port'), function () {
        console.log('Node app is running on port', app.get('port'));
    });
