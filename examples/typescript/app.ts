
let divergetLabel = "mobile";
if (location.search.indexOf("divergent=desktop") > 0)
    divergetLabel = "desktop"

let divergent = __webpack_divergent_labels__[divergetLabel];

__webpack_chunk_load__(divergent, function() {
    var divergeHtml = <string>require.diverge('./component/component.html', {
        mobile: require('./component/[mobile]component.html'),
        desktop: require('./component/[desktop]component.html')
    }, {concat: true, skipBase: true, strict: true});

    require.diverge('./component/component.css', {
        mobile: require('./component/[mobile]component.css'),
        desktop: require('./component/[desktop]component.css')
    });

    let diverge:any = require.diverge('./component/component.ts', {
        mobile: require('./component/[mobile]component.ts'),
        desktop: require('./component/[desktop]component.ts')
    });

    document.body.innerHTML = divergeHtml;
    alert(new diverge().whoAreYou());
});
