#! /usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import print_function
import sys
import re
from collections import OrderedDict
# to get bidi informatopn from unicodes
import unicodedata2 as unicodedata
# to guess unicodes from glyph names
from fontTools import agl



# FROM typesupply/ufo2fdk branch: ufo3

try:
    set
except NameError:
    from sets import Set as set

try:
    sorted
except NameError:
    def sorted(l):
        l = list(l)
        l.sort()
        return l

inlineGroupInstance = (list, tuple, set)

side1Prefix = "public.kern1."
side2Prefix = "public.kern2."
side1FeaPrefix = "@kern1."
side2FeaPrefix = "@kern2."
groupPrefixLength = len(side1Prefix)
classPrefixLength = len(side1FeaPrefix)


class KernFeatureWriter(object):

    """
    This object will create a kerning feature in FDK
    syntax using the kerning in the given font. The
    only external method is :meth:`ufo2fdk.tools.kernFeatureWriter.write`.
    """

    def __init__(self, font, groupNamePrefix=""):
        if groupNamePrefix:
            from warnings import warn
            warn("The groupNamePrefix argument is no longer used.", DeprecationWarning)
        self.font = font
        self.getGroups()
        self.getPairs()
        self.applyGroupNameToClassNameMapping()
        self.getFlatGroups()

    def write(self, headerText=None):
        """
        Write the feature text. If *headerText* is provided
        it will inserted after the ``feature kern {`` line.
        """
        if not self.pairs:
            return ""
        glyphGlyph, glyphGroupDecomposed, groupGlyphDecomposed, glyphGroup, groupGlyph, groupGroup = self.getSeparatedPairs(self.pairs)
        # write the classes
        groups = dict(self.side1Groups)
        groups.update(self.side2Groups)
        classes = self.getClassDefinitionsForGroups(groups)
        # write the kerning rules
        rules = []
        order = [
            ("# glyph, glyph", glyphGlyph),
            ("# glyph, group exceptions", glyphGroupDecomposed),
            ("# group exceptions, glyph", groupGlyphDecomposed),
            ("# glyph, group", glyphGroup),
            ("# group, glyph", groupGlyph),
            ("# group, group", groupGroup),
        ]
        for note, pairs in order:
            if pairs:
                rules.append("")
                rules.append(note)
                rules += self.getFeatureRulesForPairs(pairs)
        # compile
        feature = ["feature kern {"]
        if headerText:
            for line in headerText.splitlines():
                line = line.strip()
                if not line.startswith("#"):
                    line = "# " + line
                line = "    " + line
                feature.append(line)
        for line in classes + rules:
            if line:
                line = "    " + line
            feature.append(line)
        feature.append("} kern;")
        # done
        return u"\n".join(feature)

    # -------------
    # Initial Setup
    # -------------

    def getGroups(self):
        """
        Set up two dictionaries representing first and
        second side groups.

        You should not call this method directly.
        """
        side1Groups = self.side1Groups = {}
        side2Groups = self.side2Groups = {}
        for groupName, contents in self.font.groups.items():
            contents = [glyphName for glyphName in contents if glyphName in self.font]
            if not contents:
                continue
            if groupName.startswith(side1Prefix):
                side1Groups[groupName] = contents
            elif groupName.startswith(side2Prefix):
                side2Groups[groupName] = contents

    def getPairs(self):
        """
        Set up a dictionary containing all kerning pairs.
        This should filter out pairs containing empty groups
        and groups/glyphs that are not in the font.

        You should not call this method directly.
        """
        pairs = self.pairs = {}
        for (side1, side2), value in self.font.kerning.items():
            # skip missing glyphs
            if side1 not in self.side1Groups and side1 not in self.font:
                continue
            if side2 not in self.side2Groups and side2 not in self.font:
                continue
            # skip empty groups
            if side1.startswith(side1Prefix) and side1 not in self.side1Groups:
                continue
            if side2.startswith(side2Prefix) and side2 not in self.side2Groups:
                continue
            # store pair
            pairs[side1, side2] = value

    def applyGroupNameToClassNameMapping(self):
        """
        Set up a dictionary mapping group names to class names.

        You should not call this method directly.
        """
        mapping = {}
        for groupNames, feaPrefix in ((self.side1Groups.keys(), side1FeaPrefix), (self.side2Groups.keys(), side2FeaPrefix)):
            for groupName in sorted(groupNames):
                className = feaPrefix + groupName[groupPrefixLength:]
                mapping[groupName] = makeLegalClassName(className, mapping.keys())
        # kerning
        newPairs = {}
        for (side1, side2), value in self.pairs.items():
            if side1.startswith(side1Prefix):
                side1 = mapping[side1]
            if side2.startswith(side2Prefix):
                side2 = mapping[side2]
            newPairs[side1, side2] = value
        self.pairs.clear()
        self.pairs.update(newPairs)
        # groups
        newSide1Groups = {}
        for groupName, contents in self.side1Groups.items():
            groupName = mapping[groupName]
            newSide1Groups[groupName] = contents
        self.side1Groups.clear()
        self.side1Groups.update(newSide1Groups)
        newSide2Groups = {}
        for groupName, contents in self.side2Groups.items():
            groupName = mapping[groupName]
            newSide2Groups[groupName] = contents
        self.side2Groups.clear()
        self.side2Groups.update(newSide2Groups)

    def getFlatGroups(self):
        """
        Set up two dictionaries keyed by glyph names with
        group names as values for side 1 and side 2 groups.

        You should not call this method directly.
        """
        flatSide1Groups = self.flatSide1Groups = {}
        flatSide2Groups = self.flatSide2Groups = {}
        for groupName, glyphList in self.side1Groups.items():
            for glyphName in glyphList:
                # user has glyph in more than one group.
                # this is not allowed.
                if glyphName in flatSide1Groups:
                    continue
                flatSide1Groups[glyphName] = groupName
        for groupName, glyphList in self.side2Groups.items():
            for glyphName in glyphList:
                # user has glyph in more than one group.
                # this is not allowed.
                if glyphName in flatSide2Groups:
                    continue
                flatSide2Groups[glyphName] = groupName

    # ------------
    # Pair Support
    # ------------

    def isHigherLevelPairPossible(self, (side1, side2)):
        """
        Determine if there is a higher level pair possible.
        This doesn't indicate that the pair exists, it simply
        indicates that something higher than (side1, side2)
        can exist.

        You should not call this method directly.
        """
        if side1.startswith(side1FeaPrefix):
            side1Group = side1
            side1Glyph = None
        else:
            side1Group = self.flatSide1Groups.get(side1)
            side1Glyph = side1
        if side2.startswith(side2FeaPrefix):
            side2Group = side2
            side2Glyph = None
        else:
            side2Group = self.flatSide2Groups.get(side2)
            side2Glyph = side2

        havePotentialHigherLevelPair = False
        if side1.startswith(side1FeaPrefix) and side2.startswith(side2FeaPrefix):
            pass
        elif side1.startswith(side1FeaPrefix):
            if side2Group is not None:
                if (side1, side2) in self.pairs:
                    havePotentialHigherLevelPair = True
        elif side2.startswith(side2FeaPrefix):
            if side1Group is not None:
                if (side1, side2) in self.pairs:
                    havePotentialHigherLevelPair = True
        else:
            if side1Group is not None and side2Group is not None:
                if (side1Glyph, side2Glyph) in self.pairs:
                    havePotentialHigherLevelPair = True
                elif (side1Group, side2Glyph) in self.pairs:
                    havePotentialHigherLevelPair = True
                elif (side1Glyph, side2Group) in self.pairs:
                    havePotentialHigherLevelPair = True
            elif side1Group is not None:
                if (side1Glyph, side2Glyph) in self.pairs:
                    havePotentialHigherLevelPair = True
            elif side2Group is not None:
                if (side1Glyph, side2Glyph) in self.pairs:
                    havePotentialHigherLevelPair = True
        return havePotentialHigherLevelPair

    def getSeparatedPairs(self, pairs):
        """
        Organize *pair* into the following groups:

        * glyph, glyph
        * glyph, group (decomposed)
        * group, glyph (decomposed)
        * glyph, group
        * group, glyph
        * group, group

        You should not call this method directly.
        """
        ## seperate pairs
        glyphGlyph = {}
        glyphGroup = {}
        glyphGroupDecomposed = {}
        groupGlyph = {}
        groupGlyphDecomposed = {}
        groupGroup = {}
        for (side1, side2), value in pairs.items():
            if side1.startswith(side1FeaPrefix) and side2.startswith(side2FeaPrefix):
                groupGroup[side1, side2] = value
            elif side1.startswith(side1FeaPrefix):
                groupGlyph[side1, side2] = value
            elif side2.startswith(side2FeaPrefix):
                glyphGroup[side1, side2] = value
            else:
                glyphGlyph[side1, side2] = value
        ## handle decomposition
        allGlyphGlyph = set(glyphGlyph.keys())
        # glyph to group
        for (side1, side2), value in glyphGroup.items():
            if self.isHigherLevelPairPossible((side1, side2)):
                finalRight = tuple([r for r in sorted(self.side2Groups[side2]) if (side1, r) not in allGlyphGlyph])
                for r in finalRight:
                    allGlyphGlyph.add((side1, r))
                glyphGroupDecomposed[side1, finalRight] = value
                del glyphGroup[side1, side2]
        # group to glyph
        for (side1, side2), value in groupGlyph.items():
            if self.isHigherLevelPairPossible((side1, side2)):
                finalLeft = tuple([l for l in sorted(self.side1Groups[side1]) if (l, side2) not in glyphGlyph and (l, side2) not in allGlyphGlyph])
                for l in finalLeft:
                    allGlyphGlyph.add((l, side2))
                groupGlyphDecomposed[finalLeft, side2] = value
                del groupGlyph[side1, side2]
        ## return the result
        return glyphGlyph, glyphGroupDecomposed, groupGlyphDecomposed, glyphGroup, groupGlyph, groupGroup

    # -------------
    # Write Support
    # -------------

    def getClassDefinitionsForGroups(self, groups):
        """
        Write class definitions to a list of strings.

        You should not call this method directly.
        """
        classes = []
        for groupName, contents in sorted(groups.items()):
            l = "%s = [%s];" % (groupName, " ".join(sorted(contents)))
            classes.append(l)
        return classes

    def getFeatureRulesForPairs(self, pairs):
        """
        Write pair rules to a list of strings.

        You should not call this method directly.
        """
        rules = []
        for (side1, side2), value in sorted(pairs.items()):
            if not side1 or not side2:
                continue
            if isinstance(side1, inlineGroupInstance) or isinstance(side2, inlineGroupInstance):
                line = "enum pos %s %s %d;"
            else:
                line = "pos %s %s %d;"
            if isinstance(side1, inlineGroupInstance):
                side1 = "[%s]" % " ".join(sorted(side1))
            if isinstance(side2, inlineGroupInstance):
                side2 = "[%s]" % " ".join(sorted(side2))
            rules.append(line % (side1, side2, value))
        return rules


# ------------------
# Class Name Creator
# ------------------

_invalidFirstCharacter = set(".0123456789")
_validCharacters = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._")

def makeLegalClassName(name, existing):
    """
    >>> makeLegalClassName("@kern1.foo", [])
    '@kern1.foo'

    invalid characters
    ------------------
    >>> makeLegalClassName(u"@kern1.f•o", [])
    '@kern1.fo'

    too long
    --------
    >>> makeLegalClassName("@kern1.abcdefghijklmnopqrstuvwxyz", [])
    '@kern1.abcdefghijklmnopqrstuvwx'

    fallback
    --------
    >>> makeLegalClassName("@kern1.", [])
    '@kern1.noTransPossible'
    >>> makeLegalClassName(u"@kern1.•", [])
    '@kern1.noTransPossible'
    """
    # slice off the prefix
    prefix = str(name[:classPrefixLength])
    name = name[classPrefixLength:]
    # only legal characters
    name = "".join([c for c in name if c in _validCharacters])
    name = str(name)
    # maximum length is 31 - prefix length
    name = name[:31 - classPrefixLength]
    # fallback
    if not name:
        name = "noTransPossible"
    # add the prefix
    name = prefix + name
    # make sure it is unique
    _makeUniqueClassName(name, existing)
    return name

def _makeUniqueClassName(name, existing, counter=0):
    """
    >>> _makeUniqueClassName("@kern1.foo", [])
    '@kern1.foo'

    >>> _makeUniqueClassName("@kern1.foo", ["@kern1.foo"])
    '@kern1.foo1'

    >>> _makeUniqueClassName("@kern1.foo", ["@kern1.foo", "@kern1.foo1", "@kern1.foo2"])
    '@kern1.foo3'

    >>> _makeUniqueClassName("@kern1.abcdefghijklmnopqrstuvwx", ["@kern1.abcdefghijklmnopqrstuvwx"])
    '@kern1.abcdefghijklmnopqrstuvw1'
    """
    # Add a number to the name if the counter is higher than zero.
    newName = name
    if counter > 0:
        c = str(counter)
        assert len(c) < 31 - classPrefixLength
        newName = newName[:31 - len(c)] + c
    # If the new name is in the existing group names, recurse.
    if newName in existing:
        return _makeUniqueClassName(name, existing, counter + 1)
    # Otherwise send back the new name.
    return newName


# from Jomhuria/tools

def info(*objs):
    print('INFO: ', *objs, file=sys.stderr)

def warning(*objs):
    print('WARNING: ', *objs, file=sys.stderr)

def scriptGetHorizontalDirection (script):
    """
    from: https://github.com/behdad/harfbuzz/blob/master/src/hb-common.cc#L446

    see: http://goo.gl/x9ilM
    see also: http://unicode.org/iso15924/iso15924-codes.html
    """
    if script.lower() in (
                # Unicode-1.1 additions
                  'arab' # ARABIC
                , 'hebr' # HEBREW

                # Unicode-3.0 additions
                , 'syrc' # SYRIAC
                , 'thaa' # THAANA

                # Unicode-4.0 additions
                , 'cprt' # CYPRIOT

                # Unicode-4.1 additions
                , 'khar' # KHAROSHTHI

                # Unicode-5.0 additions
                , 'phnx' # PHOENICIAN
                , 'nkoo' # NKO

                # Unicode-5.1 additions
                , 'lydi' # LYDIAN

                # Unicode-5.2 additions
                , 'avst' # AVESTAN
                , 'armi' # IMPERIAL_ARAMAIC
                , 'phli' # INSCRIPTIONAL_PAHLAVI
                , 'prti' # INSCRIPTIONAL_PARTHIAN
                , 'sarb' # OLD_SOUTH_ARABIAN
                , 'orkh' # OLD_TURKIC
                , 'samr' # SAMARITAN

                # Unicode-6.0 additions
                , 'mand' # MANDAIC

                # Unicode-6.1 additions
                , 'merc' # MEROITIC_CURSIVE
                , 'mero' # MEROITIC_HIEROGLYPHS

                # Unicode-7.0 additions
                , 'mani' # MANICHAEAN
                , 'mend' # MENDE_KIKAKUI
                , 'nbat' # NABATAEAN
                , 'narb' # OLD_NORTH_ARABIAN
                , 'palm' # PALMYRENE
                , 'phlp' # PSALTER_PAHLAVI
                # Unicode-8.0 additions
                , 'hung' # OLD_HUNGARIAN
                ):
        return 'RTL'
    return 'LTR'



class KernFeatureWriterWithHorizontalDirections(KernFeatureWriter):
    def __init__(self, font, scripts, groupNamePrefix='', **options):
        """
        font: a defcon font
        scripts: list of four letter unicode script codes in the "scripts" argument.

        options:
            simpleImplementation: bool, default False
                True:
                    Generate both an LTR kern lookup and an RTL one; including all kerning pairs in both.
                    Reference the RTL lookup from script systems that are RTL, and the LTR one for others.
                False (default value):
                    The same as "True" but try to eliminate pairs from the RTL and LTR lookup to reduce
                    kern table size.

                see: https://github.com/unified-font-object/ufo-spec/issues/16#issuecomment-120036174

            ignoreMissingUnicodeInGroupItems: bool, default True
                True (default value):
                    create "LTR" or "RTL" pure groups if the reason to be
                    "MIX" would be only glyphs that don't yield a unicode/direction
                False:
                    create "MIX" rules if a group has members without
                    unicode and with unicode, but is otherwise homogenous
                    "LTR" or "RTL"

                Details:
                For each side of a pair the method getPairItemDirection
                returns one of:"LTR", "RTL", "MIX", False
                False: discards the kerning pair completeley.
                MIX: creates two rules for the pair in both script directions
                LTR and RTL: create just one lookup in the respective direction.

                If the pair-item is a glyph-group each member is evaluated.
                If the items of a group yield different values "MIX" is
                returned. For the filesize however "LTR" or "RTL" is preferable.
                A group member that yields `False` can change a homogenous
                group into a "MIX" group. In case of the Jomhuria input
                kerning data this happens, because we can't determine a
                unicode for the glyph/name. However, the glyphs in that font
                that don't yield a useful unicode are not used in text layout
                (they are not inserted by fea `sub` rules). They also
                shouldn't be in the kerning data at all (but they are). Thus
                it's better to ignore these cases and produce more rules
                with homogenous "RTL" or "LTR" value.

                Hence the more aggressive option is the default here.
                Glyphs that happen in the text layout that don't yield
                unicode values (we use several approaches here) are not
                desireable in general (e.g. it breaks pdf text extraction).

            createPureLookups: bool, default True
                True (default value):
                    Keep the "mixed rules" and the "pure rules" of a direction
                    separated, by creating up to two lookups per direction.
                False:
                    Merge the "mixed rules" and the "pure rules" of a direction
                    into one lookup per direction.

                Helps when analyzing the result of this script by preserving
                the data of pure vs mixed pairs.

            usePureLookupsInDFLT: bool, default False
                True:
                    Use the "pure lookups" for `script DFLT` not in the scripts
                    defined by the `scripts` argument.
                False (default value):
                    Use the "pure lookups" in the scripts with the same direction
                    as the lookup has, not as DFLT for all scripts.

                    Default because of: https://github.com/unified-font-object/ufo-spec/issues/16#issuecomment-120036174

                NOTE: Has only an effect if "createPureLookups" is true.

                This may be useful for research and also may help to find/fix
                possible bugs.
                The direction of the kerning pairs in the "pure lookups"
                is in theory unambigous. They should always be kerned by
                the shaping engine in the direction that is forseen by
                this code. Putting them into DFLT may or may not be better
                depending on how the fea "script" tags are processed and
                if there are effects by the metadata of the text that is
                processed, i.e. if the user tags the text as some script
                that we don't define here.
                AFAIK a glyph can be associated with many different scripts
                in unicode, so it may be hard to determine  the right kern
                lookup sometimes. (The more data in DFLT, the better?)
        """
        # TODO: There may be a way to find out the scripts to use by looking
        # at the font data. Unicode should be capable of providing that
        # information, but there seems to be no ready to use implementation
        # for it.
        self.scripts = _scripts = {}
        if not scripts:
            raise TypeError('Need at least one script in the "scripts" argument iterable.')
        for script in scripts:
            writingDir = scriptGetHorizontalDirection(script.lower())
            if writingDir not in _scripts:
                _scripts[writingDir] = []
            _scripts[writingDir].append((script, scripts[script]))

        self.scriptDirs = self.scripts.keys()

        self.options = {}
        for k, default in self._optionDefaults.iteritems():
            self.options[k] = options.get(k, default)

        super(KernFeatureWriterWithHorizontalDirections, self).__init__(font, groupNamePrefix)

    _optionDefaults = {
          'simpleImplementation': False
        , 'ignoreMissingUnicodeInGroupItems':  True
        , 'createPureLookups': True
        , 'usePureLookupsInDFLT': False
    }

    getFeatureRulesForPairsLTR = KernFeatureWriter.getFeatureRulesForPairs

    def getFeatureRulesForPairsRTL(self, pairs):
        """
        Write RTL pair rules to a list of strings.

        You should not call this method directly.
        """
        rules = []
        for (side1, side2), value in sorted(pairs.items()):
            if not side1 or not side2:
                continue
            if isinstance(side1, inlineGroupInstance) or isinstance(side2, inlineGroupInstance):
                line = 'enum pos {0:s} {1:s} <{2} 0 {2} 0>;'
            else:
                line = 'pos {0:s} {1:s} <{2} 0 {2} 0>;'
            if isinstance(side1, inlineGroupInstance):
                side1 = '[%s]' % ' '.join(sorted(side1))
            if isinstance(side2, inlineGroupInstance):
                side2 = '[%s]' % ' '.join(sorted(side2))
            rules.append(line.format(side1, side2, int(round(value))))
        return rules


    def getWritingDirRules(self, writingDir, pairs):
        """
            Return a list of the kerning rules and some comments
        """
        glyphGlyph, glyphGroupDecomposed, groupGlyphDecomposed, glyphGroup, groupGlyph, groupGroup = self.getSeparatedPairs(pairs)
        order = [
            ('# glyph, glyph', glyphGlyph),
            ('# glyph, group exceptions', glyphGroupDecomposed),
            ('# group exceptions, glyph', groupGlyphDecomposed),
            ('# glyph, group', glyphGroup),
            ('# group, glyph', groupGlyph),
            ('# group, group', groupGroup),
        ]

        getFeatureRulesForPairs = self.getFeatureRulesForPairsLTR \
                            if writingDir == 'LTR' \
                            else self.getFeatureRulesForPairsRTL

        rules = []
        for note, pairs in order:
            if pairs:
                rules.append(note)
                rules += getFeatureRulesForPairs(pairs)
                rules.append('')
        # remove the last empty line
        if rules and rules[-1] == '': rules.pop();
        return rules

    def getUnicodeFromGlyphName(self, name):
        """
        This contains very project specific knowledge. It should be
        injectable with a very basic standard implementation. Like
        standard: read the unicode from the glyph, if that doesn't work
        ask the injected method to parse the name.
        """
        # Ask the font
        glyph = self.font[name]
        if glyph.unicode:
            return unichr(glyph.unicode)

        # Names can be constructed like uni1234_uni4567.old or f_i.swash
        # since we need the unicode value only to determine a direction,
        # the first glyph name should be enough.
        firstNamePart = name.split('.', 1)[0].split('_', 1)[0]

        # Ask AGLFN
        if firstNamePart in agl.AGL2UV:
            return unichr(agl.AGL2UV[firstNamePart])

        # Try to parse the name into a unicode value
        # matches things like u1EE29* or uni1234*
        match = re.match('^(uni|u)([A-F0-9]{4,}).*', firstNamePart, re.IGNORECASE)
        if match:
            hexCode = match.group(2)
            if match.group(1) == 'uni' and len(hexCode) > 4:
                # Just use the first 4 chars in case of a ligature that
                # does not separate the unicodes of its components.
                # This will give us the unicode of the first componet,
                # which will provide the bidi information of the whole
                # ligature.
                hexCode = hexCode[:4]
            code = int(hexCode, 16)
            return unichr(code)

        # no luck
        return False

    def getPairItemDirection(self, item):
        """
        Return one of: "LTR", "RTL", "MIX", False

        Note that when mentioning "groups" that includes single glyphs.
        A single item is treated as a group with just one member.

        This was the initial description

        * Associate each glyph to a Unicode character,
        * Exclude from RTL kern table all glyphs associated
                with Unicode characters that have Bidi_Type=L,
        * Exclude from LTR kern table all glyphs associated
               with Unicode characters that have Bidi_Type=R or Bidi_Type=AL.

        However, the exclusion model got altered into an inclusion model
        because groups could define mixed directions and thus would have
        to stay in all kern tables.

        An alternative way could be to break up the groups and reorder
        them to create a couple of better defined groups.

        FILTERING:
        Only if all memnbers of a group are `False` the whole group and
        subsequently pair is dissmissed. Alternativeley we could dismiss
        the whole group when at least one member is `False`. But I believe
        that would create more problems.
        Rather: we should filter the group contents much earlier in
        KernFeatureWriter.getPairs or KernFeatureWriter.getGroups

        See also: the docs for options.ignoreMissingUnicodeInGroupItems
                  in __init__
        """
        # Note: KernFeatureWriter.getPairs should already have filtered
        # empty groups and nonexisting pairs, thus it is not checked here.
        if item.startswith(side1FeaPrefix) or item.startswith(side2FeaPrefix):
            groups = self.side1Groups if item.startswith(side1FeaPrefix) \
                                      else self.side2Groups
            names = groups[item]
        else:
            names = [item]

        writingDirs = set()
        for name in names:
            unicodeChar = self.getUnicodeFromGlyphName(name)
            # http://unicode.org/reports/tr9/#Table_Bidirectional_Character_Types
            if unicodeChar == False:
                if not self.options['ignoreMissingUnicodeInGroupItems']:
                    # may result in a "MIX" pair if this is a bigger group
                    writingDirs.add(False)
                continue
            bidiType = unicodedata.bidirectional(unicodeChar)

            # L: Left-to-Right
            if bidiType == 'L':
                writingDirs.add('LTR')
            # R: Right-to-Left
            # AL: Right-to-Left Arabic
            elif bidiType in ('R', 'AL'):
                writingDirs.add('RTL')
            # AN: Arabic Number
            # FIXME: remove bidiType == 'AN' this from kerning? This
            # filtering should rather happen earlier, somewhere in
            # KernFeatureWriter.getPairs or KernFeatureWriter.getGroups
            # elif bidiType == 'AN':
            #    writingDirs.add(False)
            else:
                writingDirs.add('MIX')

        # if writingDirs.has(False)
        #     return False
        if len(writingDirs) > 1:
            return 'MIX'
        elif len(writingDirs) == 0:
            return False
        return writingDirs.pop() # "LTR", "RTL", "MIX" or False

    def getPairData(self, pair):
        """
        Returns writingDir for the pair

        writingDir may be "LTR", "RTL", "MIX" or False

        "LTR" and "RTL": The pair goes only into the respective direction lookup.
        "MIX": A pair with mixed entry types, goes into the lookups for both directions
        False: The pair is removed from kerning
        """

        side1writingDir, side2writingDir = [self.getPairItemDirection(side)
                                for side in pair]

        if not side1writingDir or not side2writingDir:
            # Filtered/Removed
            writingDir = False
        elif side1writingDir in ['LTR', 'RTL'] and side1writingDir == side2writingDir:
            writingDir = side1writingDir
        else:
            writingDir = 'MIX'

        return writingDir

    def getPairsData(self, pairs):
        """
        Returns: (purePairs, mixedPairs)

        purePairs = {'LTR': { *dict of pairdata* },'RTL': { *dict of pairdata* }}
        mixedPairs = { *dict of pairdata* }
        """

        purePairs = {'LTR': {},'RTL': {}}
        mixedPairs = {}

        if self.options['simpleImplementation']:
            mixedPairs.update(pairs)
            return purePairs, mixedPairs

        # try to reduce kern table size
        for pair, value in pairs.iteritems():
            writingDir = self.getPairData(pair)
            if not writingDir:
                continue
            elif writingDir == 'MIX':
                mixedPairs[pair] = value
            else:
                purePairs[writingDir][pair] = value
        return purePairs, mixedPairs

    def createSeparatedPureAndMixedLookups(self, purePairs, mixedPairs):
        lookups = {}
        for scriptDir, pairs in purePairs.iteritems():
            if len(pairs):
                label = 'kernPure{0}'.format(scriptDir)
                lookups[label] = self.getWritingDirRules(scriptDir, pairs)
        if len(mixedPairs):
            for scriptDir in ['LTR', 'RTL']:
                label = 'kernMixed{0}'.format(scriptDir)
                lookups[label] = self.getWritingDirRules(scriptDir, mixedPairs)
        return lookups

    def createUnifiedPureAndMixedLookups(self, purePairs, mixedPairs):
        lookups = {}
        for scriptDir in ['LTR', 'RTL']:
            unifiedPairs = {}
            if scriptDir in purePairs:
                unifiedPairs.update(purePairs[scriptDir])
            unifiedPairs.update(mixedPairs)
            if not len(unifiedPairs):
                continue;
            label = 'kernMixed{0}'.format(scriptDir)
            lookups[label] = self.getWritingDirRules(scriptDir, unifiedPairs)
        return lookups

    def getLookupData(self, pairs):
        """
        Returns lookups, directions.

        lookups = {lookupLabel: [rules]}
        directions = { (lookupLabel, lookupLabel, ...): [scripts]}
        """
        purePairs, mixedPairs = self.getPairsData(pairs)

        if self.options['createPureLookups']:
            lookups = self.createSeparatedPureAndMixedLookups(purePairs, mixedPairs)
        else:
            lookups = self.createUnifiedPureAndMixedLookups(purePairs, mixedPairs)

        directions = OrderedDict()
        for scriptDir, scripts in self.scripts.iteritems():
            if len(scripts):
                labels = []
                if not self.options['usePureLookupsInDFLT']:
                    # kernPure* lookups must also be present in lookups
                    # to get used.
                    labels.append('kernPure{0}'.format(scriptDir))
                labels.append('kernMixed{0}'.format(scriptDir))
                directions[tuple(labels)] = scripts

        return lookups, directions

    def compileKern(self, headerText, classes, lookups, directions):
        # line indentation
        lineFormat = '    {0}'
        def makeLines (lines):
            return [lineFormat.format(line) for line in lines]
        # lookup definition
        lookupOpenFormat = 'lookup {label} {{'
        lookupCloseFormat = '}} {label};'
        # lookup usage
        lookupUsageFormat = 'lookup {label};'

        # write the lookups
        feature = []

        # add kerning classes
        if classes:
            feature.append('# kerning classes')
            feature += classes
            feature.append('')

        for label, rules in lookups.iteritems():
            feature.append(lookupOpenFormat.format(label=label))
            feature.append(lineFormat.format('lookupflag IgnoreMarks;'))
            feature += makeLines(rules)
            feature.append(lookupCloseFormat.format(label=label))
            feature.append('')

        # write the feature
        feature.append('feature kern {')
        if headerText:
            for line in headerText.splitlines():
                line = line.strip()
                if not line.startswith('#'):
                    line = '# ' + line
                feature.append(lineFormat.format(line))

        # the usage of the lookups
        usage = []
        if self.options['createPureLookups'] and self.options['usePureLookupsInDFLT']:
            # put kernPure* into the DFLT script
            pureLabels = ['kernPure{0}'.format(script) for script in self.scripts]
            for label in pureLabels:
                if label not in lookups:
                    continue
                usage.append(lookupUsageFormat.format(label=label))

        # Use the lookups in their specific scripts
        for labels, scripts in directions.iteritems():
            lookupReferences = [lookupUsageFormat.format(label=label)
                                for label in labels if label in lookups]
            if not lookupReferences:
                # no actual lookups present for the label
                continue

            for script, langs in scripts:
                usage.append('script {0};'.format(script))
                for lang in langs:
                    usage.append('language {0};'.format(lang))
                    usage += lookupReferences

        feature += makeLines(usage)
        feature.append('} kern;')
        return '\n'.join(feature)

    def write(self, headerText=None):
        """
        Write the feature text. If *headerText* is provided
        it will inserted after the ``feature kern {`` line.
        """
        if not self.pairs:
            return ''

        lineFormat = '    {0}'

        # get the classes
        groups = dict(self.side1Groups)
        groups.update(self.side2Groups)
        classes = self.getClassDefinitionsForGroups(groups)

        # get the rules
        lookups, directions = self.getLookupData(self.pairs)
        return self.compileKern(headerText, classes, lookups, directions)

def scriptsFromFea(path):
    scripts = OrderedDict()
    with open(path) as fea:
        for line in fea:
            # expect self contained lines, like this: "languagesystem arab URD;"
            if not 'languagesystem' in line: continue
            script, lang = line.split()[1:3]
            lang = lang.strip(';')
            if script not in scripts:
                scripts[script] = []
            if lang not in scripts[script]:
                scripts[script].append(lang)
    return OrderedDict((script, tuple(langs)) for script,langs in scripts.items())


if __name__ == '__main__':
    from defcon import Font

    font = Font(path=sys.argv[2])
    for mergePath in sys.argv[3:]:
        merge = Font(path=mergePath)
        # merge glyphs
        for name in merge.keys():
            glyph = merge[name]
            # had an error related to anchors, but I don't need anchors here
            glyph.anchors = []
            font.insertGlyph(glyph, name=name)
        # merge groups
        font.groups.update(merge.groups)
        # merge kerning
        font.kerning.update(merge.kerning)



    # scripts = {'arab': ('dflt', 'ARA ', 'URD ', 'SND '), 'latn': ('dflt', 'TRK ')}
    #scripts = scriptsFromFea(sys.argv[1])
    scripts = {'arab': ('dflt', ), 'latn': ('dflt', )}
    kfw = KernFeatureWriterWithHorizontalDirections(font, scripts)
    print(kfw.write())


