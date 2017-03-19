var cool = require('cool-ascii-faces');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var mysql = require('mysql');
var bodyParser = require('body-parser');
var passport = require('passport');
var FacebookTokenStrategy = require('passport-facebook-token');
var LocalStrategy = require('passport-local').Strategy;
fbsdk = require('facebook-sdk');
var jwt = require('jwt-simple');
var GoogleTokenStrategy = require('passport-google-id-token');
var BearerStrategy = require('passport-http-bearer');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
// parse application/json
app.use(bodyParser.json())


// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var db_config = {

    host: 'us-cdbr-iron-east-04.cleardb.net',
    user: 'bea824782eebcb',
    password: 'c8e130b4',
    database: 'heroku_9cfec1cbd3c0c63'
};

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

    connection.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}
FACEBOOK_APP_ID = '1675013179474840';
FACEBOOK_APP_SECRET = '0ca2793a038eba262f9768a83292a100';


app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use('facebook-token', new FacebookTokenStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET
}, function (accessToken, refreshToken, profile, done) {
    console.log("facebook-token");
    var user = profile._json;
    connection.query("Select id from login where mail=?", user.email, function (error, rows, fields) {
        if (!!error) {
            console.log('Error in query' + error);
        } else {
            if (rows.length === 0) {
                console.log("Rows" + rows.length + " " + user.email);
                console.log("There is no such user, adding now");
                var post = {name: user.name, mail: user.email, token: accessToken};
                connection.query("INSERT into login SET ?", post, function (error, result) {
                    if (!!error) {
                        console.log('Error in query' + error);
                    } else {
                        console.log("Success");
                        console.log(result.insertId);
                        user.id = result.insertId;
                    }
                });
            }
            else {
                connection.query("UPDATE LOGIN SET token=22 where id=?", rows[0].id, function (error, result) {
                    console.log("User already exists in database");
                });
            }
        }
    });
    return done(null, user);
}));


app.post('/auth/facebook/token',
    passport.authenticate('facebook-token'),
    function (req, res) {
        // do something with req.user
        var user = req.user;
        console.log(user);
        //  res.send(req.user ? 200 : 401)
        var post = {id: user.id, name: user.name, mail: user.email};
        res.json(post);
    }
);


var GOOGLE_CLIENT_ID = "179156263831-1ft0siuvco0s1nadaj307fcsui3kgsj6.apps.googleusercontent.com";


passport.use('google-id-token', new GoogleTokenStrategy({
        clientID: GOOGLE_CLIENT_ID
    },
    function (parsedToken, googleId, done) {
        return done(null, parsedToken);
    }
));

app.post('/auth/google',
    passport.authenticate('google-id-token'),
    function (req, res) {
        // do something with req.user
        console.log("google-id-token");
        console.log(req);
        // res.send(req.user? 200 : 401);
    }
);

handleDisconnect();

//var secret = Buffer.from('fe1a1915a379f3be5394b64d14794932', 'hex');
var secret = 'fe1a1915a379f3be5394b64d14794932';


passport.use('local', new LocalStrategy(
    function (username, password, done) {
        console.log("local");
        return done(null, username);

    }
));

app.get('/login',
    function (req, res) {
        console.log("fail");
    });

app.post('/login',
    passport.authenticate('local', {failureRedirect: '/login'}),
    function (req, res) {
        //res.redirect('/');
        var payload = {foo: res.username};
        var token = jwt.encode(payload, secret);
        console.log(token);
        res.json(token);
    });


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

app.get('/get', function (req, res) {
    console.log("Got a GET request for the homepage");
    passport.authenticate('bearer', {session: false}),
        function (req, res) {
            console.log("id: " + req.user.id);
            connection.query("SELECT o.id, o.latitude, o.longitude, o.place FROM onlab o inner join login l on l.id=ownerid where l.id=?", req.user.id, function (error, rows, fields) {
                if (!!error) {
                    console.log('Error in query' + error);
                } else {
                    console.log("Success");
                    res.json(rows);
                }
            });
            res.json(req.user);
        }

});

passport.use('bearer', new BearerStrategy(
    function (token, done) {
        connection.query("SELECT * FROM login l where l.token=?", token, function (err, user) {
            if (!!error) {
                console.log('Error in query' + error);
            } else {
                return done(null, user);
            }
        });
    }
));


// This responds a POST request for the homepage
app.post('/', function (req, res) {
    console.log("Got a POST request for the homepage");
    //res.send('Hello  POST');
    console.log(req.body);
    var post = {id: req.body.id, latitude: req.body.latitude, longitude: req.body.longitude, place: req.body.place};
    connection.query("INSERT INTO onlab SET ?", post, function (error, result) {
        if (!!error) {
            console.log('Error in query' + error);
        } else {
            console.log("Success");
            console.log(result.insertId);
            res.json(result.insertId);
        }
    });
});


app.get('/cool', function (request, response) {
    response.send(cool());
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
