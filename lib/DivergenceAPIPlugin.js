var ConstDependency = require("webpack/lib/dependencies/ConstDependency");
var BasicEvaluatedExpression = require("webpack/lib/BasicEvaluatedExpression");

var NullFactory = require("webpack/lib/NullFactory");

var REPLACEMENTS = {
    __webpack_divergent_labels__: function(options) { return options.requireFn + "." + options.chunkMapPropName;} // eslint-disable-line camelcase
};
var REPLACEMENT_TYPES = {
    __webpack_divergent_labels__: "object" // eslint-disable-line camelcase
};

var IGNORES = [];

function DivergenceAPIPlugin(divergencePlugin) {
    this.divergencePlugin = divergencePlugin;
}

module.exports = DivergenceAPIPlugin;



DivergenceAPIPlugin.prototype.apply = function(compiler) {
    var dvgOptions = this.divergencePlugin.options;

    compiler.plugin("compilation", function(compilation) {
        compilation.dependencyFactories.set(ConstDependency, new NullFactory());
        compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());
    });
    Object.keys(REPLACEMENTS).forEach(function(key) {
        compiler.parser.plugin("expression " + key, function(expr) {
            var dep = new ConstDependency(REPLACEMENTS[key](dvgOptions), expr.range);
            dep.loc = expr.loc;
            this.state.current.addDependency(dep);
            return true;
        });
        compiler.parser.plugin("evaluate typeof " + key, function(expr) {
            return new BasicEvaluatedExpression().setString(REPLACEMENT_TYPES[key]).setRange(expr.range);
        });
    });
    IGNORES.forEach(function(key) {
        compiler.parser.plugin(key, function() {
            return true;
        });
    });
};
