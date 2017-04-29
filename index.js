var cool = require('cool-ascii-faces');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var mysql = require('mysql');
var bodyParser = require('body-parser');
var passport = require('passport');
var FacebookTokenStrategy = require('passport-facebook-token');
var LocalStrategy = require('passport-local').Strategy;
var fbsdk = require('facebook-sdk');
// var jwt = require('jwt-simple');
var GoogleTokenStrategy = require('passport-google-id-token');
var http = require("http");
var BearerStrategy = require('passport-http-bearer').Strategy;
var url = require('url');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var authenticate = expressJwt({secret: 'shhhhhhared-secret'});
var apiRoutes = express.Router();
var request = require('request');
var util = require('util');
var multer = require('multer')
var upload = multer({dest: 'uploads/'})
var path = require('path')
var crypto = require('crypto')
var Jimp = require("jimp");


app.use(require('morgan')('combined'));

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true, keepExtensions: true, uploadDir: __dirname + '/public/uploads'}));


// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('superSecret', "secretshhhh");

apiRoutes.use(function (req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['authorization'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
            if (err) {
                return res.json({success: false, message: 'Failed to authenticate token.'});
            } else {
                // if everything is good, save to request for use in other routes
                req.user = decoded;
                var originalDecoded = jwt.decode(token, {complete: true});
                //   var refreshed = jwt.refresh(originalDecoded, 3600, app.get('superSecret'));
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }

});

// route to show a random message (GET http://localhost:8080/api/)


// route to return all users (GET http://localhost:8080/api/users)


// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);


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


function addUser(user, callback) {
    console.log(user);
    connection.query("Select id from login where email=?", [user.email], function (error, rows, fields) {
        if (!!error) {
            console.log('Error in query select email' + error);
            callback(error, null);

        } else {
            if (rows.length === 0) {
                console.log("Rows" + rows.length + " " + user.email);
                console.log("There is no such user, adding now");
                var post = {name: user.name, email: user.email, password: user.password};
                connection.query("INSERT into login SET ?", post, function (error, result) {
                    if (!!error) {
                        console.log('Error in query inser' + error);
                    } else {
                        console.log("Success");
                        console.log(result.insertId);
                        callback(null, result.insertId);
                    }
                });
            }
            else {
                console.log("User already exists in database")
                callback(null, rows[0].id);
            }
        }
    });
}

function addUserSignUp(user, callback) {
    console.log(user);
    connection.query("Select id from login where email=?", [user.username], function (error, rows, fields) {
        if (!!error) {
            console.log('Error in query select email' + error);
            callback(error, null);

        } else {
            if (rows.length === 0) {
                console.log("Rows" + rows.length + " " + user.username);
                console.log("There is no such user, adding now");
                var post = {name: user.name, email: user.username, password: user.password};
                connection.query("INSERT into login SET ?", post, function (error, result) {
                    if (!!error) {
                        console.log('Error in query inser' + error);
                    } else {
                        console.log("Success");
                        console.log(result.insertId);
                        callback(null, result.insertId);
                    }
                });
            }
            else {
                console.log("User already exists in database")
                callback(503, null);
            }
        }
    });
}

passport.use('facebook-token', new FacebookTokenStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET
}, function (accessToken, refreshToken, profile, done) {
    console.log("facebook-token");
    var user = profile._json;
    var post = {name: user.name, email: user.email, token: ''};
    addUser(post, function (err, data) {
        if (err)
            ;
        else {
            var token = generateTokenSocial(data);
            post.token = token;
            return done(null, post);
        }
    });
}));


app.post('/auth/facebook/token',
    passport.authenticate('facebook-token'),
    function (req, res) {
        // do something with req.user
        var user = req.user;

        console.log(user);
        //  res.send(req.user ? 200 : 401)
        res.json(user);
    }
);


var GOOGLE_CLIENT_ID = "179156263831-1ft0siuvco0s1nadaj307fcsui3kgsj6.apps.googleusercontent.com";
var GOOGLE_CLIENT_SECRET = "Uxx0Uw2r7VprQaLDktNY6cvf";


passport.use('google-id-token', new GoogleTokenStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET

    },
    function (parsedToken, googleId, done) {
        var user = parsedToken.payload;
        console.log(parsedToken);
        var post = {name: user.name, email: user.email, token: ''};
        console.log(googleId);
        addUser(post, function (err, data) {
            if (err)
                ;
            else {
                var token = generateTokenSocial(data);
                post.token = token;
                return done(null, post);
            }
        });
    }
));

app.post('/auth/google',
    passport.authenticate('google-id-token'),
    function (req, res) {
        // do something with req.user
        console.log("google-id-token");
        var user = req.user;
        console.log(user);
        res.json(user);
        // res.send(req.user? 200 : 401);
    }
);

handleDisconnect();


passport.use('local', new LocalStrategy(
    function (username, password, done) {
        console.log("local");
        var user = {username: username, password: password};
        connection.query("Select id from login where email=? and password=?", [username, password], function (error, rows, fields) {
            if (!!error) {
                console.log('Error in query select id' + error);
                return done(503, null)
            } else {
                if (rows.length === 0) {
                    return done(503, null)
                }
                return done(null, rows[0])
            }
        });
    }
    )
);


app.post('/signup',
    function (req, res) {
        //res.redirect('/');
        var user = req.body;
        addUserSignUp(user, function (err, data) {
            if (err)
                res.json(err.statusCode);
            else {
                res.json(user);
            }
        });
    });


app.post('/login',
    passport.authenticate('local', {failureRedirect: '/login'}), generateToken,
    function (req, res) {
        //res.redirect('/');
        console.log(req.user);
        console.log(req.token);
        res.json(req.token);
    });

function generateToken(req, res, next) {
    req.token = jwt.sign({
        id: req.user.id
    }, app.get('superSecret'), {
        expiresIn: 60 * 60 * 24
    });
    next();
}
function generateTokenSocial(userid) {
    return jwt.sign({
        id: userid
    }, app.get('superSecret'), {
        expiresIn: 60 * 60 * 24
    });
}


app.get('/api/getDataDetail',
    function (req, res) {
        var id = req.query.id;
        console.log("id: " + req.user);
        connection.query("SELECT  o.id, o.latitude, o.longitude,o.ownerid,o.description,o.done,o.place,l.image " +
            "FROM onlab o inner join login l on o.ownerid=l.id " +
            "where o.id=?;", [id], function (error, rows, fields) {
            if (!!error) {
                console.log('Error in query' + error);
            } else {
                console.log("Success");
                res.json(rows[0]);
            }
        });


    });


app.get('/api/get',
    function (req, res) {
        console.log("id: " + req.user);
        connection.query("SELECT o.id, o.latitude, o.longitude,o.ownerid,o.place,l.image " +
            "FROM onlab o inner join friends f on o.ownerid=f.user_id2  " +
            "inner join login l on o.ownerid=l.id " +
            "where f.user_id1=? and o.done=0 and o.ownerid<>?;", [req.user.id,req.user.id], function (error, rows, fields) {
            if (!!error) {
                console.log('Error in query' + error);
            } else {
                console.log("Success");
                res.json(rows);
            }
        });


    });

app.post('/api/addfirend', function (req, res) {
    console.log("id: " + req.user);
    connection.query("insert into friends(user_id1, user_id2) values (?,?);", [req.user.id, req.body.friend], function (error, result) {
        if (!!error) {
            console.log('Error in query' + error);
        } else {
            console.log("Success");
            console.log(result.insertId);
            res.json(result.insertId);
        }
    });
});

app.delete('/api/deletefirend', function (req, res) {
    console.log("id: " + req.user);
    var id = req.query.id;
    connection.query("delete from friends where user_id1=? and user_id2=?;", [req.user.id, id], function (error, result) {
        if (!!error) {
            console.log('Error in query' + error);
        } else {
            console.log("Success");
            console.log(result.insertId);
            res.json(result.insertId);
        }
    });
});

app.get('/api/me',
    function (req, res) {
        console.log("id: " + req.user);
        connection.query("SELECT id,name,image FROM login l where  l.id=?;", [req.user.id], function (error, rows, fields) {
            if (!!error) {
                console.log('Error in query' + error);
            } else {
                console.log("Success");
                res.json(rows[0]);
            }
        });
    });

app.get('/api/medetails',
    function (req, res) {
        console.log("id: " + req.user);
        connection.query("SELECT l.id,l.name,l.email,l.image,true as isfriend  FROM login l where  l.id=?;", [req.user.id], function (error, rows, fields) {
            if (!!error) {
                console.log('Error in query' + error);
            } else {
                console.log("Success");
                res.json(rows[0]);
            }
        });
    });

app.get('/api/getfriends',
    function (req, res) {
        console.log("id: " + req.user);
        connection.query("SELECT id,name,image,true as isfriend  FROM login l inner join friends f on f.user_id2=l.id where f.user_id1=? and l.id<>?;", [req.user.id,req.user.id], function (error, rows, fields) {
            if (!!error) {
                console.log('Error in query' + error);
            } else {
                console.log("Success");
                res.json(rows);
            }
        });
    });

app.get('/api/users',
    function (req, res) {
        console.log("id: " + req.user);
        connection.query("Select l.id,l.name,l.image from login l where l.id<>?", req.user.id, function (error, rows, fields) {
            if (!!error) {
                console.log('Error in query' + error);
            } else {
                console.log("Success");
                res.json(rows);
            }
        });
    });
app.get('/api/user',
    function (req, res) {
        console.log("id: " + req.user);
        var id = req.query.id;
        connection.query("Select l.id,l.name,l.email,image, CASE WHEN user_id2 IS NULL THEN false ELSE true END AS isfriend " +
            " from login l left join (select * from friends where user_id1=?) f " +
            "on l.id=f.user_id2  where l.id=? group by l.id", [req.user.id, id], function (error, rows, fields) {
            if (!!error) {
                console.log('Error in query' + error);
            } else {
                console.log("Success");
                res.json(rows[0]);
            }
        });
    });

app.get('/api/getme',
    function (req, res) {
        console.log("id: " + req.user);
        connection.query("SELECT o.id, o.latitude, o.longitude, o.place, o.ownerid, o.done FROM onlab o inner join login l on l.id=ownerid where l.id=?", req.user.id, function (error, rows, fields) {
            if (!!error) {
                console.log('Error in query' + error);
            } else {
                console.log("Success");
                res.json(rows);
            }
        });


    });


app.get('/', function (req, res) {


});

// This responds a POST request for the homepage
app.post('/api', function (req, res) {

    console.log("Got a POST request for the homepage");
    var post = {
        ownerid: req.user.id,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        place: req.body.place
    };
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

app.post('/api/device', function (req, res) {
    connection.query("UPDATE login SET deviceid=? where id=?", [req.body.tokenid, req.user.id], function (error, result) {
        if (!!error) {
            console.log('Error in query' + error);
        } else {
            console.log("Success");
            console.log(req.user.id);
            res.json(req.user.id);
        }
    });

});

app.post('/api/push', function (req, res) {
    connection.query("SELECT deviceid from login where id=?", [req.body.id], function (error, rows, fields) {
            if (!!error) {
                console.log('Error in query select deviceid' + error);
                callback(error, null);

            } else {
                if (rows.length != 0 && rows[0].deviceid != null) {
                    sendMessageToUser(rows[0].deviceid, "desfgh");
                }
            }
        }
    );


});


function sendMessageToUser(deviceId, message) {
    request({
        url: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: {
            'Content-Type': ' application/json',
            'Authorization': 'key=AIzaSyASJpTfF0iPQ8EY1zdz8dw-fCwyKVr-xz8'
        },
        body: JSON.stringify(
            {
                "data": {
                    "message": message
                },
                "to": deviceId
            }
        )
    }, function (error, response, body) {
        if (error) {
            console.error(error, response, body);
        }
        else if (response.statusCode >= 400) {
            console.error('HTTP Error: ' + response.statusCode + ' - ' + response.statusMessage + '\n' + body);
        }
        else {
            console.log('Done!')
        }
    });
}


exports.imageForm = function (req, res) {
    res.render('upload', {
        title: 'Upload Images'
    });
};


var storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            if (err) return cb(err)
            var ext = path.extname(file.originalname)
            if (ext == ".jpg" || ext == ".png" || ext ==".jpeg")
                cb(null, raw.toString('hex') + ext)
            else {
                var error = new Error();
                error.status = 500;
                cb(error)
            }
        })
    }
});



var upload1 = multer({storage: storage})





//app.get('/upload', imageForm);
app.post('/api/upload', upload1.single('avatar'), function (req, res, next) {
    console.log('file info: ', req.file);
    console.log('file info: ', "saddddddddddddddddd");
    Jimp.read(req.file.path, function (err, lenna) {
        if (err) throw err;
        lenna.resize(200, 200)  // resize
            .quality(60)                 // set JPEG quality
            .write(req.file.path); // save
    });

    //split the url into an array and then get the last chunk and render it out in the send req.
    var pathArray = req.file.path.split('/');
    connection.query("UPDATE login SET image=? where id=?", [encodeURIComponent(req.file.path), req.user.id], function (error, result) {
        if (!!error) {
            console.log('Error in query' + error);
        } else {
            console.log("Success");
            console.log(req.user.id);
            res.json(req.user.id);
        }
    });
    /*res.send(util.format(' Task Complete \n uploaded %s (%d Kb) to %s as %s'
     , req.file.name
     , req.file.size / 1024 | 0
     , req.file.path
     , req.body.title
     , req.file
     , '<img src="uploads/' + pathArray[(pathArray.length - 1)] + '">'
     ));*/


});

app.get('/api/imagebyid', function (req, res) {
    console.log("id: " + req.user);
    var id = req.query.id;
    connection.query("SELECT image FROM login where id=? and image is not null", [req.query.id], function (error, rows, fields) {
        if (!!error) {
            console.log('Error in query' + error);
        } else {
            console.log("Success");
            if (rows.length === 0) {
                res.status(500).send('empty')
            } else
                res.sendfile(rows[0].image);
        }
    });

});

app.get('/api/image', function (req, res) {
    var id = req.query.image;
    res.sendfile(decodeURIComponent(req.query.image));
});

app.get('/image', function (req, res) {
    var id = req.query.image;
    res.sendfile(req.query.image);
});



app.get('/cool', function (request, response) {
    response.send(cool());
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
