#! /usr/bin/env python
# coding: utf-8

"""
CAUTION: this overides the input font(s)!
usage examples:
$ ./Tools/mergeFeaIntoFont.py Sources/mirza.ligatures-01.fea Generated/*.ttf

$ ./Tools/mergeFeaIntoFont.py -dGSUB Sources/combined.fea Generated/*.ttf

"""


from __future__ import print_function
import fontTools.ttLib as ttLib
from fontTools.feaLib.builder import Builder
# this monkey paches "some" (a lot actually) fontTools classes
from fontTools.merge import Merger

import sys

def main(dropOldGSUB, dropOldGPOS, fea, fontTarget):
    target = ttLib.TTFont(fontTarget)

    # make a font that only has the tables from the fea
    feaFont = ttLib.TTFont()
    Builder(fea, feaFont).build()

    merger = Merger()
    merger.duplicateGlyphsPerFont = [{}]
    tables = [(k, feaFont[k]) for k in feaFont.keys() if k != 'GlyphOrder']
    for k,table in tables:
        if k not in target \
                or (k == 'GSUB' and dropOldGSUB) \
                or (k == 'GPOS' and dropOldGPOS):
            print('replacing:', k, 'of', fontTarget)
            target[k] = table
        else: # merge
            print('merging:', k, 'into', fontTarget)
            target[k].merge(merger, [table])

    target.save(fontTarget)
    target.close()

if __name__ == '__main__':
    args = sys.argv[1:]

    dropOldGSUB = '-dGSUB' in args
    dropOldGPOS = '-dGPOS' in args
    if dropOldGSUB or dropOldGPOS:
        args = [x for x in args if x not in ('-dGSUB', '-dGPOS')]


    fea = args[0]
    fonts = args[1:]
    for font in fonts:
        main(dropOldGSUB, dropOldGPOS, fea, font)
