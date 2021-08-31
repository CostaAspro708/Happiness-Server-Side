var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
var indexRouter = require('./routes/index');
var https = require('https');
const fs = require('fs');
const privateKey = fs.readFileSync('/etc/ssl/private/node-selfsigned.key','utf8');
const certificate = fs.readFileSync('/etc/ssl/certs/node-selfsigned.crt','utf8');
const credentials = {
 key: privateKey,
 cert: certificate
};

const normalizePort = val => {  
  var port = parseInt(val, 10);  
  if (isNaN(port)) {  
    // named pipe  
    return val;  
  }   
  if (port >= 0) {  
    // port number  
    return port;  
  }  
  return false;  
};  

var app = express();
var port = normalizePort(process.env || "433")

var httpsServer = https.createServer(credentials,  app);

app.set('port', port)


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const options = require('./knexfile.js');
const knex = require('knex')(options);
app.use((req, res, next) => {
 req.db = knex
 next()
})

app.get('/', function (req, res) {
  res.header('Content-type', 'text/html');
  return res.end('<h1>Hello, Secure World!</h1>');
});

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
app.listen(3002)
httpsServer.listen(3005)

module.exports = app;
