var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './src/index.tsx',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/assets/',
    filename: 'main.js',
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
          loader: "babel-loader"
        }
      }
    ]
  },
  resolve: {
    modules: [
      path.resolve('src'),
      path.resolve('node_modules'),
    ],
    extensions: ['.js', '.ts', '.tsx'],
  },
  devtool: 'eval-source-map',
  stats: {
    colors: true
  },
  devServer: {
    hot: true,
    inline: true,
    publicPath: '/dist/',
    historyApiFallback: true,
  },
};
