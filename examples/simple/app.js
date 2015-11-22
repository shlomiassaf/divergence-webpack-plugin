'use strict';

var divergetLabel = "mobile";
if (location.search.indexOf("divergent=desktop") > 0)
    divergetLabel = "desktop"

var divergent = __webpack_require__.dvgChunkMap[divergetLabel];

__webpack_chunk_load__(divergent, function() {
    var divergeHtml = require.diverge('./component/component.html', {
        mobile: require('./component/[mobile]component.html'),
        desktop: require('./component/[desktop]component.html')
    }, {concat: true, skipBase: true, strict: true});

    require.diverge('./component/component.css', {
        mobile: require('./component/[mobile]component.css'),
        desktop: require('./component/[desktop]component.css')
    });

    var diverge = require.diverge('./component/component.js', {
        mobile: require('./component/[mobile]component.js'),
        desktop: require('./component/[desktop]component.js')
    });

    document.body.innerHTML = divergeHtml;
    alert(new diverge().whoAreYou());
});
