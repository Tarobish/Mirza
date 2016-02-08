#! /usr/bin/env python
# coding: utf-8
from __future__ import print_function


def makeFeatureApplication(f):
    lookups = [];
    tags = {
        'mark': { 'markToBase_', 'markToLigature_' },
        'mkmk': { 'markToMark_' }
    }
    features = {}
    for line in f:
        line = line.strip()
        if not line.startswith('lookup'):
            continue;
        lookup = line[len('lookup'):line.find('{')].strip()
        if lookup not in lookups:
            lookups.append(lookup)
    for lookup in lookups:
        for tag, keys in tags.items():
            if lookup[0:lookup.find('_')+1] not in keys:
                continue
            if tag not in features:
                features[tag] = []
            features[tag].append(lookup)
    for tag, lookups in features.items():
        l = ['\n\tlookup {0};'.format(lookup) for lookup in lookups]
	print ('feature {0} {{{1}\n}} {0};'.format(tag, ''.join(l))) 

if __name__ == '__main__':
    import sys
    with open(sys.argv[1]) as f:
        makeFeatureApplication(f)
