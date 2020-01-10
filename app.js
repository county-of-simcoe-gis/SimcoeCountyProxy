const express = require('express');
const path = require('path');
let app = express();
var fs = require("fs");
var http = require('http');
var https = require('https');
const proxy = require('http-proxy-middleware');
const debug = require('debug');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    // FORCE HTTPS
    if(!req.secure){
        res.redirect("https://" + req.headers.host + req.url);
    }

    next();
  });

// Config
const { routes } = require('./config.json');



for (route of routes) {
    app.use(route.route,
        proxy({
            target: route.address,
            pathRewrite: (path, req) => {
                console.log(path.split('/').slice(2).join('/'))
                return path.split('/').slice(2).join('/'); // Could use replace, but take care of the leading '/'
            }
        })
    );
}

// USE SSL CERTS
var keyPath = path.join(__dirname, "ssl", "opengisKEY.pem")
var certPath = path.join(__dirname, "ssl", "opengisCRT_chain.pem")
const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
};

// HTTPS
var server = https.createServer(options, app).listen(443, function () {
    debug('HTTPS (SSL) Express server listening on port 443');
});

// HTTP
var server = http.createServer(options, app).listen(80, function () {
    debug('HTTP Express server listening on port ' + server.address().port);
});
