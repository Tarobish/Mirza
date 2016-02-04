require([
    'require/domReady'
  , 'generated-pages/router'
  , 'ofp/config'
], function(
    domReady
  , router
  , ofpConfig
) {
    "use strict";

    function main () {
        var config = ofpConfig && ofpConfig.generatedPages || {}
         , fonts = config.fonts
                ? Object.keys(config.fonts).map(
                        function(k){return this[k];}
                        , config.fonts)
                : undefined
         ;
        router(config.pages, fonts, config.langs, config.features);
    }

    domReady(main);
});
