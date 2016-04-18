'use strict';

module.exports = function(app, localesFolder, options){
  const defaultOptions = {
    prefix:         'i18n',
    defaultLang:    'IT',
    cookieName:     'i18n',
    cookieDuration: 365
  };

  
  if (!options) options = defaultOptions;
  else {
    Object.keys(defaultOptions).map( key =>  {
      if (!options[key]) options[key] = defaultOptions[key]
    });
  }
  const requiredLangs = require('require-dir')(localesFolder);
  const finalLangs = {};

  for (let key in requiredLangs) {
    finalLangs[key.toUpperCase()] = requiredLangs[key];
  }

  app.locals[options.prefix] = {
    __ :  function (key) {
      if (process.env.NODE_DEBUG) {
        const missing = [];
        for (let lang in finalLangs){
          if (!finalLangs[lang][key]) missing.push(lang);
        }

        if (missing.length){
          const warning = `!!! ${key} - MISSING ${missing.join(', ')} !!!`;
          console.warn(warning.yellow);
          return warning;
        }
      }
      let output = finalLangs[app.locals.currentLang][key];
      if (output) return output;
      else return finalLangs[options.defaultLang][key];
    }
  };

  return function(req, res, next){
    app.locals.currentLang = (req.cookies[options.cookieName] || options.defaultLang).toUpperCase();
    if (!req.cookies[options.cookieName]) res.cookie(options.cookieName, app.locals.currentLang, { maxAge: options.cookieDuration * 24 * 60 * 60 * 1000 });
    next();
  };
};
