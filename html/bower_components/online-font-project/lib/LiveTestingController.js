define([
    'urlHosted/BaseController'
  , 'urlHosted/dom-tool'
], function(
    Parent
  , dom
) {
    "use strict";
    var createElement = dom.createElement
      , createElementfromMarkdown = dom.createElementfromMarkdown
      ;

    var defaults = {
        // you have to set up the css yourself
        // NOTE: the key will be stored in the URL, so make sure that it
        // can stay forever the way you define it and that keeps its meaning ...
        // The CSS class can change (or how font's are actually configured
        // and activated)
        fonts: {key: 'css-class-to-activate'}
      , controlsTemplate: '<h3 class="app-title">Live Font Testing</h3> {edit} {generate} {shareBox}'
      , documentTitleFallback: 'Live Font Testing'
      , displayTemplate: '<header dir="LTR" lang="en">'
                        + '<div class="date"><em>generated on</em> {date}</div>'
                        + '</header>{content}'
      , inputTemplate:  '<label><span>Font </span>{font}</label>'
                      + '<label><span>Text Direction </span>{textDir}</label>'
                      + '<label><span>Language </span>{lang}</label>'
                      + '<label><span>EM Size </span>{emSize}</label>'
                      + '<label>{content}</label>'
                      + ' {done}'
    };

    function LiveTestingController(hostElement, config) {
        Parent.call(this, hostElement, Parent.makeConfig(config, defaults));
    }

    var _p = LiveTestingController.prototype = Object.create(Parent.prototype);
    _p.constructor = LiveTestingController;

    _p._createInputs = function() {
        var fonts = []
          , textDirs = [
                createElement('option', {value: 'ltr'}, 'left to right')
              , createElement('option', {value: 'rtl'}, 'right to left')
            ]
          , emSizes = [
                createElement('option', null, '12pt')
              , createElement('option', null, '16pt')
              , createElement('option', null, '20pt')
              , createElement('option', null, '24pt')
              , createElement('option', null, '48pt')
              , createElement('option', null, '72pt')
          ]
          , k
          ;

        for(k in this._config.fonts)
            fonts.push(createElement('option', {value: k}
                                                , this._config.fonts[k]));

        return {
            font: createElement('select', {'class': 'input-font'}, fonts)
          , textDir: createElement('select', {'class': 'input-textdir'}, textDirs)
          , emSize: createElement('select', {'class': 'input-emsize'}, emSizes)
          , lang: createElement('input', {type: 'text', 'class': 'input-lang', size: 4
                            , placeholder: 'English: en; Arabic: ar; etc.'})
          , content: createElement('textarea', {'class': 'input-content'
                            , placeholder: 'Enter Markdown or HTML'})
        };
    };

    /**
     * Read data from the objects created in _createInputs
     *
     * Return key->value pairs where the values should be strings or
     * behave well when being casted to strings.
     */
    _p._readData = function(inputElements) {
        return {
            font: inputElements.font.value || inputElements.font.firstElementChild.value
          , textDir: inputElements.textDir.value || inputElements.textDir.firstElementChild.value
          , emSize: inputElements.emSize.value || inputElements.emSize.firstElementChild.value
          , lang: inputElements.lang.value
          , content: inputElements.content.value
        };
    };

    _p._localizeForm = function(inputElements, data){
        inputElements.content.setAttribute('dir', data.textDir);
        inputElements.content.setAttribute('lang', data.lang);
    }

    /**
     * Write data to the objects created in _createInputs.
     * NOTE: this is user input, so be careful with the data.
     */
    _p._writeData = function(inputElements, data) {
        if(!data.font)
            inputElements.font.selectedIndex = 0;
        else
            inputElements.font.value = data.font;

        if(!data.textDir)
            inputElements.textDir.selectedIndex = 0;
        else
            inputElements.textDir.value = data.textDir;

        if(!data.emSize)
            inputElements.emSize.selectedIndex = 0;
        else
            inputElements.emSize.value = data.emSize;

        inputElements.lang.value = data.lang
            ? data.lang + ''
            : ''
            ;
        inputElements.content.value = data.content
            ? data.content + ''
            : ''
            ;

        this._localizeForm(inputElements, {
                dir: inputElements.textDir.value
              , lang: inputElements.lang.value
        });
    };

    /**
     * Return an object with key value pairs of {name: html-element}
     *
     * The keys of data correspond with the keys of the return value of _createInputs
     * plus, if used, a date or null at this._config.lastGeneratedKey.
     *
     * This method will be called initially and for each update i.e. these
     * elements are replaced on each update.
     */
    _p._createDisplays = function(data) {
        if(this._inputs)
            this._localizeForm(this._inputs, data);

        return {
            content: createElementfromMarkdown(
                    'div'
                  , {
                        'class': 'display-content ' + this._config.fonts[data.font]
                      , dir: data.textDir
                      , lang: data.lang
                      , style: 'font-size: ' + data.emSize + ';'
                    }
                , data.content || "")
          , date: createElement(
                    'time'
                  , {
                        'class': 'display-date'
                      , datetime: data.date && data.date.toISOString() || ''
                    }
                  , data.date || ''
            )
        };
    };

    return LiveTestingController;
});
