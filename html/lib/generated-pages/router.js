define([
    'dom-tool'
], function(
    domStuff
) {
    "use strict";
    /*global document:true window:true*/

    var createElement = domStuff.createElement
      , isDOMElement = domStuff.isDOMElement
      ;

    function getPath() {
        var hash = window.location.hash;
        // hash is prepended by #
        return hash.length ? hash.slice(1) : hash;
    }

    function getPage(pages, fallback) {
        var path, piece, dir, page;

        path = getPath().split('/');
        dir = pages;
        while((piece = path.shift()) !== undefined) {
            if(piece === '') continue;
            if(!dir) {
                page = undefined;
                break;
            }
            page = dir[decodeURIComponent(piece)];
            if(!page) break;
            dir = page['/'];
        }
        if(!page && fallback !== undefined && fallback in pages)
            page = pages[fallback];
        if(page)
            return [page];
        return undefined;
    }

    function loadPage(target, page) {
        var loadedPage = {module: page[0]}, generated;
        while(target.lastChild)
            target.removeChild(target.lastChild);
        target.ownerDocument.title = page[0].title;

        generated = page[0].generate(childApi);
        if(isDOMElement(generated))
            target.appendChild(generated);
        else {
            loadedPage.api = generated;
            target.appendChild(generated.dom);
            if(loadedPage.api.initHandler)
                loadedPage.api.initHandler();
        }
        return loadedPage;
    }

    // no use yet
    var childApi = {};

    function renderMenu(target, pages, prefix) {
        var k
          , child
          , children = []
          , _prefix = prefix || ''
          , here
          ;
        for(k in pages) {
            here = _prefix + encodeURIComponent(k);
            child = createElement('li', null);
            children.push(child);

            if(k.indexOf('http://') === 0 || k.indexOf('https://') === 0 || k.indexOf('../') === 0)
                child.appendChild(createElement('a', {href: k}, pages[k].title || k));
            else if(pages[k].generate)
                child.appendChild(createElement('a', {href: '#' + here}, pages[k].title));
            else if(pages[k].title)
                child.appendChild(createElement('span', null, pages[k].title));

            if(pages[k]['/'])
                renderMenu(child, pages[k]['/'], here + '/');
        }
        target.appendChild(createElement('ul', {dir:'LTR'}, children));
    }

    function langSelectChangeHandler(_, langTarget) {
        langTarget.setAttribute('lang', this.value);
    }

    function classSelectChangeHandler(classes, classTarget) {
        var i,l;
        for(i=0,l=classes.length;i<l;i++)
            classTarget.classList.remove.apply(classTarget.classList, classes);
        classTarget.classList.add(this.value);
    }

    function makeSelect(items, target, handler) {
        var i,l,options = [], select;
        for(i=0,l=items.length;i<l;i++)
            options.push(createElement('option', null, items[i]));
        select = createElement('select', null, options);
        select.addEventListener('change', handler.bind(
                                            select, items, target));
        return select;
    }


    function router(pages, fonts, langs) {
        var body = document.body
          , content = createElement('main', {'class': 'generated-pages',lang: 'en', dir:'LTR'})
          , nav = createElement('div', {'class': 'generated-pages-navigation'})
          , currentPage
          , fontSelect, langSelect
          ;

        if(fonts) {
            fontSelect = makeSelect(fonts, content, classSelectChangeHandler);
            classSelectChangeHandler.call(fontSelect, fonts, content);
        }

        if(langs) {
            langSelect = makeSelect(langs, content, langSelectChangeHandler);
            langSelectChangeHandler.call(langSelect, fonts, content);
        }

        function switchPageHandler(e) {
            var page = getPage(pages);
            if(!page) return;
            if(page[0] === currentPage.module
                        && currentPage.api
                        && currentPage.api.payloadChangeHandler
                        && currentPage.api.payloadChangeHandler(page[1])) {
                // the initialized page handled the event
                return;
            }
            currentPage = loadPage(content, page);
            window.scrollTo(0,0)
        }
        body.appendChild(nav);

        if(fontSelect)
            nav.appendChild(fontSelect);

        if(langSelect)
            nav.appendChild(langSelect);

        body.appendChild(content);
        renderMenu(nav, pages);
        currentPage = loadPage(content, getPage(pages, 'index'));

        // Listen to hash changes.
        window.addEventListener('hashchange', switchPageHandler, false);
    }
    return router;
});
