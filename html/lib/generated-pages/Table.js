/*jshint laxcomma:true */

define([
    'dom-tool'
  , './char-tool'
], function(
    domStuff
  , typoStuff
){
    "use strict";
    /*global document:true*/

    var createElement = domStuff.createElement
      , createFragment = domStuff.createFragment
      , appendChildren = domStuff.appendChildren
      , appendMarkdown = domStuff.appendMarkdown
      // sub-modules defined in here
      , _Container, Parent, Section, Row
      ;


    _Container = Parent = (function() {
        /*jshint validthis: true*/
        function _Container(){
            this._reset();
        }
        var _p = _Container.prototype;
        _p.constructor = _Container;

        _p._reset = function(){
            this._items = new Map();
        };

        _p.set = function(index, item) {
            this._items.set(index, item);
        };

        _p.get = function(index) {
            return this._items.get(index);
        };

        return _Container;
    })();

    Row = (function(Parent) {
        function Row() {
            Parent.call(this);
        }
        var _p = Row.prototype = Object.create(Parent.prototype);
        _p.constructor = Row;

        _p.render = function(mode, rowLabel) {
            var items = this._items
              , i, l, item
              , rowA = []
              , rowB
              , doubleRows = mode === 'doubleRows'
              , doubleColumns = mode === 'doubleColumns'
              , rowLabelHeight = doubleRows ? 2 : 1
              , duplicationRow
              , result = []
              , labelAttr
              , duplicateElement
              , duplicateClasses = ['compare', 'duplicated']
              ;
            if(doubleRows) {
                rowB = [];
                duplicationRow = rowB;
            }
            else if(doubleColumns)
                duplicationRow = rowA;

            if(rowLabel) {
                labelAttr = Object.create(rowLabel[0]);
                labelAttr.rowspan = rowLabelHeight;
                rowA.push(createElement('th', labelAttr, rowLabel[1], true));

            }
            items.forEach(function(item,i) {
                rowA.push(this._renderData(item));
                if(duplicationRow) {
                    duplicateElement = this._renderData(item);
                    duplicateElement.classList.add.apply(duplicateElement.classList, duplicateClasses);
                    duplicationRow.push(duplicateElement);
                }
            }.bind(this));
            //for(i=0,l=items.length;i<l;i++) {
            //    item = items[i];
            //    rowA.push(this._renderData(item));
            //    if(duplicationRow) {
            //        duplicateElement = this._renderData(item);
            //        duplicateElement.classList.add.apply(duplicateElement.classList, duplicateClasses);
            //        duplicationRow.push(duplicateElement);
            //    }
            //}

            result.push(createElement('tr', null, rowA));
            if(doubleRows)
                result.push(createElement('tr', null, rowB));
            return createFragment(result);
        };

        _p._renderData = function(data) {
            return createElement('td', data[0], data[1], true);
        };
        return Row;
    })(_Container);

    Section = (function(Parent) {
        function Section() {
            Parent.call(this);
        }
        var _p = Section.prototype = Object.create(Parent.prototype);
        _p.constructor = Section;

        _p.renderHead = function(sectionLabel, columnLabelsData, colLabelWidth, hasRowLabel) {
            var head = []
              , label
              , columnLabels, columnLabel
              , attr
              , i,l
              ;
            if(sectionLabel) {
                attr = Object.create(sectionLabel[0]);
                // colspan="0" => it extends to the end of the table
                // but it doesn't int chrome, thus we use a very big number
                // as a workaround. MDN  says 1000 is the max
                attr.colspan = 1000;
                label = createElement('tr', null,
                        createElement('th', attr , sectionLabel[1], true)
                );
                head.push(label);
            }

            if(columnLabelsData) {
                columnLabels = [];
                if(hasRowLabel)
                    // intentionally empty
                    columnLabels.push(createElement('th'));
                for(i=0,l=columnLabelsData.length;i<l;i++) {
                    columnLabel = columnLabelsData[i];
                    attr = Object.create(columnLabel[0]);
                    attr.colspan = colLabelWidth;
                    columnLabels.push(createElement('th', attr, columnLabel[1], true));

                }
                head.push(createElement('tr', null, columnLabels));
            }
            return createFragment(head);
        };

        _p.renderBody = function(mode, rowLabels) {
            var body = [], i,l, rows = this._items;

            rows.forEach(function(value, i) {
                body.push(value.render(mode, rowLabels && rowLabels[i]));
            });

            //for(i=0,l=rows.length;i<l;i++)
            //    body.push(rows[i].render(mode, rowLabels && rowLabels[i]));
            return createFragment(body);
        };


        return Section;
    })(_Container);

    /**
     * TODO: describe the axes object, maybe an interface class would be good.
     * see setLayout for a description of the `layout` argument
     */
    function Table(axes, layout, info) {
        Parent.call(this);
        this._iitems = [];

        this._axes = axes;

        this._sectionLabels = null;
        this._rowLabels = null;
        this._columnLabels = null;
        this._layout = null;
        this._info = info;

        this.setLayout(layout);
    }
    var _p = Table.prototype = Object.create(Parent.prototype);
    _p.constructor = Table;

    /**
     * `layout`, Array [sectionAxisIndex, rowAxisIndex, columnAxisIndex]:
     *          is used to map the axes to sections, rows and columns.
     * Its contents are always the three axis-indexes 0, 1 and 2.
     * The order can differ and will change how the table is layouted.
     * The first item defines the axis used for the "Sections".
     * The second item defines the axis used for the rows.
     * The third item defines the axis used for the columns.
     * example:
     *     var sectionAxis = 2
     *       , rowAxis = 0
     *       , columnsAxis = 1
     *       , layout = [sectionAxis, rowAxis, columnAxis]
     *       ;
     *     table.setLayout(layout)
     * default: [0, 1, 2]
     *
     * `force`, Boolean:
     *          changing layout causes all the state-data of
     * the table to be recalculated. Thus, this can take a moment for
     * big tables. When *false* the state-data is only recalculated
     * if it differs from the previous layout. When *true* the
     * state-data is recalculated in any case.
     * default: false
     *
     * returns *false* if state-data was not recalculated otherwise *true*
     */
    _p.setLayout = function (layout, force) {
        var _default = [0, 1, 2]
          , _layout = layout || _default
          , allowed
          ;
        if(!force && '' + this._layout === '' + _layout)
            return false;

        allowed = new Set();
        _default.forEach(allowed.add, allowed);
        if(!layout.length
                || layout.length !== 3
                || layout.filter(function(item) {
                        /*jshint validthis: true*/
                        var valid = allowed.has(item) && !this.has(item);
                        this.add(item);
                        return valid;
                    }, new Set()).length  !== 3)
            throw new Error('`layout` must contain three items, one of each: [0, 1, 2] '
                + 'but is is: [' + layout.join(', ') + ']');




        this._layout = layout;
        this._updateLayout();
        return true;
    };

    _p._updateLayout = function() {
        // section = x
        // row = y
        // column = z
        var x2axis = this._layout[0]
          , y2axis = this._layout[1]
          , z2axis = this._layout[2]
          , axes = this._axes
          , xsLen = axes.len(x2axis)
          , ysLen = axes.len(y2axis)
          , zsLen = axes.len(z2axis)
          , args
          , x, y, z
          , data
          , hasXLabels = axes.hasLabel(x2axis)
          , hasYLabels = axes.hasLabel(y2axis)
          , hasZLabels = axes.hasLabel(z2axis)
          ;
        // unset all data
        this._sectionLabels = null;
        this._rowLabels = null;
        this._columnLabels = null;
        this._reset();

        // set all data
        for(x=0; x<xsLen; x++) {
            args = [];
            args[x2axis] = x;
            if(hasXLabels)
                this._setSectionLabel(x, axes.getLabel(x2axis, x, 'section'));
            for(y=0;y<ysLen;y++) {
                args[y2axis] = y;
                if(hasYLabels && x === 0) // do this only once for each row
                    this._setRowLabel(y, axes.getLabel(y2axis, y, 'row'));
                for(z=0;z<zsLen;z++) {
                    args[z2axis] = z;
                    if(hasZLabels && x === 0 && y === 0)// do this only once for each column
                        this._setColumnLabel(z, axes.getLabel(z2axis, z, 'column'));
                    data = axes.getData(args[0], args[1], args[2]);
                    this._setData(x,y,z, data);
                }
            }
        }
    };

    _p._setData = function(x,y,z, data) {
        // console.log(x,y,z, data, this.constructor.name, this._items.constructor);
        var section = this.get(x)
          , row
          ;
        //// section may never be an array!
        //if(section instanceof Array) {
        //    console.log(JSON.stringify(this._items))
        //    console.log(this)
        //    console.log('!',this.get(x), this._items[0], this.get, data)
        //}


        if(!section) {
            section = new Section();
            this.set(x, section);
        }
        row = section.get(y);
        if(!row) {
            row = new Row();
            section.set(y, row);
        }
        row.set(z, data);
    };

    _p._setSectionLabel = function(index, data) {
        if(this._sectionLabels === null)
            this._sectionLabels = [];
        this._sectionLabels[index] = data;
    };
    _p._setRowLabel = function(index, data) {
        if(this._rowLabels === null)
            this._rowLabels = [];
        this._rowLabels[index] = data;
    };
    _p._setColumnLabel = function(index, data) {
        if(this._columnLabels === null)
            this._columnLabels = [];
        this._columnLabels[index] = data;
    };

    _p.render = function(mode, showSectionLabel, showRowLabel, showColumnLabel) {
        // mode is either "doubleColumns" or "doubleRows" or it defaults (to "default")

        var modes = new Set(['doubleColumns', 'doubleRows'])
          , _mode = modes.has(mode) ? mode : 'default'
          , colLabelWidth = (_mode === 'doubleColumns' ? 2 : 1)
          , rowLabelHeight = (_mode === 'doubleRows' ? 2 : 1)
          , container = createElement('div')
          , table = createElement('table', {dir: 'RTL', 'class': 'testcontent'})
          , i, l
          , sections = this._items
          , columnLabels = showColumnLabel && this._columnLabels
          , hasSectionLabels = showSectionLabel && !!this._sectionLabels
          , rowLabels = showRowLabel && this._rowLabels
          , hasRowLabels = !!rowLabels
          , info
          ;
        // sections are a Map
        sections.forEach(function(value, i) {
            appendChildren(table, [
                    value.renderHead(
                            hasSectionLabels && this._sectionLabels[i]
                          , columnLabels
                          , colLabelWidth
                          , hasRowLabels
                    )
                  , value.renderBody(_mode, rowLabels)
            ]);

        }.bind(this));
        //for(i=0,l=sections.length;i<l;i++) {
        //    appendChildren(table, [
        //            sections[i].renderHead(
        //                    hasSectionLabels && this._sectionLabels[i]
        //                  , columnLabels
        //                  , colLabelWidth
        //                  , hasRowLabels
        //            )
        //          , sections[i].renderBody(_mode, rowLabels)
        //    ]);
        //}

        if(this._info)
            appendMarkdown(container, this._info);
        container.appendChild(table);
        return container;
    };

    return Table;
});
