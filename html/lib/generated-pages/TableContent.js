define([
    'dom-tool'
], function(
    domStuff
){
    "use strict";

    var createElement = domStuff.createElement
      , appendChildren = domStuff.appendChildren
      ;

    function TableContent(infoSection, table) {
        this.body = createElement('article', null, infoSection);
        this.table = table;
        this.tableElement = renderTable(table, 'default');

        this.modeSwitchElement = createModeSwitch(this.updateTableModeHandler.bind(this));
        appendChildren(this.body, [
            createElement('label', {title: 'compare with Amiri Bold'}
                            , ['compare: ', this.modeSwitchElement])
            , this.tableElement
        ]);
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

    function renderTable(table, mode) {
        var hasSectionLabel = true
          , hasRowLabel = true
          , hasColumnLabel = true
          ;
        return createElement('table', {dir: 'RTL', 'class': 'testcontent'},
            table.render(mode, hasSectionLabel, hasRowLabel, hasColumnLabel));
    }

    _p.updateTableMode = function(mode) {
        var newTable = renderTable(this.table, mode);
        this.body.replaceChild(newTable, this.tableElement);
        this.tableElement = newTable;
    };
    _p.updateTableModeHandler = function(event) {
        var select = this.modeSwitchElement
        , value = select.options[select.selectedIndex].value
        ;
        this.updateTableMode(value);
    };

    return TableContent;
});
