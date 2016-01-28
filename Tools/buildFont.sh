# /bin/bash

tools="$(dirname $0)";
sources="$(dirname $tools)/Sources";

arab=$1;
latn=$2;
target=$3;

mkdir _build;

cp $arab _build/arab.otf;
cp $latn _build/latn.otf;
cp $sources/features.fea _build/features.fea;


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
ft2fea -s arab -r "GPOS feature mkmk|mark;GSUB feature locl"  arab.otf > arab.fea;
ft2fea -s latn -r "GPOS|GSUB feature *" -b "GPOS feature kern; GSUB feature aalt;"   latn.otf > latn.fea;


$tools/kernFeatureWriter.py features.fea arab.ufo latn.ufo > kern.fea

echo 'merge fonts';
$tools/mergeFonts.py glyphsSource.otf arab.otf latn.otf;

echo 'make otf'
makeotf -f glyphsSource.otf -o result.otf -ff features.fea; # -r

echo 'cleaning up';
cd ..;
mkdir -p "$(dirname $target)";
cp _build/result.otf $target;
rm -rf _build
