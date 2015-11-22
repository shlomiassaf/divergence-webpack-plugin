function DivergenceMainTemplatePlugin(divergencePlugin, compilation) {
    this.divergencePlugin = divergencePlugin;
    this.compilation = compilation;
}
module.exports = DivergenceMainTemplatePlugin;

/**
 * Bit flags for reqiure.diverge() options.
 */
DivergenceMainTemplatePlugin.OPTIONS_FLAG_ENUM = {
    concat: 1,
    skipBase: 2,
    strict: 4
};

DivergenceMainTemplatePlugin.prototype.constructor = DivergenceMainTemplatePlugin;

DivergenceMainTemplatePlugin.prototype.apply = function(mainTemplate) {
    var compilation = this.compilation,
        options = this.divergencePlugin.options;

    mainTemplate.plugin('require-extensions', function(source, chunk, hash) {
        function isChunkDiverged(chunk) {
            for (var i in chunk.blocks) {
                if (chunk.blocks[i].isDivergent === true)
                    return true;
            }
            return false;
        }

        // Adds the diverge extension function to every chunk
        var divergedChunksMap = compilation.chunks
            .filter(isChunkDiverged)
            .reduce(function(prev, curr) { prev[curr.name] = curr.id; return prev; }, {});

        var buf = [];
        buf.push("");
        buf.push("");
        buf.push("// Divergence handling");
        buf.push(options.requireFn + "." + options.divergenceExtensionFnName + " = function handleDivergence(baseId, divergents, optionsFlag) {");
        buf.push(this.indent(this.applyPluginsWaterfall("require-diverge", "throw new Error('Not chunk loading available');", chunk, hash, "chunkId")));
        buf.push("};");
        buf.push(options.requireFn + "." + options.chunkMapPropName + " = " +  JSON.stringify(divergedChunksMap) + ";");

        return source + this.asString(buf);
    });

    mainTemplate.plugin("require-diverge", function(source, chunk, hash) {
        //function handleDivergence(baseId, divergents, optionsFlag)
        return this.asString([
            "// Flags: 1 = Concat, 2 = skipBase, 4 = strict",
            "var i = divergents.length;",
            "while(i--) if (" + options.requireFn + ".m[divergents[i]]) break;", //TODO: Cant use __webpack_modules__ at this point, using m is not future safe but APIPlugin has the replacement map private.
            "var divergent = (i === -1) ? undefined : " + options.requireFn + "(divergents[i]),",
            this.indent("base = (optionsFlag & " + DivergenceMainTemplatePlugin.OPTIONS_FLAG_ENUM.skipBase + " || baseId === -1) ? undefined : " + options.requireFn + "(baseId); /* skipBase */"),
            "if (base && divergent)",
            this.indent("return (optionsFlag & " + DivergenceMainTemplatePlugin.OPTIONS_FLAG_ENUM.concat + ") ? base + divergent : divergent; /* Concat */"),
            "else {",
            this.indent([
                "if (!divergent && optionsFlag & " + DivergenceMainTemplatePlugin.OPTIONS_FLAG_ENUM.strict + ") throw new Error('Divergent not found.'); /* strict */",
                "return (divergent) ? divergent : (base) ? base : null;"
            ]),
            "}"
        ]);
    });
};