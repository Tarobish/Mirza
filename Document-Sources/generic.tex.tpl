\documentclass[a4paper, ${fontsize}pt]{article}

\usepackage{url}
\usepackage{enumitem}
\usepackage{setspace}
\usepackage[hang]{footmisc}
\usepackage{fontspec}
\usepackage{polyglossia}
\usepackage{titlesec}
\usepackage{xcolor}

\usepackage[
  bookmarks=true,
  colorlinks=true,
  linkcolor=linkcolor,
  urlcolor=linkcolor,
  citecolor=linkcolor,
  pdftitle={Mirza Font Testing Document},
  ]{hyperref}

\definecolor{textcolor}  {rgb}{.25,.25,.25}
\definecolor{pagecolor}  {rgb}{1.0,.99,.97}
\definecolor{titlecolor} {rgb}{.67,.00,.05}
\definecolor{linkcolor}  {rgb}{.80,.00,.05}
\definecolor{codecolor}  {rgb}{.90,.90,.90}

\setmainlanguage {arabic}
\setotherlanguage{english}
\rightfootnoterule

\setmainfont               [Path=./Generated/,Ligatures=TeX]                     {$fontfile}
\setmonofont               [Scale=MatchLowercase]              {DejaVu Sans Mono}
\newfontfamily\arabicfont  [Path=./Generated/,Script=Arabic,Numbers=Proportional]{$fontfile}
\newfontfamily\arabicfonttt[Script=Arabic,Scale=MatchLowercase]{DejaVu Sans Mono}

\newcommand\addff[1]{\addfontfeature{RawFeature={#1}}} % add feature
\newcommand\addfl[1]{\addff{language=#1}}              % add language

\setlength{\parindent}{0pt}
\setlength{\parskip}{1em plus .2em minus .1em}
%setlength{\emergencystretch}{3em}  % prevent overfull lines
\setcounter{secnumdepth}{0}

\newfontfamily\titlefont[Path=./Generated/,Script=Arabic]{$fontfile}

\titleformat*{\section}{\Large\titlefont\color{titlecolor}}
\titleformat*{\subsection}{\large\titlefont\color{titlecolor}}
\titleformat*{\subsubsection}{\itshape\titlefont\color{titlecolor}}

\titlespacing{\section}{0pt}{*4}{*1}
\titlespacing{\subsection}{0pt}{*3}{0pt}
\titlespacing{\subsubsection}{0pt}{*2}{0pt}

\renewcommand\U[1]{\colorbox{codecolor}{\texttt{U+#1}}}

\title{Mirza Font Testing Document $fontfile $fontsize pt}

\begin{document}
\pagecolor{pagecolor}
\color{textcolor}

\begin{english}\maketitle\end{english}
\newpage

\begin{flushright}
\fontsize{${fontsize}pt}{${lineheight}pt}\selectfont

$textcontent

\end{flushright}
\end{document}
