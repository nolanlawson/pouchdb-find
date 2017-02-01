'use strict';

module.exports = function (func) {
  return eval("'use strict'; (" + func.replace(/;\s*$/, "") + ");");
};
