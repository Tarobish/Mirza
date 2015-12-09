define([
    'dom-tool'
  , './char-tool'
],
function(
    domStuff
  , typoStuff
) {
    "use strict";

    var createElement = domStuff.createElement
      , createFragment = domStuff.createFragment
      , nbsp = typoStuff.nbsp
      , zwj = typoStuff.zwj
      , zwnj = typoStuff.zwnj
      , dottedCircle = typoStuff.dottedCircle
      ;
    function TableData(firstAxis, secondAxis, thirdAxis, getData) {
        this._items = [firstAxis, secondAxis, thirdAxis];
        this._getData = getData;
    }

    var _p = TableData.prototype;

    _p.len = function(axisIndex) {
        return this._items[axisIndex].length;
    };

    _p.hasLabel= function (axisIndex) {
        var axis = this._items[axisIndex];
        return 'hasLabel' in axis ? !!axis.hasLabel : true;
    };

    _p.getData= function (firstIndex, secondIndex, fillerIndex) {
        if(this._getData)
            return this._getData.apply(this, arguments);
        throw new Error(' Not implemented "getData". You must inject it in the constructor.');
    };
        /**
         * `type`, string: one of 'section', 'row', 'column'
         */
    _p.getLabel= function (axisIndex, itemIndex, type) {
        var axis = this._items[axisIndex]
          , item = axis[itemIndex]
          , axisName = axis.name
          , attr = {dir: 'LTR'}
          , content, str, char
          ;
        attr.title = axisName + ': '+ item.name;
        if(axis.isMark)
            str = [dottedCircle, item.char, nbsp];
        else switch(item.type) {
            case 'init':
                str = [nbsp, zwnj, item.char, zwj, nbsp];
                break;
            case 'medi':
                str = [nbsp, zwj, item.char, zwj, nbsp];
                break;
            case 'fina':
                str = [nbsp, zwj, item.char, zwnj, nbsp];
                break;
            default:
                str = [nbsp, zwnj, item.char, zwnj, nbsp];
        }
        char = createElement('span', {dir: 'RTL'},  str.join(''));
        switch (type) {
            case 'column':
                // very short label
                content = char;
                break;
            // long labels
            case 'section':
                content = axisName + ': ';
                /* falls through */
            case 'row':
                /* falls through */
            default:
                content = (content && [content] || []).concat(item.name, char);
            break;
        }
        return [attr, createFragment(content)];
    };

    return TableData;
});
