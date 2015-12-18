#!/usr/bin/env python

from __future__ import print_function

import sys
import subprocess
import re

def runHB(row, font, positions=False):
    args = ["hb-shape", "--no-clusters", positions and "--debug" or "--no-positions",
            "--font-file=%s" %font,
            "--direction=%s" %row[0],
            "--script=%s"    %row[1],
            "--language=%s"  %row[2],
            "--features=%s"  %row[3],
            isinstance(row[4], unicode) and row[4].encode('utf-8') or row[4]]
    process = subprocess.Popen(args, stdout=subprocess.PIPE)
    return process.communicate()[0].strip()

def replaceSpecials(inp, dictionary={}):
    pattern = '|'.join(sorted(re.escape(k) for k in dictionary))
    return re.sub(pattern, lambda m: dictionary.get(m.group(0)), inp)

def replaceUnicodes(inp):
    pattern = '(\\\u[0-9A-Fa-f]+)'
    #m.group(0)
    return re.sub(pattern, lambda m: unichr(int(m.group(1)[2:], 16)), inp)

specials = {
    u':zwj:': u'\u200D'
  , u':zwnj:': u'\u200C'
  , u':nbsp:': u'\u00A0'
  , u':dottedCircle:': u'\u25CC'
}

if __name__ == '__main__':
    args = sys.argv[1:]
    if len(args) < 2:
        raise Exception('Font or input text is missing.');

    font = args[0];
    print('font:', font);

    text = args[1];
    print('input:', text);

    text = replaceSpecials(text.decode('utf-8'), specials);
    text = replaceUnicodes(text);

    print('parsed:', text);

    print ('unicodes', 'u"' + (''.join(['\\u{:04X}'.format(ord(x)) for x in text])) + '"')
    row = ['rtl','arab','AR','',text]
    print('shaped:', runHB(row, font))
