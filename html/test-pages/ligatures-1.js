define([
    'dom-tool'
  , 'generated-pages/char-tool'
  , 'generated-pages/Table'
  , 'generated-pages/TableContent'
  , 'generated-pages/TableData'
  , 'require/text!./data/mirza.ligatures-01.json'
], function(
    domStuff
  , typoStuff
  , Table
  , TableContent
  , TableData
  , ligaDataTxt
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
      , filler
      , ligaData = JSON.parse(ligaDataTxt)
      ;

    function filterApplicableTypes(glyph) {
        var type;
        if(glyph.name[0] === '!')
            return false;
        type = glyph.getType('_nocontext_');
        return applicableTypes.has(type);
    }

    filler = [undefined];
    filler.hasLabel = false;

    function getData (firstIndex, secondIndex, thirdIndex) {
        /*jshint validthis: true*/
        var firstGlyph = this._items[0][firstIndex]
          , secondGlyph = this._items[1][secondIndex]
          , thirdGlyph = this._items[2] !== filler
                            ? this._items[2][thirdIndex]
                            : undefined
          , first
          , second
          , third
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


        if(!thirdGlyph) {
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
        }
        else
            second = [secondGlyph.char];

        content = first.concat(second);
        title = [firstGlyph.name, secondGlyph.name];


        if(thirdGlyph) {
            switch(thirdGlyph.getType('_nocontext_')) {
                case 'medi':
                    third = [thirdGlyph.char, zwj, zwnj];
                    break;
                case 'fina':
                    third = [thirdGlyph.char, zwnj];
                    break;
                case '_nocontext_':
                    /* falls through */
                default:
                    third = [thirdGlyph.char, zwnj];
            }
            Array.prototype.push(content, third);
            Array.prototype.push(title, thirdGlyph.name);
        }

        return [
            {
                dir: 'RTL'
              , title: title.join(' + ')
            }
          , content.join('')
        ];
    }

    function buildTable(data) {
        var axes, first, second, third = filler, infoMD;

        first = data.groups[0].map(Glyph.factory).filter(filterApplicableTypes);
        first.name = 'first Glyph';

        second = data.groups[1].map(Glyph.factory).filter(filterApplicableTypes);
        second.name = 'second Glyph';

        if(data.groups[2]) {
            third = data.groups[2].map(Glyph.factory).filter(filterApplicableTypes);
            third.name = 'third Glyph';
        }
        axes = new TableData(first, second, third, getData);

        infoMD = '### ' + data.info + '\n\n' + data.description;

        return new Table(axes, [2, 0, 1], infoMD);//[sectionAxis, rowAxis, columnAxis]
    }

    function main() {
        var info = [
                createElement('h1', null, 'Collisions above the baseline')
              , createElement('p', null, 'The glyphs should not collide.')
            ]
          , tables = ligaData.map(buildTable)
          , state = new TableContent(info, tables)
          ;
        return state.body;
    }
    return {
        title: 'Ligatures 1'
      , generate: main
    };
});
