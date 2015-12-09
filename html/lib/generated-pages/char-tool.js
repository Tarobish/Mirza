define([], function() {
    "use strict";
    /*jshint laxcomma: true, laxbreak: true*/

    // about String.fromCodePoint: there is a polyfill if this is missing
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint
    // but in here probably this will do:
    // NOTE: defining a polyfill/fallback within a module is bad style!
    // We should maybe make an extra module for this if really needed
    // and really needed in a good quality. Right now thi is more than enough
    if (!String.fromCodePoint)
         String.fromCodePoint = String.fromCharCode;

    var zwj = String.fromCodePoint(0x200D) // zero-width joiner
      , zwnj = String.fromCodePoint(0x200C)// zero-width non-joiner
      , nbsp = String.fromCodePoint(0x00A0)// no break space
      , dottedCircle = String.fromCodePoint(0x25CC)// DOTTED CIRCLE
      ;

    /**
     * Be intelligent about Jomhuria char names
     *
     * returns a struct:
     * {
     *       name: name // same as input argument
     *     , code: null || int unicode codepoint
     *     , char: null || str the char for the codepoint
     *     , type: null || anthing after the '.' if the dot follows the unicode
     *     , mainType: null || if there is a type anything before the first '_' in the type
     *     , subType: null || if there is a type anything after the first '_' in the type
     * }
     */
    function parseName(name) {
        var glyph = {
                name: name
              , code: null
              , baseName: null
              , type: null
            }
          , codeRegEx = /^(uni|u)([A-F0-9]{4,}).*/ // matches things like u1EE29* or uni1234*
          , codeMatch
          , typeDivider
          ;
        codeMatch = name.match(codeRegEx);
        if(codeMatch === null)
            return glyph;
        typeDivider = codeMatch[1].length + codeMatch[2].length;

        // If codeMatch[2] is not the end of the name and not followed by a dot
        // we refuse to parse the name.
        if(name.length !== typeDivider && name[typeDivider] !== '.')
            return glyph;

        glyph.baseName = codeMatch[1] + codeMatch[2];
        glyph.code = parseInt(codeMatch[2], 16);

        // see if there is a type
        if(name[typeDivider] !== '.')
            // no type
            return glyph;

        // got a type
        glyph.type = name.slice(8);
        return glyph;
    }

    var Glyph = (function(parseName) {
        function Glyph(name, baseName, code, type) {
            this.name = name;
            this.baseName = baseName;
            this.code = code;
            this.mainType = null;
            this.subType = null;
            this.type = type;
        }
        var _p = Glyph.prototype;
        _p.constructor = Glyph;

        Glyph.factory = function(name) {
            var data = parseName(name);
            return new Glyph(data.name, data.baseName, data.code, data.type);
        };

        Object.defineProperty(_p, 'char', {
            get: function() {
                if(this.code === null)
                    return null;
                return String.fromCodePoint(this.code);
            }
        });

        Object.defineProperty(_p, 'type', {
            get: function() {
                if(this.subType)
                    return this.mainType + '_' + this.subType;
                return this.mainType;
            }
          , set: function(type) {
                var subtypeDivider;
                if(!type) {
                    this.mainType = null;
                    this.subType = null;
                }
                else if((subtypeDivider = type.indexOf('_')) !== -1) {
                    this.mainType = type.slice(0, subtypeDivider);
                    this.subType = type.slice(subtypeDivider + 1);
                }
                else {
                    this.mainType = type;
                    this.subType = null;
                }
            }
        });
        _p.getType = function(fallback) {
            var hasFallback = arguments.length
              , type = this.type
              ;
            if(type !== null)
                return type;
            else if(hasFallback)
                return fallback;
            else
                // FIXME: should be KeyError
                throw new Error('Type not found, fallback not specified');
        };

        _p.hasChar = function() {
            return this.char !== null;
        };
        return Glyph;
    })(parseName);

    return {
        parseName: parseName
      , Glyph: Glyph
      , zwj: zwj
      , zwnj: zwnj
      , nbsp: nbsp
      , dottedCircle: dottedCircle
    };
});
