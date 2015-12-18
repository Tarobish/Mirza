define([
    'dom-tool'
  , 'generated-pages/char-tool'
  , 'generated-pages/Table'
  , 'generated-pages/TableContent'
  , 'generated-pages/TableData'
], function(
    domStuff
  , typoStuff
  , Table
  , TableContent
  , TableData
){
    "use strict";
    /*global document:true*/

    var Glyph = typoStuff.Glyph
      , zwj = typoStuff.zwj
      , zwnj = typoStuff.zwnj
      , nbsp = typoStuff.nbsp
      , dottedCircle = typoStuff.dottedCircle
      , createElement = domStuff.createElement
      , createFragment = domStuff.createFragment
      , first, second, third, axes
      , otClasses = {
            // it's funny: all these classes have length % 4 === 2
            'aKaf.init':('uni063B.init uni063C.init uni077F.init uni0764.init '
                       + 'uni0643.init uni06B0.init uni06B3.init uni06B2.init '
                       + 'uni06AB.init uni06AC.init uni06AD.init uni06AE.init '
                       + 'uni06AF.init uni06A9.init uni06B4.init uni0763.init '
                       + 'uni0762.init uni06B1.init').split(' ')
          , 'aKaf.medi':('uni063B.medi uni063C.medi uni077F.medi uni0764.medi '
                       + 'uni0643.medi uni06B0.medi uni06B3.medi uni06B2.medi '
                       + 'uni06AB.medi uni06AC.medi uni06AD.medi uni06AE.medi '
                       + 'uni06AF.medi uni06A9.medi uni06B4.medi uni0763.medi '
                       + 'uni0762.medi uni06B1.medi').split(' ')
          , 'aLam.medi':('uni06B5.medi uni06B7.medi uni0644.medi uni06B8.medi '
                       + 'uni06B6.medi uni076A.medi').split(' ')
          , 'aLam.fina':('uni06B5.fina uni06B7.fina uni0644.fina uni06B8.fina '
                       + 'uni06B6.fina uni076A.fina').split(' ')
          , 'aAlf.fina':('uni0625.fina uni0627.fina uni0774.fina uni0773.fina '
                       + 'uni0623.fina uni0622.fina uni0675.fina uni0672.fina '
                       + 'uni0673.fina uni0671.fina').split(' ')
          , 'aKaf.fina':('uni077F.fina uni0643.fina uni06AB.fina uni06AC.fina '
                       + 'uni06AD.fina uni06AE.fina').split(' ')
        }
      ;


    first = [].concat(
            otClasses['aKaf.init']
          , otClasses['aKaf.medi']
        ).map(Glyph.factory);
    second = [].concat(
            otClasses['aLam.medi']
          , otClasses['aLam.fina']
          , otClasses['aAlf.fina']
          , otClasses['aKaf.fina']
        ).map(Glyph.factory);
    // filler
    third = [undefined];
    third.hasLabel = false;

    first.name = 'first glyph @aKaf.init + @aKaf.medi';
    second.name = 'second glyph @aLam.medi + @aLam.fina + @aAlf.fina + @aKaf.fina';

    function getData(firstIndex, secondIndex, thirdIndex) {
        /*jshint validthis:true*/
        var glyphs = [this._items[0][firstIndex]
                , this._items[1][secondIndex]
            ]
          , i,l
          , charString = []
          , content
          , title
          ;

        // firstIndex
        charString.push(glyphs[0].mainType === 'medi' ? zwj : zwnj, glyphs[0].char);
        // secondIndex
        charString.push(glyphs[1].char, glyphs[1].mainType === 'medi' ?  zwj : '');

        content = charString.join('');
        title = glyphs.map(function(glyph){ return glyph.name; }).join(' + ');
        return [{dir: 'RTL', title: title}, content];
    }

    axes = new TableData(first, second, third, getData);

    function main() {
        /*jshint multistr:true*/
        var info = [
              createElement('h1', null, 'The Combination Kaf-Lam-Alf has special substitutions')
            , createElement('p', null, 'This is to test:')
            , createElement('pre', null, 'sub [@aKaf.init @aKaf.medi]\' lookup KafLam\n\
      [@aLam.medi @aLam.fina @aAlf.fina @aKaf.fina]\' lookup KafLam;')
          ]
          , table = new Table(axes, [2, 0, 1]) //[sectionAxis, rowAxis, columnAxis]
          , state = new TableContent(info, table)
          ;
        return state.body;
    }

    return {
        title: 'issue#7-1'
      , generate: main
    };
});
