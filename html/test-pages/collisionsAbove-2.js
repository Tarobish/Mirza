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
      , hasChar = typoStuff.hasChar
      , createElement = domStuff.createElement
      , createFragment = domStuff.createFragment
      , applicableTypes = new Set(['init','medi','fina','isol', '_nocontext_'])
      , first, second, third, axes
      ;

    function filterApplicableTypes(glyph) {
        var type = glyph.getType('_nocontext_');
        return applicableTypes.has(type);
    }

    first = [
            'uni0753.init'
          , 'uni0751.init'
          , 'uni067D.init'
          , 'uni067F.init'
          , 'uni067C.init'
          , 'uni062B.init'
          , 'uni062A.init'
    ].map(Glyph.factory).filter(filterApplicableTypes);
    second = [
          // the uni0XXX.medi_LamAlfFina occur
          // when the uni076A.medi char meets an alef.fina char

          // NOTE: in classes.fea (* is in our list)
          // This is exactly the same group!
          // @aLam.medi_LamAlfFina = [
          //    uni06B5.medi_LamAlfFina*
          //    uni06B7.medi_LamAlfFina*
          //    uni0644.medi_LamAlfFina*
          //    uni06B8.medi_LamAlfFina*
          //    uni06B6.medi_LamAlfFina*
          //    uni076A.medi_LamAlfFina*
          //    ];
            'uni076A.medi'//_LamAlfFina'
          , 'uni06B6.medi'//_LamAlfFina'
          , 'uni06B8.medi'//_LamAlfFina'
          , 'uni0644.medi'//_LamAlfFina'
          , 'uni06B7.medi'//_LamAlfFina'
          , 'uni06B5.medi'//_LamAlfFina'
    ].map(Glyph.factory).filter(filterApplicableTypes);
    third = [
          // these are all glyph required to trigger second
          // this group will be substituted in the same lookup
          // see also lookup LamAlfFina in contextuals fea
          // @aAlf.fina_LamAlfFina = [
          //    uni0625.fina_LamAlfFina
          //    uni0627.fina_LamAlfFina
          //    uni0774.fina_LamAlfFina
          //    uni0773.fina_LamAlfFina
          //    uni0623.fina_LamAlfFina
          //    uni0622.fina_LamAlfFina
          //    uni0675.fina_LamAlfFina
          //    uni0672.fina_LamAlfFina
          //    uni0673.fina_LamAlfFina
          //    uni0671.fina_LamAlfFina
          //    ];
            'uni0625.fina'//_LamAlfFina
          , 'uni0627.fina'//_LamAlfFina
          , 'uni0774.fina'//_LamAlfFina
          , 'uni0773.fina'//_LamAlfFina
          , 'uni0623.fina'//_LamAlfFina
          , 'uni0622.fina'//_LamAlfFina
          , 'uni0675.fina'//_LamAlfFina
          , 'uni0672.fina'//_LamAlfFina
          , 'uni0673.fina'//_LamAlfFina
          , 'uni0671.fina'//_LamAlfFina
    ].map(Glyph.factory).filter(filterApplicableTypes);

    first.name = 'first Glyph';
    second.name = 'second Glyph Lam';
    third.name = 'third Glyph Alef';

    function getData(firstIndex, secondIndex, thirdIndex) {
        /*jshint validthis:true*/
        var glyphs = [this._items[0][firstIndex]
                , this._items[1][secondIndex]
                , this._items[2][thirdIndex]
            ]
          , i,l
          , charString = []
          , content
          , title
          ;

        // firstIndex is all init at the moment
        charString.push(zwnj, glyphs[0].char);
        // secondIndex is all medi at the moment
        charString.push(glyphs[1].char);
        // secondIndex is all fina at the moment
        charString.push(glyphs[2].char, zwnj);

        content = charString.join('');
        title = glyphs.map(function(glyph){ return glyph.name; }).join(' + ');
        return [{dir: 'RTL', title: title}, content];
    }

    axes = new TableData(first, second, third, getData);

    function main() {
        var info = [
              createElement('h1', null, 'Collisions above the baseline')
            , createElement('p', null, 'The first glyph should not collide with the second glyph.')
            , createElement('p', null, 'The combination of medial form second glyph and final form '
                          + 'third glyph triggers this specific shaping of second and third glyph.')
          ]
          , table = new Table(axes, [0, 1, 2]) //[sectionAxis, rowAxis, columnAxis]
          , state = new TableContent(info, table)
          ;
        return state.body;
    }
    return {
        title: 'issue#11-2 (LamAlfFina)'
      , generate: main
    };
});
