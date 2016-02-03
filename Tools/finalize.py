#!/usr/bin/env python

from __future__ import print_function

import sys
import json
from fontTools.ttLib import TTFont


def copyTables(font, source, tables):
    for name in tables:
        font[name] = source[name]

def collectData(source, data):
    result = {}
    for tableName,item in data.items():
        table = source[tableName]
        result[tableName] = []
        for key,value in item.items():
            result[tableName].append((key, value))
    return result

def writeData(font, data):
    for tableName, entries in data.items():
        if tableName == 'name':
            setNames(font, entries)
            continue
        table = font[tableName]
        for key,value in entries:
            setattr(table, key, value)

def copyItems(font, source, data):
    collected = collectData(source, data)
    writeData(font, collected)

def setNames(font, nameRecords):
    for nameRecord in nameRecords:
        nameRecord = list(nameRecord)
        # expecting here a string like "0x409",JSON has no own hex digit notation
        nameRecord[4] = int(nameRecord[4][2:], 16)
        font['name'].setName(*nameRecord)

def clean(font):
    # the ttf contains NAME table IDs with platformID="1", these should be removed
    name = font['name']
    names = []
    for record in name.names:
        if record.platformID == 1:
            continue
        names.append(record)
    name.names = names

    # remove non-standard 'FFTM' the FontForge time stamp table
    if 'FFTM' in font:
        del font['FFTM'];

    # force compiling tables by fontTools, saves few tens of KBs
    for tag in font.keys():
        if hasattr(font[tag], "compile"):
            font[tag].compile(font)

def main(fileName, tableSourceFile, dataJSON):
    outfile = fileName
    # now open in fontTools
    font = TTFont(fileName)
    source = TTFont(tableSourceFile)

    # post
    copyTables(font, source, ['name', 'OS/2'])

    # some portions of os2 etc, I think
    copyItems(font, source, {})


    # TODO: make this loaded as json
    # version, authors, copyright etc...
    with open(dataJSON) as f:
        data = json.load(f)
    writeData(font, data);

    clean(font)
    font.save(outfile)
    font.close()

if __name__=='__main__':
    main(*sys.argv[1:])
