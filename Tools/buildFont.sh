# /bin/bash

tools="$(dirname $0)";
sources="$(dirname $tools)/Sources";

style=$1
arabOTF=$2;
latnOTF=$3;
targetOTF=$4;
arabTTF=$5;
latnTTF=$6;
targetTTF=$7;
VERSION=$8

mkdir _build;

cp -v $arabOTF _build/arab.otf;
cp -v $latnOTF _build/latn.otf;
cp -v $arabTTF _build/arab.ttf;
cp -v $latnTTF _build/latn.ttf;

cp -v $sources/specific.fea _build/specific.fea;
cp -v $sources/pos-specific.fea _build/pos-specific.fea;
cp -v $sources/features.fea _build/features.fea;
cp -v $sources/data.json _build/data.json;
cp -v $sources/data-$style.json _build/data-$style.json;

base=$(echo $arabOTF | cut -f 1 -d '.')
arab_ufo="$base.ufo"
cp -vLR "$arab_ufo" _build/arab.ufo
base=$(echo $latnOTF | cut -f 1 -d '.')
latn_ufo="$base.ufo"
cp -vLR "$latn_ufo" _build/latn.ufo

cd _build;
tools="../$tools";
sources="../$sources";

echo 'clean arabic';
$tools/getArabSubset.py arab.otf latn.otf;
$tools/getArabSubset.py arab.ttf latn.ttf;

echo 'merge technical additions';
$tools/mergeGlyphs.py $sources/technical-additions.sfd arab.otf;
$tools/mergeGlyphs.py $sources/technical-additions.sfd arab.ttf;


echo 'make feature files';
$tools/mergeGDEF2fea.py arab.otf latn.otf > gdef.fea;
$tools/ftSnippets/ft2feaCLI.py -s arab \
       -r "GPOS feature mkmk|mark;GSUB feature locl"  \
       -m "GPOS feature mkmk|mark;" \
        arab.otf > arab.fea;
$tools/ftSnippets/ft2feaCLI.py -s latn -r "GPOS|GSUB feature *" \
                       -b "GPOS feature kern; GSUB feature aalt;" \
                       latn.otf > latn.fea;

$tools/generateFeaturesFromLookups.py arab.fea > arabMarkFeatures.fea


$tools/kernFeatureWriter.py features.fea arab.ufo latn.ufo > kern.fea

echo 'merge fonts';
$tools/mergeFonts.py glyphsSource.otf arab.otf latn.otf;
$tools/mergeFonts.py glyphsSource.ttf arab.ttf latn.ttf;

sed -i -- "s/%VERSION%/$VERSION/g" features.fea;
echo 'make otf'
$tools/goadb.sh glyphsSource.otf > GlyphOrderAndAliasDB
makeotf -r -f glyphsSource.otf -o result.otf -ff features.fea;

echo 'make ttf'
$tools/goadb.sh glyphsSource.ttf > GlyphOrderAndAliasDB
makeotf -r -f glyphsSource.ttf -o result.ttf -ff features.fea;

echo 'finalize'
sed -i -- "s/%VERSION%/$VERSION/g" *.json;
$tools/finalize.py result.otf arab.otf data.json data-$style.json
$tools/finalize.py result.ttf arab.ttf data.json data-$style.json


echo 'cleaning up';
cd ..;
mkdir -p "$(dirname $targetOTF)";
cp -v _build/result.otf $targetOTF;
cp -v _build/result.ttf $targetTTF;



rm -rf _build
