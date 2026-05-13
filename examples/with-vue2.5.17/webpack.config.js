const path = require("path");
const webpack = require("webpack");

const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "./dist"),
    publicPath: "/dist/",
    filename: "index.js"
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader"
      },
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ["vue-style-loader", "css-loader"]
      }
    ]
  },
  ...(isProduction
    ? {}
    : {
        devServer: {
          historyApiFallback: true,
          noInfo: true,
          overlay: true
        }
      }),
  plugins: isProduction
    ? [
        new webpack.DefinePlugin({
          "process.env": {
            NODE_ENV: '"production"'
          }
        })
      ]
    : [
        new webpack.DefinePlugin({
          "process.env": {
            NODE_ENV: '"development"'
          }
        })
      ],
  resolve: {
    alias: {
      vue$: "vue/dist/vue.esm.js"
    }
  },
  // performance: {
  //   hints: false
  // },
  devtool: isProduction ? false : "#eval-source-map"
};
