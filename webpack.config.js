var path = require('path');
var webpack = require('webpack');

module.exports = {
  mode: 'development',
  output: {
    publicPath: '/assets/',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  resolve: {
    modules: [path.resolve('src'), path.resolve('node_modules')],
    extensions: ['.js', '.ts', '.tsx'],
  },
  devtool: 'eval-source-map',
  stats: {
    colors: true,
  },
  devServer: {
    hot: true,
    inline: true,
    publicPath: '/dist/',
    historyApiFallback: true,
  }
}
