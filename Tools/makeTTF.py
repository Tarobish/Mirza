#!/usr/bin/env python

from __future__ import print_function

import sys
import fontforge

def main(source, target):
    fontforge.open(source).generate(target)

if __name__ == "__main__":
    main(*sys.argv[1:])
