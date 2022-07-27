require("dotenv").config();

const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
// const ReactRefreshPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = {
  mode: "development",
  entry: path.join(__dirname, "/client/src/index.jsx"),
  output: {
    path: path.join(__dirname, "/client/dist"),
    filename: "bundle.js",
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /nodeModules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  // devServer: {
  //   index: "",
  //   proxy: {
  //     context: () => true,
  //     target: "http://localhost:3000",
  //   },
  // },
  plugins: [
    // new ReactRefreshPlugin(), // See note below...
    new HtmlWebpackPlugin({
      title: "Expresso",
      favicon: "./client/src/assets/favicon.png",
    }),
    // This will allow you to refer to process.env variables
    // within client-side files at build-time:
    new webpack.DefinePlugin({
      "process.env": {
        AUTH_SECRET: JSON.stringify(process.env.AUTH_SECRET),
      },
    }),
  ],
};

/**
 *
 * NOTE: About React Fast Refresh:
 *
 * You can enable fast-refresh for this project by enabling the
 * commented lines of code in this file, above and in .babelrc
 *
 * This will change the build so that the client is served by
 * webpack-dev-server and, as such, it should not be loaded via
 * the Express server:
 *
 * - The client will be viewable at http://localhost:8080/
 * - All API requests being sent by the client will be
 *   automatically routed to http://localhost:3000
 * - Since API requests are proxied, the server must still be
 *   running for the React app to compile and run correctly.
 *
 * Since that last requirement _may_ be prohibitive to
 * completing the assigned tasks, the fast-refresh
 * option has been disabled by default.
 *
 */
