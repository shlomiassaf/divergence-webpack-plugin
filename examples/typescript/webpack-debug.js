var WebpackDevServer = require("webpack-dev-server");
var webpack = require("webpack");
var webpackConfig = require('./webpack.config.js');

webpackConfig.plugins.unshift(new webpack.HotModuleReplacementPlugin());

var compiler = webpack(webpackConfig);
var server = new WebpackDevServer(compiler, {
    devtool: "source-map",
    contentBase: "./app",
    publicPath: "/",
    hot: true,
    inline: true,
    progress: true,
    colors: true
});
server.listen(8000);