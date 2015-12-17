#! /usr/bin/env python
# -*- coding: utf-8 -*-

"""

CAUTION: This is made very specifically for our sources. More than the rough
    concept wont be commonly usable.
    As for the concept: a user could define a specific translate function
    (as done in here) and the tool would map it to each glyph name of a
    fea file, parsed with something like the fontTools/feaLib.

usage:

$ ./Tools/remapFEANames.py source.fea source.ufo target.ufo

within in this project:

$ ./Tools/remapFEANames.py \
    Generated/UFO\ -Without\ Production\ Namas/Mirza-Regular.ufo/features.fea \
    Generated//UFO\ -Without\ Production\ Namas/Mirza-Regular.ufo \
    Generated/Mirza-Regular.ufo \
    > Sources/glyphs.fea

"""

from __future__ import print_function, with_statement

import sys, os
import re
import ufoLib

def warn(*objs):
    print("WARNING: ", *objs, file=sys.stderr)

class Translator(object):
    def __init__(self, ufoIn, ufoOut):

        glyphSetIn = ufoLib.UFOReader(ufoIn).getGlyphSet()
        self._glyphSetOut = glyphSetOut = ufoLib.UFOReader(ufoOut).getGlyphSet()

        self._inName2Unicodes = glyphSetIn.getUnicodes()

        outUnicodes = glyphSetOut.getUnicodes()
        outUnicode2Name = {}
        for name, unicodes in outUnicodes.iteritems():
            for uni in unicodes:
                if uni in outUnicode2Name:
                    # This is most probably an error in the UFO
                    warn('Skipping mapping unicode {0} to name {1} it is ' \
                        + 'already used by {2}' (uni, name, outUnicode2Name[uni]))
                    continue
                outUnicode2Name[uni] = name;

        self._outUnicode2Name = outUnicode2Name;

    def translate(self, word):
        if word in self._glyphSetOut:
            return word

        if word in self._inName2Unicodes:
            unicodes = self._inName2Unicodes[word]
            for uni in unicodes:
                if uni in self._outUnicode2Name:
                    return self._outUnicode2Name[uni]
        ligainfo = None
        if '_' in word:
            # ligature:
            index = word.find('.')
            parts = (index < 0 and word or word[:index]).split('_')

            if parts[-1][-3:] == '-ar':
                parts = [g + '-ar' for g in parts[:-1]] + [parts[-1]]

            parts = [(self.translate(g) or g) for g in parts]
            parts = [parts[0]] + [g[:3] == 'uni' and g[3:] or g for g in parts[1:]]

            # apparently in the glyph sources is no production name with underscore
            liga = ''.join(parts)
            if index >= 0:
                liga += word[index:]
            if liga in self._glyphSetOut:
                return liga
            ligainfo = ['Not found liga: {0} as {1}'.format(word, liga), 'parts:'] + parts;

        if not '.' in word:
            if ligainfo:
                warn(*ligainfo)
            warn('Not found: {0}'.format(word))
            return None

        index = word.find('.')
        glyphName = word[:index]
        specifics = word[index:]
        newName = self.translate(glyphName)
        if newName:
            newName += specifics
            if newName in self._glyphSetOut:
                return newName
        warn('Can\'t translate: {0}'.format(word))
        return None

def translateGlyphs(translate, gstring):
    glyphs = [ (g and translate(g) or g).replace('-', '')
                                            for g in gstring.split(' ')]
    return ' '.join(glyphs)

def translateLine(line, translate):
    # only checking for sub . . . by . . .;
    # sub must be at the beginning of the line. The source has only self
    # contained lines and no more variation than sub (many to one and one to many)
    # so this is VERY simple. For better parsing the fontTools feaLib
    # is the way to go.

    stripped = line.lstrip();
    # the space is important!
    if 'sub ' != stripped[:4]:
        return line;

    subIndex = line.find('sub ')
    byIndex = line.find(' by ')
    endIndex = line.find(';')

    sub = line[:subIndex + 4]
    inGlyphs = translateGlyphs(translate, line[subIndex + 4:byIndex])
    by = line[byIndex:byIndex + 4]
    outGlyphs = translateGlyphs(translate, line[byIndex + 4:endIndex])
    end = line[endIndex:]
    return ''.join([sub, inGlyphs, by, outGlyphs, end])

def main():
    translator = Translator(*sys.argv[2:4])
    with open(sys.argv[1]) as fea:
        for line in fea:
            print(translateLine(line, translator.translate), end='')



if __name__ == '__main__':
    main()

