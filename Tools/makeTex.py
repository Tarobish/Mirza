#! /usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function, with_statement
import sys, os
from string import Template

if __name__ == '__main__':
    args = ['TEMPLATEFILE', 'FONTFILE', 'FONTSIZERANGE(1 to 3 comma separated integers)']
    if len(sys.argv) < len(args) + 1:
        print('Arguments are missing, please provide: ' + ' '.join(args))
        exit(1)

    tpl = sys.argv[1]
    fontFile = os.path.basename(sys.argv[2])
    try:
        fontsizerange = [int(token) for token in sys.argv[3].split(',')][:3]
    except ValueError:
        raise Exception ('I don\'t understand ' + args[2] + ': ', sys.argv[3])

    if len(fontsizerange) == 0:
        raise Exception ('Can\'t find ', args[2]);

    if len(fontsizerange) == 1:
        fontsizerange.append(fontsizerange[0] + 1);

    with open(tpl) as f:
        template = Template(f.read());

    for fontSize in range(*fontsizerange):
        fileName = '_'.join([
            tpl[:tpl.find('.')]
          , fontFile[:fontFile.find('.')]
          , str(fontSize) + '.tex'
        ]);
        with open(fileName, 'wb+') as f:
            f.write(template.substitute(fontsize=fontSize, fontfile=fontFile,lineheight=int(round(fontSize*1.3))))

