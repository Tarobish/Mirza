# /bin/bash

tools="$(dirname $0)";
sources="$(dirname $tools)/Sources";

arab=$1;
latn=$2;
target=$3;

mkdir _build;

cp $arab _build/arab.otf;
cp $latn _build/latn.otf;
cp $sources/specific.fea _build/specific.fea;
cp $sources/pos-specific.fea _build/pos-specific.fea;
cp $sources/features.fea _build/features.fea;
cp $sources/data.json _build/data.json;

base=$(echo $arab | cut -f 1 -d '.')
arab_ufo="$base.ufo"
cp -LR "$arab_ufo" _build/arab.ufo
base=$(echo $latn | cut -f 1 -d '.')
latn_ufo="$base.ufo"
cp -LR "$latn_ufo" _build/latn.ufo

cd _build;
tools="../$tools";
sources="../$sources";


echo 'clean arabic';
$tools/getArabSubset.py arab.otf latn.otf;

echo 'merge technical additions';
$tools/mergeGlyphs.py $sources/technical-additions.sfd arab.otf;


echo 'make feature files';
$tools/mergeGDEF2fea.py arab.otf latn.otf > gdef.fea;
$tools/ftSnippets/ft2feaCLI.py -s arab \
       -r "GPOS feature mkmk|mark;GSUB feature locl"  \
       -m "GPOS feature mkmk|mark;" \
        arab.otf > arab.fea;
$tools/ftSnippets/ft2feaCLI.py -s latn -r "GPOS|GSUB feature *" -b "GPOS feature kern; GSUB feature aalt;"   latn.otf > latn.fea;

$tools/generateFeaturesFromLookups.py arab.fea > arabMarkFeatures.fea


$tools/kernFeatureWriter.py features.fea arab.ufo latn.ufo > kern.fea

echo 'merge fonts';
$tools/mergeFonts.py glyphsSource.otf arab.otf latn.otf;


$tools/glyphOrderAndAliasDB.py glyphsSource.otf > GlyphOrderAndAliasDB

echo 'make otf'
makeotf -r -f glyphsSource.otf -o result.otf -ff features.fea;

$tools/makeTTF.py result.otf result.ttf

echo 'finalize'
$tools/finalize.py result.otf arab.otf data.json
$tools/finalize.py result.ttf arab.otf data.json


echo 'cleaning up';
cd ..;
mkdir -p "$(dirname $target)";
cp _build/result.otf $target;
base=$(echo $target | cut -f 1 -d '.');
cp _build/result.ttf "$base.ttf";



rm -rf _build
