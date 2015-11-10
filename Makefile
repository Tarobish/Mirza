.PHONY: clean doc release dist textfiles preparedoc

FAMILY=Mirza
VERSION=0.001

DDT=Document-Sources
GEN=Generated
DIST=Releases
DDTOUT=$(GEN)/Documents

RELEASE=$(DIST)/$(FAMILY)-$(VERSION)

TEXTPL=$(wildcard $(DDT)/*.tex.tpl)
TEXS=$(wildcard $(DDT)/*.tex)
DDTDOCS=$(TEXS:$(DDT)/%.tex=$(DDTOUT)/%.pdf)

FONTS=$(wildcard $(GEN)/*.ttf)
license=OFL.txt OFL-FAQ.txt


GENTEX=Tools/makeTex.py
# this are fontsizes for the different docs, the first number is included
# the second not a third argument is possible, as in pythons range
DOCSIZERANGE=7,13

preparedoc: texfiles

# run make `preparedoc` before `make doc`
doc: $(DDTDOCS)
release: RELEASE


texfiles:
	@for font in $(FONTS) ; do \
		for tpl in $(TEXTPL) ; do \
			$(GENTEX) $$tpl $$font $(DOCSIZERANGE); \
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
