const express = require('express');
const path = require('path');
let app = express();
const rateLimit = require('express-rate-limit');
const slowDown = require("express-slow-down");
var fs = require("fs");
var http = require('http');
var https = require('https');
var helmet = require("helmet");
const {createProxyMiddleware} = require('http-proxy-middleware');
const debug = require('debug');
var cors = require('cors');
var logger = require('./logger');

// Speed Limiting
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes (default is 1 minute)
    delayAfter: 100, // allow 100 requests per 15 minutes, then...
    delayMs: 500, // begin adding 500ms of delay per request above 100:
    maxDelayMs: 20000, // up to a maximum delay of 20 second
    skipSuccessfulRequests: true // don't slow down successful requests
  });

// Rate Limiting
const limit = rateLimit({
    max: 1000,// max requests (default is 5 set to 0 to disable)
    windowMs: 10 * 60 * 1000, // 10 minute of 'ban' / lockout (default is 1 minute)
    message: 'Too many requests', // message to send
    skipSuccessfulRequests: true,
});

app.use(speedLimiter);
app.options('*', cors());
app.use(helmet());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    // FORCE HTTPS
    if(!req.secure){
        res.redirect("https://" + req.headers.host + req.url);
        logger.info(`HTTP -> HTTPS Redirect`);
    }
    next();
  });

// Config
const { routes } = require('./config.json');
//const TIMEOUT = 5000; //set request timeout to 5 seconds
for (route of routes) {
    app.use(route.route, limit); // Setting limiter on specific route
    app.use(route.route,
        createProxyMiddleware({
            target: route.address,
            onProxyReq: (proxyReq, req,res) => {
                // SET THE ORIGINAL IP.  USED IN APPSTATS FOR NOW
                var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                ip = ip.replace("::ffff:", "");
                logger.info(`${ip}`);
                // logger.debug(`LOG TO DEBUG LOG`);
                // logger.error(`LOG TO ERROR LOG`);

                //const ip = req.connection.remoteAddress.replace("::ffff:", "");
                proxyReq.setHeader('proxy-ip', ip);
            },
            pathRewrite: (path, req) => {
                //TEST
                //console.log(path.split('/').slice(2).join('/'))
                console.log(path.split('/').slice(2).join('/'))
                logger.info(`${path}`);
                return path.split('/').slice(2).join('/'); // Could use replace, but take care of the leading '/'
            },
            //proxyTimeout: TIMEOUT,
            //timeout: TIMEOUT,
        })
    );
}

// USE SSL CERTS
var keyPath = path.join(__dirname, "ssl", "opengisKEY 2020.pem")
var certPath = path.join(__dirname, "ssl", "opengisCRT_chain 2020.pem")
const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
};

// // HTTPS
var server = https.createServer(options, app).listen(443, function () {
    logger.info('HTTPS (SSL) Express server listening on port 443');
    debug('HTTPS (SSL) Express server listening on port 443');
});

// HTTP
var server = http.createServer(options, app).listen(80, function () {
    logger.info('HTTP Express server listening on port ' + server.address().port);
    debug('HTTP Express server listening on port ' + server.address().port);
});
