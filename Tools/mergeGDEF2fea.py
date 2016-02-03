#!/usr/bin/env python

from __future__ import print_function

import sys
from ftSnippets import ft2fea
from fontTools.ttLib import TTFont

def main(*sources):
    fonts = [TTFont(source) for source in sources]
    gdefLines = []
    glyphClassDef = {}
    classNames = {
        1: 'GDEF_Base', # Base glyph (single character, spacing glyph)
        2: 'GDEF_Ligature', # Ligature glyph (multiple character, spacing glyph)
        3: 'GDEF_Mark', # Mark glyph (non-spacing combining glyph)
        4: 'GDEF_Component' # Component glyph (part of single character, spacing glyph)
    }

    for font in fonts:
        if 'GDEF' not in font: continue
        table = font['GDEF']
        if table.table.GlyphClassDef is not None:
            # merge glyphClasses into one dict
            glyphClassDef.update(table.table.GlyphClassDef.classDefs)
        if table.table.AttachList is not None:
            gdefLines += ft2fea.formatAttachList(table.table.AttachList)
        if table.table.LigCaretList is not None:
            gdefLines += ft2fea.formatLigCaretList(table.table.LigCaretList)

    glyphClasses, gdefGlyphClasses = ft2fea.formatGlyphClassDef(glyphClassDef)

    if len(glyphClasses):
        gdefLines =  gdefGlyphClasses + gdefLines
        print('# GDEF Glyph Class Definitions:\n')
        print('\n\n'.join(glyphClasses))
        print()

    if len(gdefLines):
        print('table {0} {{'.format('GDEF'))
        print('\n'.join(gdefLines))
        print('}} {0};\n'.format('GDEF'))


if __name__ == "__main__":
    main(*sys.argv[1:])
