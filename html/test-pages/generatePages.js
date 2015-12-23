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
      , filler
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
                first = [' ', firstGlyph.char];
                break;
            case 'medi':
                first = [' ', zwj, firstGlyph.char];
                break;
            case '_nocontext_':
                /* falls through */
            default:
                first = [' ', firstGlyph.char];
                break;
        }


        if(!thirdGlyph) {
            switch(secondGlyph.getType('_nocontext_')) {
                case 'medi':
                    second = [secondGlyph.char, zwj, ' '];
                    break;
                case 'fina':
                    second = [secondGlyph.char, ' '];
                    break;
                case '_nocontext_':
                    /* falls through */
                default:
                    second = [secondGlyph.char, ' '];
            }
        }
        else
            second = [secondGlyph.char];

        content = first.concat(second);
        title = [firstGlyph.name, secondGlyph.name];


        if(thirdGlyph) {
            switch(thirdGlyph.getType('_nocontext_')) {
                case 'medi':
                    third = [thirdGlyph.char, zwj, ' '];
                    break;
                case 'fina':
                    third = [thirdGlyph.char, ' '];
                    break;
                case '_nocontext_':
                    /* falls through */
                default:
                    third = [thirdGlyph.char, zwnj];
            }
            Array.prototype.push.apply(content, third);
            title.push(thirdGlyph.name);
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
        var n = 2,k;
        do {
            if(k) {
                infoMD += '\n\n' + data[k];
                n += 1;
            }
            k = 'description' + n;
        } while(k in data);
        if('description2')

        return new Table(axes, data.layout || [2, 0, 1]/* 0, 1, 2 */, infoMD);//[sectionAxis, rowAxis, columnAxis]
    }

    function main(data) {
        var info = []
          , data_ = (data instanceof Array) ? data : [data]
          , tables = data_.map(buildTable)
          , state = new TableContent(info, tables)
          ;
        return state.body;
    }


    function fromArray(data) {
        var i, l, pageData = {}, item, title;

        for(i=0,l=data.length;i<l;i++) {
            item = data[i];
            if('title' in item)
                title = item.title;
            else if('info' in item)
                title = item.info;
            else
                title = 'Item ' + i;

            pageData[title] = {
                title: title
              , generate: main.bind(null, data[i])
            }
        };
        return pageData;
    }
    return {
        fromArray: fromArray
      , main: main
    };
});
