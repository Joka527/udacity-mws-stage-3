const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');

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
                    // 'eslint-loader'
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
        }),
        new ManifestPlugin({
            fileName: 'manifest.json',
            basePath: '.',
            seed: {
                short_name:'Reviews App',
                name: 'Restaurant Reviews App',
                start_url:'.',
                background_color:'#eee',
                icons: [
                    {
                        "src": "assets/icons/app_icon_256.png",
                        "sizes": "256x256",
                        "type": "image/png"
                    },
                    {
                        "src": "assets/icons/app_icon_512.png",
                        "sizes": "512x512",
                        "type": "image/png"
                    }
                ],
                display:'minimal-ui',
                theme_color:'#eee'
            }
        })
    ]
};

