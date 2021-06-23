## Markdown Math → Github Compiler

Github markdown does not support latex equations. That's $\sum \beta \mu l | s h | \tau$ if you ask
me (jk, no hard feelings github).

Based off of the findings in this [post][1], this is a somewhat hacky (and perhaps over-engineered)
tool which compiles markdown with math into github-friendly markdown with rendered equations.

It's designed for use as part of a makefile, github action ([example][2]), or similar workflow.

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

[1]: https://gist.github.com/a-rodin/fef3f543412d6e1ec5b6cf55bf197d7b
[2]: .github/workflows/compile_readme.yml
