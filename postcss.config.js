const tailwindcss = require("tailwindcss");
const tailwindNesting = require("tailwindcss/nesting");
const postcssImport = require("postcss-import");
const postcssNested = require('postcss-nested');
module.exports = {
  plugins: [postcssImport, tailwindNesting, tailwindcss],
};
