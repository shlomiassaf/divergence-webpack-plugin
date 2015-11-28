try {
    require('shelljs/global');
    var fs = require('fs'),
        path = require('path');

    function getDirectories(srcpath) {
        return fs.readdirSync(srcpath).filter(function(file) {
            return fs.statSync(path.join(srcpath, file)).isDirectory();
        });
    }

    var examplesPath = path.join(__dirname, 'examples');
    var examples = getDirectories(examplesPath);

    if (!examples) return;

    examples.forEach(function(p) {
        try {
            fs.accessSync(path.join(examplesPath, p, 'package.json') , fs.F_OK)
            cd(path.join(examplesPath, p));
            echo('Installing NPM packages for example "' + p + '"...');
            exec('npm install');
        }
        catch(e) {}
    });

    cd(__dirname);
}
catch (ex) {

}