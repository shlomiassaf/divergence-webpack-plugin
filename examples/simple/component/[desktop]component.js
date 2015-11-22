var base = require("./component");

var oldWhoAreYou = base.prototype.whoAreYou;
base.prototype.whoAreYou = function() {
    return "I am a patched Generic class, patched by a Desktop divergent, Original Msg: " + oldWhoAreYou();
};



module.exports = base;