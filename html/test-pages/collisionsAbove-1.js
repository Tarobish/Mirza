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
) {
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
      , appendChildren = domStuff.appendChildren
      , applicableTypes = new Set(['init','medi','fina','isol', '_nocontext_'])
      , first, second, filler, axes
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

        //    'aAlf.fina'
            'uni0625.fina'
          , 'uni0627.fina'
          , 'uni0774.fina'
          , 'uni0773.fina'
          , 'uni0623.fina'
          , 'uni0622.fina'
          , 'uni0675.fina'
          , 'uni0672.fina'
          , 'uni0673.fina'
          , 'uni0671.fina'
    ].map(Glyph.factory).filter(filterApplicableTypes);

    filler = [undefined];
    filler.hasLabel = false;
    first.name = 'first Glyph';
    second.name = 'second Glyph';

    function getData (firstIndex, secondIndex, fillerIndex) {
        /*jshint validthis: true*/
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
                createElement('h1', null, 'Collisions above the baseline')
              , createElement('p', null, 'The glyphs should not collide.')
            ]
          , table = new Table(axes, [2, 0, 1]) //[sectionAxis, rowAxis, columnAxis]
          , state = new TableContent(info, table)
          ;
        return state.body;
    }
    return {
        title: 'issue#11'
      , generate: main
    };
});
