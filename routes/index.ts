var express = require('express');
var router = express.Router();

/* GET página inicial */
router.get('/', function(req, res, next) {
  res.render('index', { 
    title: 'Fórum Nostálgico',
    forums: [] 
  });
});

/* GET /login */
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Entrar no Fórum' });
});

/* GET /register */
router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Criar Conta' });
});

module.exports = router;