var winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'opengis proxy' },
    transports: [
      //
      // - Write all logs with level `error` and below to `error.log`
      // - Write all logs with level `info` and below to `combined.log`
      //
    //   new winston.transports.File({ 
    //         filename: './logs/errors.log', 
    //         level: 'error', 
    //         timestamp: true,
    //         maxsize: 5242880, //5MB
    //         maxFiles: 5}),
      new winston.transports.File({ 
          filename: '/gis/logs/proxy.log', 
          timestamp:true,
          maxsize: 5242880, //5MB
          maxFiles: 10 }),
    //   new winston.transports.File({ 
    //       filename: './logs/debug.log', 
    //       level: 'debug', 
    //       timestamp:true,
    //       maxsize: 5242880, //5MB
    //       maxFiles: 5 }),

    ],
  });


module.exports = logger;
