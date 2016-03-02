#! /bin/sh

for style in Regular Medium SemiBold Bold; do
	echo building Mirza "$style"
	./Tools/buildFont.sh \
		$style \
		Generated/Arabic/Mirza-"$style".otf \
		Generated/Latin/Latin-Mizra-"$style".otf \
		Build/Mirza-"$style".otf \
		Generated/Arabic/Mirza-"$style".ttf \
		Generated/Latin/Latin-Mizra-"$style".ttf \
		Build/Mirza-"$style".ttf;
#exit 0;
done;
