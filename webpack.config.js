var path = require("path");

module.exports = {
  mode: "development",
  entry: path.resolve(__dirname, "./src/root.js"),
  module: {
    rules: [{ test: [/.js$/, /.jsx$/], use: "babel-loader" }]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js"
  },
  externals: {
    electron: "electron"
  }
};
