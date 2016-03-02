.PHONY: all clean doc release dist textfiles preparedoc

FAMILY=Mirza
VERSION=1.000

DDT=Document-Sources
GEN=Generated
FONTDIR=Build
DIST=Releases
DDTOUT=$(GEN)/Documents

RELEASE=$(DIST)/$(FAMILY)-$(VERSION)

TEXTPL=$(wildcard $(DDT)/*.tex.tpl)
TEXTS=$(wildcard $(DDT)/*.txt)
TEXS=$(wildcard $(DDT)/*.tex)
DDTDOCS=$(TEXS:$(DDT)/%.tex=$(DDTOUT)/%.pdf)

FONTS=$(wildcard $(FONTDIR)/*.ttf)
license=OFL.txt OFL-FAQ.txt


GENTEX=Tools/makeTex.py
MAKEALL=Tools/build.sh
# this are fontsizes for the different docs, the first number is included
# the second not a third argument is possible, as in pythons range
DOCSIZERANGE=7,13

all:
	$(MAKEALL)

preparedoc: texfiles

# run `make preparedoc` before `make doc`
doc: $(DDTDOCS)
release: RELEASE


texfiles:
	@for textfile in $(TEXTS) ; do \
		for font in $(FONTS) ; do \
			for tpl in $(TEXTPL) ; do \
				$(GENTEX) $$tpl $$font $$textfile $(DOCSIZERANGE); \
			done \
		done \
	done

$(DDTOUT)/%.pdf: $(DDT)/%.tex
	@echo "   GEN	$< $@"
	@mkdir -p $(DDTOUT)
	@latexmk --norc --xelatex --quiet --output-directory=${DDTOUT} $<

$(RELEASE)/$(FAMILY)-$(VERSION):$(GEN)/$(NAME).ttf FONTLOG README
	@echo "   GEN	$@"

clean:
	rm -rfv $(PDFS)

dist:
	@echo "   Making dist tarball"
	@mkdir -p $(RELEASE)
	@cp document-sources/RELEASE-README $(RELEASE)/README.txt
	@cp OFL.txt $(RELEASE)
	@cp $(DTTF) $(RELEASE)
	@cd $(RELEASE) && zip -r $(basename `pwd`).zip .
