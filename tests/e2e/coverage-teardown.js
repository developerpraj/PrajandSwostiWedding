const MCR = require('monocart-coverage-reports');
const options = require('../coverage.config.js');

module.exports = async () => {
  await MCR(options).generate();
};
