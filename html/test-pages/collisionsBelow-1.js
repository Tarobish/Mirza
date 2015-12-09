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
      , makeTable = domStuff.makeTable
      , makeTableHead = domStuff.makeTableHead
      , applicableTypes = new Set(['init','medi','fina','isol', '_nocontext_'])
      , first, second, filler, axes
      ;

    function filterApplicableTypes(glyph) {
        var type = glyph.getType('_nocontext_');
        return applicableTypes.has(type);
    }

    first = [
        'uni0680.init'
      , 'uni0776.init'
      , 'uni06CE.init'
      , 'uni0775.init'
      , 'uni06BD.init'
      , 'uni064A.init'
      , 'uni067E.init'
      , 'uni0753.init'
      , 'uni0752.init'
      , 'uni063D.init'
      , 'uni0754.init'
      , 'uni06D1.init'
      , 'uni06CC.init'
      , 'uni0767.init'
      , 'uni0680.medi'
      , 'uni0776.medi'
      , 'uni0750.medi'
      , 'uni06CE.medi'
      , 'uni0775.medi'
      , 'uni06BD.medi'
      , 'uni064A.medi'
      , 'uni067E.medi'
      , 'uni0753.medi'
      , 'uni0752.medi'
      , 'uni063D.medi'
      , 'uni0754.medi'
      , 'uni06D1.medi'
      , 'uni06CC.medi'
      , 'uni0767.medi'
      , 'uni0680.init_High'
      , 'uni0776.init_High'
      , 'uni0750.init_High'
      , 'uni06CE.init_High'
      , 'uni0775.init_High'
      , 'uni06BD.init_High'
      , 'uni064A.init_High'
      , 'uni067E.init_High'
      , 'uni0753.init_High'
      , 'uni0752.init_High'
      , 'uni063D.init_High'
      , 'uni0754.init_High'
      , 'uni06D1.init_High'
      , 'uni06CC.init_High'
      , 'uni0767.init_High'
      , 'uni0680.medi_High'
      , 'uni0776.medi_High'
      , 'uni0750.medi_High'
      , 'uni06CE.medi_High'
      , 'uni0775.medi_High'
      , 'uni06BD.medi_High'
      , 'uni064A.medi_High'
      , 'uni067E.medi_High'
      , 'uni0753.medi_High'
      , 'uni0752.medi_High'
      , 'uni063D.medi_High'
      , 'uni0754.medi_High'
      , 'uni06D1.medi_High'
      , 'uni06CC.medi_High'
      , 'uni0767.medi_High'
      , 'uni064A.init_BaaYaaIsol'
      , 'u1EE29'
    ].map(Glyph.factory).filter(filterApplicableTypes);
    second = [
        'uni0647.medi'
      , 'uni06C1.medi'
      , 'uni0777.fina'
      , 'uni06D1.fina'
      , 'uni0775.fina'
      , 'uni063F.fina'
      , 'uni0678.fina'
      , 'uni063D.fina'
      , 'uni063E.fina'
      , 'uni06D0.fina'
      , 'uni0649.fina'
      , 'uni0776.fina'
      , 'uni06CD.fina'
      , 'uni06CC.fina'
      , 'uni0626.fina'
      , 'uni0620.fina'
      , 'uni064A.fina'
      , 'uni06CE.fina'
      , 'uni077B.fina'
      , 'uni077A.fina'
      , 'uni06D2.fina'
      , 'uni06FF.medi'
      , 'uni077B.fina_PostToothFina'
      , 'uni077A.fina_PostToothFina'
      , 'uni06D2.fina_PostToothFina'
      , 'uni0625.fina'
      , 'uni0673.fina'
    ].map(Glyph.factory).filter(filterApplicableTypes);

    filler = [undefined];
    filler.hasLabel = false;
    first.name = 'first Glyph';
    second.name = 'second Glyph';

    function getData(firstIndex, secondIndex, fillerIndex) {
        /*jshint validthis:true*/
        var firstGlyph = this._items[0][firstIndex]
          , secondGlyph = this._items[1][secondIndex]
          , first
          , second
          , content
          , title
          ;
        switch(firstGlyph.getType('_nocontext_')) {
            case 'init':
                first = [zwnj, firstGlyph.char];
                break;
            case 'medi':
                first = [zwnj, zwj, firstGlyph.char];
                break;
            case '_nocontext_':
                /* falls through */
            default:
                first = [zwnj, firstGlyph.char];
                break;
        }
        switch(secondGlyph.getType('_nocontext_')) {
            case 'medi':
                second = [secondGlyph.char, zwj, zwnj];
                break;
            case 'fina':
                second = [secondGlyph.char, zwnj];
                break;
            case '_nocontext_':
                /* falls through */
            default:
                second = [secondGlyph.char, zwnj];
        }

        content = first.concat(second).join('');
        title = [firstGlyph.name, secondGlyph.name].join(' + ');
        return [{dir: 'RTL', title: title}, content];
    }

    axes = new TableData(first, second, filler, getData);

    function main() {
        var info = [
                createElement('h1', null, 'Collisions below the baseline')
              , createElement('p', null, 'The glyphs should not collide.')
            ]
          , table = new Table(axes, [2, 0, 1]) //[sectionAxis, rowAxis, columnAxis]
          , state = new TableContent(info, table)
          ;
        return state.body;
    }
    return {
        title: 'issue#6-1'
      , generate: main
    };
});
