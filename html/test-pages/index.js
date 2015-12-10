define([
    'dom-tool'
  , 'require/text!../../README.md'
  , './collisionsBelow-1'
  , './collisionsBelow-2'
  , './collisionsAbove-1'
  , './collisionsAbove-2'
  , './collisionsAbove-3'
  , './data/marks1'
  , './ligatures-1'

], function(
    domStuff
  , README
  , collisionsBelow1
  , collisionsBelow2
  , collisionsAbove1
  , collisionsAbove2
  , collisionsAbove3
  , marksText1
  , ligatures1
){
    "use strict";
    /*global document:true window:true*/

    var createElement = domStuff.createElement
      , fromHTML = domStuff.createElementfromHTML
      , fromMarkdown = domStuff.createElementfromMarkdown
      ;

    return {
        '../index.html': {
            title: 'home'
        }
      , index: {
            title: 'About'
          , generate: fromMarkdown.bind(null, 'article', {'class': 'home'}, README)
        }

      , tests: {
            title: 'Generated Tests'
            , '/': {
                'ligatures1': ligatures1
            }
        }
      , jomhuriaTests: {
            title: 'Generated Tests (Jomhuria)'
          , '/': {
                'collision-below-1': collisionsBelow1
              , 'collision-below-2': collisionsBelow2
              , 'collision-above-1': collisionsAbove1
              , 'collision-above-2': collisionsAbove2
              , 'collision-above-3': collisionsAbove3
            }
        }
      , texts: {
            title: 'Test-Texts'
          , '/': {
                marks1: marksText1
            }
        }
    };
});
