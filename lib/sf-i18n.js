'use strict';

const cookieParser = require('cookie-parser');
const debug        = require('debug')('i18n');

let _options;
let _app;

module.exports = class i18n {
  static init(app, localesFolder, options) {
    _app = app;
    app.use(cookieParser());

    const defaultOptions = {
      prefix: 'i18n',
      defaultLang: 'IT',
      cookieName: 'i18n',
      cookieDuration: 365
    };

    if (!options) _options = defaultOptions;
    else {
      Object.keys(defaultOptions).map(key => {
        if (!options[key]) _options[key] = defaultOptions[key]
      });
    }

    const requiredLangs = require('require-dir')(localesFolder);
    const finalLangs = {};

    for (let key in requiredLangs) {
      finalLangs[key.toUpperCase()] = requiredLangs[key];
    }

    app.locals[_options.prefix] = {
      __: function (key) {
        
        const missing = [];
        for (let lang in finalLangs) {
          if (!finalLangs[lang][key]) missing.push(lang);
        }
        if (missing.length) {
          const warning = `!!! "${key}" - MISSING in following locales files: ${missing.join(', ')} !!!`;
          debug(warning);
        }
        
        let output = finalLangs[app.locals.currentLang][key];
        if (output) return output;
        else return finalLangs[_options.defaultLang][key];
      },

      //TODO sistemare il current lang xke me lo da undefined
      currentLang: app.locals.currentLang
    };

    return function (req, res, next) {
      app.locals.currentLang = (req.cookies[_options.cookieName] || _options.defaultLang).toUpperCase();
      if (!req.cookies[_options.cookieName]) res.cookie(_options.cookieName, res.locals.currentLang, {maxAge: _options.cookieDuration * 24 * 60 * 60 * 1000});
      next();
    };
  }

  static get currentLang() { return _app.locals.currentLang}
  static set currentLang(value) { _app.locals.currentLang = value.toUpperCase(); }
};
