'use strict';

const cookieParser = require('cookie-parser');
const clc          = require('cli-color');

let _options = {};
let _app;
let _locales = {};

const _checkLocalesConsistency = function(requiredLocales){
  const compositeLocal = {};
  const requiredLocalesArray = Object.keys(requiredLocales);
  
  requiredLocalesArray.map( (localId) => {
    const local = requiredLocales[localId];
    
    Object.keys(local).map( key => {
      if (typeof compositeLocal[key] === 'undefined') compositeLocal[key] = [localId];
      else compositeLocal[key].push(localId);
    });
  });
  
  Object.keys(compositeLocal).map(key => {
    const existentLocales = compositeLocal[key];
    if (existentLocales.length !== requiredLocalesArray.length) {
      const missingLocales = requiredLocalesArray.filter(key => existentLocales.indexOf(key) == -1);
      
      console.log(`[${clc.magenta('i18n')}] - ${clc.yellow('WARNING')} - ${clc.cyan(key)} key exists in ${clc.green(existentLocales.join(','))} and miss in ${clc.red(missingLocales.join(','))} locales`);
    }
  });
};

module.exports = class i18n {
  static get currentLocale() { return _app.locals.currentLocale}
  static set currentLocale(value) { _app.locals.currentLocale = value.toUpperCase();}
  
  static init(app, localesFolder, options) {
    _app = app;
    _app.use(cookieParser());
    _app.locals[_options.prefix] = i18n;
    
    const defaultOptions = {
      prefix         : 'i18n',
      defaultLocale  : 'EN',
      cookieName     : 'i18n',
      cookieDuration : 365,
      silentWarnings : false
    };

    if (!options) _options = defaultOptions;
    else Object.keys(defaultOptions).map(key => _options[key] = options[key] || defaultOptions[key]);

    const requiredLocales = require('require-dir')(localesFolder);
    if (!_options.silentWarnings) _checkLocalesConsistency(requiredLocales);
    Object.keys(requiredLocales).map(key => _locales[key.toUpperCase()] = requiredLocales[key]);
    
    return function (req, res, next) {
      i18n.currentLocale = req.cookies[_options.cookieName] || _options.defaultLocale;
      if (!req.cookies[_options.cookieName]) res.cookie(_options.cookieName, i18n.currentLocale, {maxAge: _options.cookieDuration * 24 * 60 * 60 * 1000});
      next();
    };
  }

  static __(key) {
    return _locales[i18n.currentLocale][key] || _locales[_options.defaultLocale][key];
  };
};
