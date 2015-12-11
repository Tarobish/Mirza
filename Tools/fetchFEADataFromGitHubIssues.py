#! /usr/bin/env python3
# coding: utf-8

"""
usage:
$ ./fetchFEADataFromGitHubIssues.py > ../Sources/mirza.ligatures-01.fea
"""

import sys
import urllib.request as request
import json
import re

def warn(*objs):
    print("WARNING: ", *objs, file=sys.stderr)

def fetchRelations(url):
    links = url.getheader('Link').split(',')
    links = [l.split(';') for l in links]
    links = {b.strip(): a.strip() for a,b in links}
    return links;

def fetchData(url):
    data = url.read().decode('utf-8')
    return json.loads(data)

def fetchList(startUrl):
    url = request.urlopen(startUrl)
    rel = fetchRelations(url)
    data = fetchData(url)
    while 'rel="next"' in rel:
        url = request.urlopen(rel['rel="next"'][1:-1])
        rel = fetchRelations(url)
        data += fetchData(url)
    return data

r_findGlyphName = re.compile(r"(uni|u)([A-F0-9]{4,})\.?([A-Za-z0-9\._])*")
def findGlyphName(string):
    match = r_findGlyphName.search(string)
    if match is None:
        return None
    return string[match.start():match.end()]

r_isGlyphName = re.compile(r"^(uni|u)([A-F0-9]{4,})\.?([A-Za-z0-9\._])*$")
def isGlyphName(string):
    return r_isGlyphName.match(string) is not None;

def parseLigature(issue):
    title = issue['title']
    body = issue['body']
    info = 'Issue #{0}: {1}'.format(issue['number'], issue['title'])

    targets = {
        'It has to be default for all the scripts'.lower(): 'rligALL'
      , 'It has to be default for Arabic and style for the other scripts'.lower(): 'rligARABdligREST'
    }

    replacement = findGlyphName(title)
    target = None

    currentGroup = set()
    groups = [currentGroup]
    for l in issue['body'].split('\n'):
        l = l.strip()
        if isGlyphName(l):
            currentGroup.add(l)
        elif l == '+':
            currentGroup = set()
            groups.append(currentGroup)
        elif l.lower() in targets:
            # try to read "targets"
            # currently known:
            #   "It has to be default for all the scripts"
            #   "It has to be default for Arabic and style for the other scripts"
            #
            # so I can identify two distinct targets:
            # `liga` for ARABIC plus `dlig` for all other (we can simplify this
            #       and make just `dlig` for all (instead of all others),
            #       since it is default for arabic anyways, there's not much harm done)
            # `liga` for ALL
            target = targets[ l.lower() ]
            description = l

    if not target:
        raise Exception('No target found for ' + info)

    if len(groups) < 2:
        raise Exception('Liga, NOT ENOUGH GROUPS skipping ' + info)

    ligaData = {
        'liga': findGlyphName(title)
      , 'groups': [tuple(sorted(g)) for g in groups]
      , 'info': info
      , 'type': 'ligature'
      , 'description': description
    }

    for i, group in enumerate(ligaData['groups']):
        if len(group) == 0:
            raise Exception('EMPTY GROUP No. ' + str(i) + ' skipping ' + info)

    return (target, ligaData)

def registerGroups(groups, group2name, name2group):
    for group in groups:
        nameA = group[0].replace('.', '')
        nameZ = group[-1].replace('.', '')
        groupName = '{0}_{1}'.format(nameA, nameZ)
        i = 2;
        while groupName in name2group and name2group[groupName] != group:
            groupName = '{0}_{1}_{2}'.format(nameA, nameZ, i)
            i+=1
        if groupName not in name2group:
            name2group[groupName] = group
            group2name[group] = groupName

def makeLookup(name, items, group2name):
    lookup = ['lookup {0} {{'.format(name)]

    for item in items:
        toSubstitute = []
        for group in item['groups']:
            toSubstitute.append('@{0}'.format(group2name[group]))
        #lookup.append('    #{0}'.format(item['info']))
        lookup.append('    sub {0} by {1};'.format(
                                    ' '.join(toSubstitute), item['liga']))

    lookup.append('}} {0};'.format(name))
    return '\n'.join(lookup)

def defineGroups(name2Group):
    groups = []
    for name in name2Group:
        group = name2Group[name]
        groups.append('@{0} = [ {1} ];'.format(name, ' '.join(group)))
    return '\n'.join(groups);



def makeJson(issues):
    data = []
    for item in issues:
        if not 'ligature' in item['title'].lower():
            warn('Type is WTF', 'skipping #', item['number'], item['title'])
            continue;
            # this is all simple ligature (sub) feature lookups
        try:
             target, ligaData = parseLigature(item)
        except Exception as e:
            warn(e)
            continue;
        data.append(ligaData)
    print(json.dumps(data, indent=4))

def makeFea(issues):
    groupRegistry = {
        'group2name': {}
      , 'name2group': {}
    }

    features = {}
    for item in issues:
        if not 'ligature' in item['title'].lower():
            warn('Type is WTF', 'skipping #', item['number'], item['title'])
            continue;

        # this is all simple ligature (sub) feature lookups
        try:
             target, ligaData = parseLigature(item)
        except Exception as e:
            warn(e)
            continue;


        if target not in features:
            features[target] = []
        features[target].append(ligaData);

        registerGroups(ligaData['groups'], **groupRegistry)

    print ('\n# GROUPS\n')
    print (defineGroups(groupRegistry['name2group']));

    print ('\n# LOOKUPS\n')
    for lookupname in features:
        print(makeLookup(lookupname, features[lookupname], groupRegistry['group2name']),'\n')

    print ('# FEATURES')
    if 'rligALL' in features:
        print ("""feature rlig {
    lookup rligALL;
} rlig;""")

    if 'rligARABdligREST' in features:
        print ("""
feature rlig {
    script arab;
    language ARA ;
    lookup rligARABdligREST;
} rlig;

feature dlig {
    lookup rligARABdligREST;
} dlig;""")

    warn(sorted(groupRegistry['name2group'].keys()))

if __name__ == '__main__':
    issuesCacheFile = './issues.cache.json';
    try:
        with open(issuesCacheFile, 'rb') as f:
            issues = json.loads(f.read().decode('UTF-8'))
    except FileNotFoundError as error:
        issues = fetchList('https://api.github.com/repos/Tarobish/Mirza/issues')
        with open(issuesCacheFile, 'wb') as f:
            jstr = json.dumps(issues)
            f.write(bytes(jstr, 'UTF-8'))

    if len(sys.argv) >= 2:
        if sys.argv[1] == 'json':
            makeJson(issues)
        else:
            raise Exception('unkown mode ', sys.argv[1]);
    else:
        makeFea(issues)

