define([
    'dom-tool'
  , 'require/text!../../../Document-Sources/Quran.txt'
], function(domStuff, text) {
    var fromHTML = domStuff.createElementfromHTML;
    return {
        title: 'Testing Quran'
      , generate: fromHTML.bind(null, 'article', {dir: 'RTL', 'class': 'testcontent'}
            , '<p>%content%</p>'.replace('%content%', text.split('\n').join('</p><p>')))
    };
});
