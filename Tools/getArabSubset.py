#!/usr/bin/env python
# coding=utf-8

import fontforge

def subsetToPrepareMerge(fontfile, latinfile):
    font = fontforge.open(fontfile)
    latinfont = fontforge.open(latinfile)

    # The Latin font is already subsetted to only contain glyphs that take
    # precedence over glyphs in the Arabic if there are overlapping glyphs.
    # To give the glyphs of the latin precedence, we need to remove the
    # existing glyphs from the Arabic.
    overlapping = {name for name in font} & {name for name in latinfont}
    for name in overlapping:
        # Maybe font.removeGlyph(name) is the better strategy than font[name].clear()
        # As it seems that the newly merged glyphs don't set all properties
        # of the glyph new on font.mergeFonts(latin)
        # If there are no references, removeGlyph should be better (there
        # were none when writing this)
        font.removeGlyph(name)

    # this overrides fontfile
    font.generate(fontfile)
    # this was used together with pyftsubset
    #return [name for name in font]


if __name__ == "__main__":
    import sys
    subsetToPrepareMerge(*sys.argv[1:])
    # print ','.join(subsetToPrepareMerge(*sys.argv[1:]))
