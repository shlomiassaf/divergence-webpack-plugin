var RequireEnsureDependency = require("webpack/lib/dependencies/RequireEnsureDependency");
var DivergenceMainTemplatePlugin = require('../DivergenceMainTemplatePlugin');

function getFlagsHint(optionsFlag) {
    var flags = [],
        flagsHint = "";
    for (var key in DivergenceMainTemplatePlugin.OPTIONS_FLAG_ENUM) {
        if (DivergenceMainTemplatePlugin.OPTIONS_FLAG_ENUM[key] & optionsFlag) {
            flags.push(key);
        }
    }
    if (flags.length) {
        flagsHint = "/* Flags: " + flags.join(", ") + " */";
    }

    return flagsHint;
}

function getModuleIdFromDepBlock(depBlock) {
    var idList = depBlock.chunks
        .filter(function(chunk) { return chunk.name === depBlock.chunkName; })
        .map(function(chunk) { return chunk.modules || []})
        .reduce(function(prev, curr) {
            return prev.concat(curr);
        }, [])
        .filter(function(mdl) { return mdl.rawRequest === depBlock.rawRequest; })
        .map(function(mdl) { return mdl.id; });

    return (idList.length) ? idList[0] : -1;
}

function DivergenceDependency(block) {
    RequireEnsureDependency.call(this, block);
    this.Class = DivergenceDependency;
}
module.exports = DivergenceDependency;

DivergenceDependency.prototype = Object.create(RequireEnsureDependency.prototype);
DivergenceDependency.prototype.constructor = DivergenceDependency;
DivergenceDependency.prototype.type = "require.diverge";

DivergenceDependency.Template = function DivergenceDependencyTemplate(divergencePlugin) {
    this.divergencePlugin = divergencePlugin;
};

DivergenceDependency.Template.prototype.apply = function(dep, source, outputOptions, requestShortener) {

    var options = this.divergencePlugin.options,
        depBlock = dep.block,
        divergenceMeta = depBlock.divergenceMeta,
        baseModuleId = (divergenceMeta.baseDep) ? divergenceMeta.baseDep.module.id : -1,
        divergentIds = Object.getOwnPropertyNames(divergenceMeta.divergeMap)
            .map(function(k) { return getModuleIdFromDepBlock(divergenceMeta.divergeMap[k]); })//TODO: replace with native webpack's module finder...
            .filter(function(id) { return id > -1; });

    var optionsFlag = 0;
    if (divergenceMeta.options) {
        optionsFlag = (divergenceMeta.options.concat) ?
            optionsFlag | DivergenceMainTemplatePlugin.OPTIONS_FLAG_ENUM.concat : optionsFlag;

        optionsFlag = (divergenceMeta.options.skipBase) ?
            optionsFlag | DivergenceMainTemplatePlugin.OPTIONS_FLAG_ENUM.skipBase : optionsFlag;

        optionsFlag = (divergenceMeta.options.skipBase) ?
            optionsFlag | DivergenceMainTemplatePlugin.OPTIONS_FLAG_ENUM.strict : optionsFlag;
    }

    var code = options.requireFn + "." + options.divergenceExtensionFnName + "(" + baseModuleId + ", " + JSON.stringify(divergentIds) + ", " + optionsFlag + ") " + getFlagsHint(optionsFlag);

    source.replace(depBlock.expr.range[0], depBlock.expr.range[1] -1, code);
};
