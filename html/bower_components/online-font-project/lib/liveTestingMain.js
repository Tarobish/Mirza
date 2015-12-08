require([
    'require/domReady'
  , 'ofp/LiveTestingController'
  , 'ofp/config'
], function(
    domReady
  , LiveTestingController
  , ofpConfig
) {
    "use strict";
    /*global document:true*/
    function main () {
        var config = ofpConfig && ofpConfig.liveTesting || {}
          , ctrl = new LiveTestingController(document.body, config)
          ;
    }
    domReady(main);
});
