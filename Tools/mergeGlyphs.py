#!/usr/bin/env python

"""
usage:

$ ./Tools/mergeGlyphs.py Sources/technical-additions.sfd Generated/*.ttf

"""

from __future__ import print_function

import sys, os
from tempfile import mkstemp
import fontforge

def main(sourceFile, targetFile):
    target = fontforge.open(targetFile)
    target.mergeFonts(sourceFile)
    target.generate(targetFile)

if __name__ == "__main__":
    source = sys.argv[1]
    for target in sys.argv[2:]:
        main(source, target)
