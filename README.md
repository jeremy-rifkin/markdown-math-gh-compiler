## Markdown Math → Github Compiler

Github markdown does not support latex equations. That's <img alt="\sum \beta \mu l | s h | \tau" src="https://render.githubusercontent.com/render/math?math=%5Csum%20%5Cbeta%20%5Cmu%20l%20%7C%20s%20h%20%7C%20%5Ctau" style="transform: translateY(20%);" /> if you ask
me (jk, no hard feelings github).

Based off of the findings in this [post](https://gist.github.com/a-rodin/fef3f543412d6e1ec5b6cf55bf197d7b), this is a somewhat hacky (and perhaps over-engineered)
tool which compiles markdown with math into github-friendly markdown with rendered equations.

It's designed for use as part of a makefile, github action ([example](.github/workflows/compile_readme.yml)), or similar workflow.

Tables are not supported currently. Lists are mostly supported but there a couple kinks with nested
lists.

The tool works by reconstructing the tokens returned by a markdown parser, altering only the math
token. This is necessary for robustness, simply matching `$...$` and `$$...$$` might match half-way
across the page or in code blocks/inline html and such.

### Usage:

```
npm install -g markdown-math-gh-compiler
markdown-math-gh-compiler input.md -o output.md
```
