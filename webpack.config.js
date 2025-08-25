const path = require('path');

module.exports = {
  entry: {
    popup: './popup.js',
    content: './content.js',
    bg: './bg.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
