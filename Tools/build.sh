#! /bin/sh

for style in Regular Medium SemiBold Bold; do
	echo building Mirza "$style"
	./Tools/buildFont.sh \
		Generated/Arabic/Mirza-"$style".otf \
		Generated/Latin/Latin-Mizra-"$style".otf \
		Build/Mirza-"$style".otf;
#exit 0;
done;
