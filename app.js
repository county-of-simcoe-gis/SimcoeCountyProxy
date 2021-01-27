const express = require('express');
const path = require('path');
let app = express();
var fs = require("fs");
var http = require('http');
var https = require('https');
const {createProxyMiddleware} = require('http-proxy-middleware');
const debug = require('debug');
var cors = require('cors');
var logger = require('./logger');


app.options('*', cors());
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
for (route of routes) {
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
    logger.info('HTTPS (SSL) Express server listening on port 443');
    debug('HTTPS (SSL) Express server listening on port 443');
});

// HTTP
var server = http.createServer(options, app).listen(80, function () {
    logger.info('HTTP Express server listening on port ' + server.address().port);
    debug('HTTP Express server listening on port ' + server.address().port);
});
