#!/usr/bin/env python

from __future__ import print_function

import sys
import fontforge

def main(fontFile):
    font = fontforge.open(fontFile)
    for name in font:
        print("{0}\t{0}".format(name))

if __name__ == "__main__":
    main(*sys.argv[1:])
