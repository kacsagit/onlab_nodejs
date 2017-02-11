var express = require('express');
var mysql = require('mysql');
var app = express();

var connection = mysql.createConnection({
    host: 'mysql145067-onlab.j.layershift.co.uk',
    user: 'root',
    password: 'LEAdig82463',
    database: 'sampleDB'
});

connection.connect(function(error) {
    if (!!error) {
        console.log('Error');
    } else {
        console.log("Connected");
    }

});

// This responds with "Hello World" on the homepage
app.get('/', function (req, res) {
    console.log("Got a GET request for the homepage");

    connection.query("Select * from mySampleTable", function (error, rows, fields) {
        if (!!error) {
            console.log('Error in query');
        } else {
            console.log("Success");
            console.log(rows[0].Name)
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

var server = app.listen(8081, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
});

module.exports = express.Router();
