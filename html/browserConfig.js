require.config({
    baseUrl: ''
  , paths: {
        'require/domReady': 'bower_components/requirejs-domready/domReady'
      , 'marked': 'bower_components/marked/lib/marked'
      , 'pako': 'bower_components/pako/dist/pako.min'
      , 'urlHosted': 'bower_components/urlHosted/lib'
      , 'ofp': 'bower_components/online-font-project/lib'
      // for the generated-pages tool
      // (which is itself dependant on dom-tool of urlHosted)
      // TODO: make dom-tool a stand-alone project
      , 'dom-tool': 'bower_components/urlHosted/lib/dom-tool'
      , 'generated-pages': 'lib/generated-pages'
      , 'require/text': 'bower_components/text/text'
    }
});
