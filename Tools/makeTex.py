#! /usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function, with_statement
import sys, os
from string import Template

if __name__ == '__main__':
    args = ['TEMPLATEFILE', 'FONTFILE', 'TEXTFILE' 'FONTSIZERANGE(1 to 3 comma separated integers)']
    if len(sys.argv) < len(args) + 1:
        print('Arguments are missing, please provide: ' + ' '.join(args))
        exit(1)

    tpl = sys.argv[1]
    dirname = os.path.dirname(tpl)
    fontFile = os.path.basename(sys.argv[2])
    textFile = os.path.basename(sys.argv[3])
    try:
        fontsizerange = [int(token) for token in sys.argv[4].split(',')][:3]
    except ValueError:
        raise Exception ('I don\'t understand ' + args[3] + ': ', sys.argv[4])

    if len(fontsizerange) == 0:
        raise Exception ('Can\'t find ', args[3]);

    if len(fontsizerange) == 1:
        fontsizerange.append(fontsizerange[0] + 1);

    with open(tpl) as f:
        template = Template(f.read());

    with open(os.path.join(dirname, textFile)) as f:
        textContent = f.read()

    for old, escaped in(
                    ('\\', '\\textbackslash{}')
                  , ('#', '\\#')
                  , ('$', '\\$')
                  , ('%', '\\%')
                  , ('&', '\\&')
                  , ('~', '\\~{}')
                  , ('_', '\\_')
                  , ('^', '\\^{}')
                  , ('{', '\\{')
                  , ('}', '\\}')
                ):
        textContent = textContent.replace(old, escaped)

    for fontSize in range(*fontsizerange):
        fileName = os.path.join(
            dirname
          , '_'.join([
                textFile[:textFile.find('.')]
              , fontFile[:fontFile.find('.')]
              , str(fontSize) + '.tex'
            ])
        );
        with open(fileName, 'wb+') as f:
            f.write(template.substitute(fontsize=fontSize
                                      , fontfile=fontFile
                                      , lineheight=int(round(fontSize*1.3))
                                      , textcontent=textContent
                                      ))

