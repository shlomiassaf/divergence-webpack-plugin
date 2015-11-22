var AbstractPlugin = require("webpack/lib/AbstractPlugin");
var AsyncDependenciesBlock = require('webpack/lib/AsyncDependenciesBlock');
var DivergenceDependenciesBlock = require("./DivergenceDependenciesBlock");
var RequireEnsureItemDependency = require("webpack/lib/dependencies/RequireEnsureItemDependency");

/**
 * Return a POJO from an ObjectExpression expression
 * @param exp
 * @param valueParser
 * @returns {{}}
 */
function parseObjectExpression(exp, valueParser) {
    if(exp.type !== "ObjectExpression") return;

    var obj = {};
    exp.properties.forEach(function(p) {
        obj[p.key.name] = valueParser(p.value);
    });
    return obj;
}
/**
 * Returns a module "request" string literal from a "require" block.
 * If a string is supplied, returns it.
 */
function getRequest(arg) {
    if (arg.type === "CallExpression" && arg.callee.name === "require")
        return this.evaluateExpression(arg.arguments[0]);
    else
        return this.evaluateExpression(arg);
}

function addDependencyItem(depBlock, requestEvaluated) {
    var old = this.state.current;
    this.state.current = depBlock;

    try {
        this.inScope([], function() {
            var divergedDep = new RequireEnsureItemDependency(requestEvaluated.string, requestEvaluated.range);
            divergedDep.loc = depBlock.loc;
            depBlock.addDependency(divergedDep);
        });
        old.addBlock(depBlock);
    } finally {
        this.state.current = old;
    }
}

module.exports = AbstractPlugin.create({
    "call require.diverge": function(expr) {
        var divergenceMeta = {
                baseDep: null,
                options: null,
                divergeMap: {}
            };

        var baseDepIdx = -1, divergenceMapIdx = 0, optionsIdx = -1;

        switch(expr.arguments.length) {
            case 3: // options
                optionsIdx = 2;
            case 2: // either base module supplied or options.
                if (expr.arguments[0].type === "ObjectExpression") {
                    optionsIdx = 1;
                }
                else {
                    baseDepIdx = 0;
                    divergenceMapIdx = 1;
                }
            case 1:
                if (baseDepIdx !== -1) {
                    // load base module into current chunk/entry
                    var baseRequest =  getRequest.call(this, expr.arguments[baseDepIdx]);
                    if (!baseRequest.isString())
                        throw new Error("Base request is not valid, either a require or a string literal allowed.");
                    var baseDep = new RequireEnsureItemDependency(baseRequest.string);
                    baseDep.loc = this.state.current.loc;
                    this.state.current.addDependency(baseDep);
                    divergenceMeta.baseDep = baseDep;
                }

                divergenceMeta.options = (optionsIdx > -1) ? parseObjectExpression(expr.arguments[optionsIdx], this.evaluateExpression.bind(this)) : null;
                var divergeMap =  parseObjectExpression(expr.arguments[divergenceMapIdx], getRequest.bind(this));

                if (!divergeMap)
                    throw new Error("Invalid Diverge map.");

                var divergeNames = Object.getOwnPropertyNames(divergeMap);
                if (divergeNames.length === 0)
                    throw new Error("At least one divergent is needed, none supplied.");

                var idx = divergeNames.length;
                while(idx--) {
                    var chunkName = divergeNames[idx],
                        requestEvaluated = divergeMap[chunkName];

                    if (!requestEvaluated || !requestEvaluated.isString())
                        throw new Error("Divergent '" + chunkName + "' has an invalid request, either a require or a string literal allowed.");

                    if (!requestEvaluated.string)
                        throw new Error("Divergent '" + chunkName + "'has an empty request.");

                    // all block does not need to change template, only 1, so the last will do it...
                    var asyncDepBlock = (idx === 0) ?
                        divergenceMeta.divergeMap[chunkName] = new AsyncDependenciesBlock(chunkName, this.state.module, expr.loc) :
                        divergenceMeta.divergeMap[chunkName] = new DivergenceDependenciesBlock(expr, divergenceMeta, chunkName, this.state.module, expr.loc);

                    asyncDepBlock.isDivergent = true;
                    asyncDepBlock.rawRequest = requestEvaluated.string;
                    addDependencyItem.call(this, asyncDepBlock , requestEvaluated);
                }
                return true;
        }
    }
});



