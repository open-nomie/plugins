const config = require("./webpack.config");


module.exports = config.map((cnf) => {
  cnf.mode = 'production';
  return cnf;
});
