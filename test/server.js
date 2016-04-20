'use strict';

const express = require('express');
const path    = require('path');
const app     = express();
const i18n    = require('./../lib/sf-i18n');

app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));

const options = {
  cookieName    : 'mywebsite-i18n',
  defaultLocale : 'IT'
};
app.use(i18n.init(app, path.join(__dirname, './locales'), options ));

app.get('/', function(req, res){
  res.render('index');
});

app.get('/en', function(req, res){
  i18n.currentLocale = 'EN';
  res.render('index');
});

app.get('/it', function(req, res){
  i18n.currentLocale = 'IT';
  res.render('index');
});

app.listen(8080, function(){
  console.log('Listening on port 8080');
});
