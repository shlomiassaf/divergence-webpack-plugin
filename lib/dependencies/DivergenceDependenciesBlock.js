var AsyncDependenciesBlock = require("webpack/lib/AsyncDependenciesBlock");
var DivergenceDependency = require("./DivergenceDependency");

function DivergenceDependenciesBlock(expr, divergenceMeta, chunkName, module, loc) {
    AsyncDependenciesBlock.call(this, chunkName, module, loc);
    this.expr = expr;
    this.divergenceMeta = divergenceMeta;
    var dep = new DivergenceDependency(this);
    dep.loc = loc;
    this.addDependency(dep);
}
module.exports = DivergenceDependenciesBlock;

DivergenceDependenciesBlock.prototype = Object.create(AsyncDependenciesBlock.prototype);
