var WebpackDevServer = require("webpack-dev-server");
var webpack = require("webpack");
var webpackConfig = require('./webpack.config.js');


var webpackServer = false;


webpackServer && webpackConfig.plugins.unshift(new webpack.HotModuleReplacementPlugin());

var compiler = webpack(webpackConfig);

if (webpackServer) {
    var server = new WebpackDevServer(compiler, {
        devtool: "source-map",
        contentBase: "./",
        publicPath: "./",
        hot: true,
        inline: true,
        progress: true,
        colors: true
    });

    server.listen(8080);
}
else {
    compiler.run(function(){
        console.log("Done!");
    });
}
