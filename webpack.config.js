const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');

module.exports = {
    mode:'development',
    entry: {
        main: ['./src/js/dbhelper.js', './src/js/main.js', './src/js/register.js', './src/js/sw.js'],
        restaurant: ['./src/js/dbhelper.js', './src/js/restaurant_info.js']
    },
    output: {
        filename: '[name].bundle.min.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    'babel-loader',
                    'eslint-loader'
                ],
                exclude: /node-modules/
            },
            {
                test: /\.css$/,
                use: [
                    { loader: "style-loader" },
                    { loader: "css-loader" }
                ]
            }
        ]
    },
    plugins: [
        // extractCSS,
        new CleanWebpackPlugin(['dist']),
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "src/index.html",
            chunks: ["main"]
        }),
        new HtmlWebpackPlugin({
            filename: "restaurant.html",
            template: "src/restaurant.html",
            chunks: ["restaurant"]
        }),
        new ServiceWorkerWebpackPlugin({
            entry: path.join(__dirname, 'src/js/sw.js'),
          })
    ]
};

