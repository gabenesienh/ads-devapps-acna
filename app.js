require('dotenv/config');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var lessMiddleware = require('less-middleware');
var logger = require('morgan');
var session = require('express-session');

var helpers = require('./lib/helpers');
var auth = require('./lib/auth');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var forumRouter = require('./routes/forum');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Sessão: mantém o usuário logado entre as páginas
app.use(session({
  secret: process.env.SESSION_SECRET || 'acna-segredo-de-desenvolvimento',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 dias
}));

// Variáveis disponíveis em todas as views
app.use(function(req, res, next) {
  res.locals.appNome = process.env.APP_NOME || 'ACNA Fórum';
  res.locals.usuario = req.session.usuario || null;
  res.locals.ehModerador = auth.ehModerador(req.session.usuario);
  res.locals.caminho = req.path;
  res.locals.h = helpers;
  if (req.session.usuario) auth.registrarAcesso(req.session.usuario);
  next();
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', forumRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404, 'Página não encontrada'));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { titulo: 'Erro' });
});

module.exports = app;
