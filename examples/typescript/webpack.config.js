var path = require('path');
var fs = require("fs-extra");
var DivergencePlugin = require('../../DivergencePlugin');
var distPath = path.join(__dirname, 'dist');

fs.emptyDirSync(distPath);

module.exports = {
    context: path.join(__dirname),
    entry: {
        app: ["./app.ts"]
    },
    output: {
        public: "/",
        path: path.join(__dirname, 'dist'),
        filename: "[name].js"
    },
    plugins: [
        new DivergencePlugin(),
        function() {
            this.plugin("done", function(stats) {
                fs.copySync(path.join(__dirname, 'index.html'), path.join(distPath, 'index.html'));
            });
        }
    ],
    module: {
        loaders: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader'
            },
            {
                test: /\.css$/,
                loader: 'style!css'
            },
            {
                test: /\.html/,
                loader: 'raw'
            }
        ]
    },
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    }
};