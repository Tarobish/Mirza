define([
    'dom-tool'
], function(
    domStuff
){
    "use strict";

    var createElement = domStuff.createElement
      , appendChildren = domStuff.appendChildren
      ;

    function TableContent(infoSection, tables) {
        this.body = createElement('article', null, infoSection);
        this.tables = tables instanceof Array ? tables : [tables];
        this.tableElements = this.tables.map(renderTable.bind(null, 'default'));

        this.modeSwitchElement = createModeSwitch(this.updateTableModeHandler.bind(this));
        this.body.appendChild(
            createElement('label', {title: 'compare with Amiri Bold'}
                            , ['compare: ', this.modeSwitchElement])
        );
        appendChildren(this.body, this.tableElements);
    }
    var _p = TableContent.prototype;

    function createModeSwitch (fun) {
        var options = {
                'none': 'default'
              , 'per Column': 'doubleColumns'
              , 'per Row': 'doubleRows'
            }
          , k
          , select = createElement('select')
          ;
        for(k in options)
            select.add(createElement('option', {value:options[k]}, k));
        select.options[0].selected = true;
        select.addEventListener('change', fun, false);
        return select;
    }

    function renderTable(mode, table) {
        var hasSectionLabel = true
          , hasRowLabel = true
          , hasColumnLabel = true
          ;
        return createElement('div', null,
            table.render(mode, hasSectionLabel, hasRowLabel, hasColumnLabel));
    }

    _p.updateTableMode = function(mode) {
        var newTables =  this.tables.map(renderTable.bind(null, mode))
          , i, l
          ;
        for(i=0,l=newTables.length;i<l;i++)
            this.body.replaceChild(newTables[i], this.tableElements[i]);
        this.tableElements = newTables;
    };
    _p.updateTableModeHandler = function(event) {
        var select = this.modeSwitchElement
        , value = select.options[select.selectedIndex].value
        ;
        this.updateTableMode(value);
    };

    return TableContent;
});
