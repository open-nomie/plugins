const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

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
        { from: "src/v1/index.html", to: "v1/index.html" },
        { from: "src/index.html", to: "index.html" },
        { from: "src/v1/plugins", to: "v1/plugins" }
      ],
    }),
  ],
  output: {
    filename: "nomie-plugin.js",
    path: path.resolve(__dirname, "dist/v1/"),
    clean: true,
  },
};
