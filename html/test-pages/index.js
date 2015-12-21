define([
    'dom-tool'
  , 'require/text!../../README.md'
  , './collisionsBelow-1'
  , './collisionsBelow-2'
  , './collisionsAbove-1'
  , './collisionsAbove-2'
  , './collisionsAbove-3'
  , './KafLamAlf-1'
  , './KafLamAlf-2'
  , './data/marks1'
  , './data/quran'
  , './generatePages'
  , 'require/text!./data/mirza.ligatures-01.json'
], function(
    domStuff
  , README
  , collisionsBelow1
  , collisionsBelow2
  , collisionsAbove1
  , collisionsAbove2
  , collisionsAbove3
  , kafLamAlf1
  , kafLamAlf2
  , marksText1
  , quranText
  , generatePages
  , testDataTxt
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
      , texts: {
            title: 'Test-Texts'
          , '/': {
                marks1: marksText1
              , quran: quranText
            }
        }
      , tests: {
            title: 'Generated Tests'
            , '/': generatePages.fromArray( JSON.parse(testDataTxt)/*.reverse()*/)
        }
      , jomhuriaTests: {
            title: 'Generated Tests (Jomhuria)'
          , '/': {
                'collision-below-1': collisionsBelow1
              , 'collision-below-2': collisionsBelow2
              , 'collision-above-1': collisionsAbove1
              , 'collision-above-2': collisionsAbove2
              , 'collision-above-3': collisionsAbove3
              , 'kaf-lam-alf-1': kafLamAlf1
              , 'kaf-lam-alf-2': kafLamAlf2
            }
        }

    };
});
