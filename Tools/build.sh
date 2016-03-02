#! /bin/sh

for style in Regular Medium SemiBold Bold; do
	echo building Mirza "$style"
	./Tools/buildFont.sh \
		$style \
		Sources/Build/Arabic/Mirza-"$style".otf \
		Sources/Build/Latin/Latin-Mizra-"$style".otf \
		Build/Mirza-"$style".otf \
		Sources/Build/Arabic/Mirza-"$style".ttf \
		Sources/Build/Latin/Latin-Mizra-"$style".ttf \
		Build/Mirza-"$style".ttf;
#exit 0;
done;
