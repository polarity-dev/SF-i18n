'use strict';

const cookieParser = require('cookie-parser');
const clc          = require('cli-color');

let _options = {};
let _app;
let _locales = {};

module.exports = class i18n {
  static get currentLocale() { return _app.locals.currentLocale}
  static setCurrentLocale(res, value) {
    _app.locals.currentLocale = value.toUpperCase();
    i18n._setCookie(res);
    return res;
  }

  static init(app, localesFolder, options) {
    _app = app;
    _app.use(cookieParser());

    const defaultOptions = {
      prefix         : 'i18n',
      defaultLocale  : 'EN',
      cookieName     : 'i18n',
      cookieDuration : 365,
      hideWarnings : false
    };

    if (!options) _options = defaultOptions;
    else Object.keys(defaultOptions).map(key => _options[key] = options[key] || defaultOptions[key]);

    _app.locals[_options.prefix] = i18n;

    const requiredLocales = require('require-dir')(localesFolder);
    if (!_options.hideWarnings) i18n._checkLocalesConsistency(requiredLocales);
    Object.keys(requiredLocales).map(key => _locales[key.toUpperCase()] = requiredLocales[key]);

    return function (req, res, next) {
      i18n.setCurrentLocale(res, req.cookies[_options.cookieName] || _options.defaultLocale)
      next();
    };
  }

  static __(key) {
    try {
      return _locales[i18n.currentLocale][key]
    } catch (err) {
      if (!_options.hideWarnings){
        console.log(`[${clc.magenta('i18n')}] - ${clc.yellow('WARNING')} - ${clc.cyan(key)} is missing in current locale file (${clc.red(i18n.currentLocale)})`);
      }

      return _locales[_options.defaultLocale][key];
    }
  };

  static _setCookie(res) {
    res.cookie(_options.cookieName, i18n.currentLocale, {maxAge: _options.cookieDuration * 24 * 60 * 60 * 1000});
  };

  static _checkLocalesConsistency(requiredLocales) {
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

        console.log(`[${clc.magenta('i18n')}] - ${clc.yellow('WARNING')} - ${clc.cyan(key)} key exists in ${clc.green(existentLocales.join(' '))} and miss in ${clc.red(missingLocales.join(' '))} locales`);
      }
    });
  };
};
