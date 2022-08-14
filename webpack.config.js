const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MarkdownIt = require('markdown-it'),
    md = new MarkdownIt();
const fs = require('fs');

module.exports = {
  entry: "./src/v1/index.ts",
  mode: "development",
  devServer: {
    watchFiles: ["src/**/*"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        include: path.resolve(__dirname, "src"),
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/v1/index.html", to: "v1/index.html",
        transform(content) {
          const READMERAW = fs.readFileSync('./README.md', 'utf-8');
          const README = md.render(READMERAW);
          return `${content}`.replace('{content}', README)
        } },
        { from: "src/v1/plugins", to: "v1/plugins" },
        { from: "src/assets", to: "assets" },
        { from: "src/styles", to: "styles" },
        { from: "src/index.html", to: "index.html" },
      ],
    }),
  ],
  output: {
    filename: "v1/nomie-plugin.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
};
