import base = require("./component");

class ComponentDesktop extends base{
    whoAreYou() {
        return "I am a patched Generic class, patched by a Desktop divergent, Original Msg: " + super.whoAreYou();
    }
}
export = ComponentDesktop;