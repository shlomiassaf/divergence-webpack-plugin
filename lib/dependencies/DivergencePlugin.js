var BasicEvaluatedExpression = require("webpack/lib/BasicEvaluatedExpression");
var NullFactory = require("webpack/lib/NullFactory");
var ConstDependency = require("webpack/lib/dependencies/ConstDependency");
var RequireEnsureItemDependency = require("webpack/lib/dependencies/RequireEnsureItemDependency");

var DivergenceDependenciesBlockParserPlugin = require("./DivergenceDependenciesBlockParserPlugin");
var DivergenceDependency = require("./DivergenceDependency");
var DivergenceMainTemplatePlugin = require('../DivergenceMainTemplatePlugin');
var DivergenceAPIPlugin = require('../DivergenceAPIPlugin');

var defaultOptions = {
    /**
     * Allows overwriting the requireFn.
     * If not set, will be set to the default require function naame in MainTemplate.prototype.requireFn
     */
    requireFn: undefined,
    divergenceExtensionFnName: "dvg",
    chunkMapPropName: "dvgChunkMap"
};

/**
 *  A plugin that allow adding multiple levels horizontally to a base module (base module is optional).
 *  Each level is has a unique name so every call to require.diverge can reference the same levels.
 *  Only one level allowed per application runtime.
 *  Each level is a divergent and it can be used with or without the base module.
 *
 *  Divergence utilizes the "require.ensure" to allows async chunks where each chunk holds all divergent modules for a specific level.
 *  The plugin introduce a new require function: require.diverge()
 *
 *  require.diverge([base], divergeMap, [options]);
 *  base:   A require statement or a literal string representing the request of a require statement.
 *          A base module's chunk is the chunk of the calling module, same as using simple require.
 *  map:    A key value map were the keys are the level names and the values are the modules for each level.
 *          The value can be either a require statement or a literal string representing the request of a require statement.
 *          Each module will be stored in a separate chunk corresponding to the level name, such a chunk might hold multiple divergents for different base modules.
 *  options:
 *      concat:     Returns a concatenated value of base & divergent, no type check, so make sure modules return string values. (extending HTML)
 *                  DEFAULT: false
 *      skipBase:   If a divergent is found, do not require the base, base will never run due to lazy init.
 *                  DEFAULT: false
 *      strict: Throws an error when no divergent found, this will happen due to chunk file not present (loaded).
 *              If set to false, will return either base or null. (silent)
 *              DEFAULT: false
 */
function DivergencePlugin(options) {
    this.options = options || {};
    Object.getOwnPropertyNames(defaultOptions)
        .forEach(function(k) {
            if (!this.options.hasOwnProperty(k))
                this.options[k] = defaultOptions[k];
        }, this);

    var reservedExtensions = ["m", "c", "e", "p"];
    ['divergenceExtensionFnName', 'chunkMapPropName'].forEach(function(k) {
        var val = this.options[k];
        if (!val)
            throw new Error("Invalid divergence configuration, please supply a valid value for property '" + k + "'");

        if (reservedExtensions.indexOf(val) > -1)
            throw new Error("Invalid divergence configuration at property " + k + ", Require extension '" + val + "' already exists.");

        reservedExtensions.push(val);
    }, this);
}

module.exports = DivergencePlugin;

DivergencePlugin.prototype.apply = function(compiler) {
    compiler.plugin("compilation", function(compilation, params) {
        if (!this.options.requireFn)
            this.options.requireFn = compilation.mainTemplate.requireFn;

        var normalModuleFactory = params.normalModuleFactory;

        compilation.dependencyFactories.set(RequireEnsureItemDependency, normalModuleFactory);
        compilation.dependencyTemplates.set(RequireEnsureItemDependency, new RequireEnsureItemDependency.Template());

        compilation.dependencyFactories.set(DivergenceDependency, new NullFactory());
        compilation.dependencyTemplates.set(DivergenceDependency, new DivergenceDependency.Template(this));
    }.bind(this));

    compiler.apply(new DivergenceAPIPlugin(this));

    compiler.plugin("this-compilation", function(compilation, params) {
        compilation.mainTemplate.apply(new DivergenceMainTemplatePlugin(this, compilation));
    }.bind(this));

    new DivergenceDependenciesBlockParserPlugin().apply(compiler.parser);
    compiler.parser.plugin("evaluate typeof require.diverge", function(expr) {
        return new BasicEvaluatedExpression().setString("function").setRange(expr.range);
    });
    compiler.parser.plugin("typeof require.diverge", function(expr) {
        var dep = new ConstDependency("'function'", expr.range);
        dep.loc = expr.loc;
        this.state.current.addDependency(dep);
        return true;
    });
};
