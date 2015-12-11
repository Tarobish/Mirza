#! /usr/bin/env python
# coding: utf-8

"""
CAUTION: this overides the input font(s)!
usage:
$ ./Tools/mergeFeaIntoFont.py Sources/mirza.ligatures-01.fea Generated/*.ttf
"""


from __future__ import print_function
import fontTools.ttLib as ttLib
from fontTools.feaLib.builder import Builder
# this monkey paches "some" (a lot actually) fontTools classes
from fontTools.merge import Merger

import sys

def main(fea, fontTarget):
    target = ttLib.TTFont(fontTarget)

    # make a font that only has the tables from the fea
    feaFont = ttLib.TTFont()
    Builder(fea, feaFont).build()

    merger = Merger()
    merger.duplicateGlyphsPerFont = [{}]
    tables = [(k, feaFont[k]) for k in feaFont.keys() if k != 'GlyphOrder']
    for k,table in tables:
        if k in target:
            target[k].merge(merger, [table])

    target.save(fontTarget)
    target.close()

if __name__ == '__main__':
    fea = sys.argv[1]
    fonts = sys.argv[2:]
    for font in fonts:
        main(fea, font)
