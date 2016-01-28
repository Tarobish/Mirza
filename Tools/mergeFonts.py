#!/usr/bin/env python

from __future__ import print_function

import sys
import fontforge

def main(targetFile, *sources):
    target = fontforge.font()
    for sourceFile in sources:
        target.mergeFonts(sourceFile)

    target.generate(targetFile)

if __name__ == "__main__":
    main(*sys.argv[1:])
