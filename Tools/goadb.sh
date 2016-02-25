#! /bin/sh

tx -dump -4 $1 | \
       sed 's/glyph\[[0-9]*\] {\(.*\),.*/\1/' | \
       sed 1d | \
       sed 's/^\(.*\)$/\1\t\1/'  | \
       cat
