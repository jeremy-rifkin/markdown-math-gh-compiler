#!/usr/bin/env node
const fs = require("fs");
const md = require("markdown-it")()
           .use(require("markdown-it-texmath"), { engine: {}, delimiters: 'dollars' })
		   .use(require("markdown-it-task-checkbox"));

global.failed_assertions = 0;
function assert(c, ...stuff) {
	if(!c) {
		global.failed_assertions++;
		console.error("assertion failed:", ...stuff);
	}
}

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
function encode(str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
		return "%" + c.charCodeAt(0).toString(16);
	});
}

https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escape_re(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function translate(tokens, _line_stack) {
	let compiled = "";
	// array of strings or numbers (strings currently used for blockquotes, numbers used for lists/unordered lists)
	let line_stack = _line_stack || [];
	let link_stack = []; // serves as like a line prefix
	let get_prefix = () => {
		let str = "";
		let to_string = (item, next_item_is_list) => {
			if(typeof item == "string") {
				return item;
			} else {
				if(!next_item_is_list) {
					return item == 0 ? "* " : `${item}. `;
				} else {
					return "  ";
				}
			}
		};
		for(let i = 0; i < line_stack.length; i++) {
			str += to_string(line_stack[i], typeof line_stack[i + 1] == "number");
		}
		return str;
	};
	//for(let token of tokens) {
	for(let i = 0; i < tokens.length; i++) {
		let token = tokens[i];
		if(token.children != null && ["inline", "image"].indexOf(token.type) == -1) assert(false, "children assert", token);
		switch(token.type) {
			case "heading_open":
				assert(token.children == null, "token.children == null", token);
				compiled += `${token.markup} `;
				break;
			case "heading_close":
				compiled += `\n${get_prefix()}\n`;
				break;
			case "paragraph_open":
				compiled += get_prefix()
				break;
			case "paragraph_close":
				compiled += `\n${get_prefix()}\n`;
				break;
			case "math_block":
				assert(tokens[i+1].type == "math_block_end", "math_block not followed immediately by math_block_end", token);
				//compiled += `${token.markup}${token.content}${token.markup}\n\n`;
				//compiled += `<div style="text-align:center"><img alt="${token.content}" src="https://render.githubusercontent.com/render/math?math=${encode(token.content)}"/></div>\n\n`;
				compiled += `<p align="center"><img alt="${token.content}" src="https://render.githubusercontent.com/render/math?math=${encode(token.content)}"/></p>\n\n`;
				break;
			case "math_block_end":
				assert(token.content == "", "content not empty", token);
				break;
			case "inline":
				//compiled += token.content;
				compiled += translate(token.children, line_stack);
				break;
			case "text":
				compiled += token.content;
				break;
			case "image":
				assert(token.attrs[0][0] == "src", "malformed image token");
				compiled += `![${translate(token.children, line_stack)}](${token.attrs[0][1]}) `;
				break;
			case "softbreak":
				compiled += "\n" + get_prefix();
				break;
			case "math_inline":
				//compiled += `![${token.content}](https://render.githubusercontent.com/render/math?math=${encode(token.content)})`;
				compiled += `<img alt="${token.content}" src="https://render.githubusercontent.com/render/math?math=${encode(token.content)}" style="transform: translateY(20%);" />`;
				break;
			case "code_inline":
				compiled += `${token.markup}${token.content}${token.markup}`
				break;
			case "em_open":
			case "em_close":
			case "strong_open":
			case "strong_close":
				compiled += token.markup;
				break;
			case "link_open":
				assert(token.attrs[0][0] == "href");
				link_stack.push(token.attrs[0][1]);
				compiled += "[";
				break;
			case "link_close":
				compiled += `](${link_stack.pop()})`;
				break;
			case "blockquote_open":
				line_stack.push("> ");
				break;
			case "blockquote_close":
				{
					let r = new RegExp(`\n${escape_re(get_prefix())}\n$`);
					line_stack.pop();
					// todo: + "\n"; here and at list closes? Would be more pretty but would require more logic to trim newlines.
					compiled = compiled.replace(r, `\n${get_prefix()}\n`);
				}
				break;
			case "bullet_list_open":
				{
					let r = new RegExp(`\n${escape_re(get_prefix())}\n$`);
					compiled = compiled.replace(r, "\n");
					line_stack.push(0);
				}
				break;
			case "bullet_list_close":
				line_stack.pop();
				break;
			case "ordered_list_open":
				{
					let r = new RegExp(`\n${escape_re(get_prefix())}\n$`);
					compiled = compiled.replace(r, "\n");
					line_stack.push(1);
				}
				break;
			case "ordered_list_close":
				line_stack.pop();
				break;
			case "list_item_open":
				break;
			case "list_item_close":
				{
					let r = new RegExp(`\n${escape_re(get_prefix())}\n$`);
					compiled = compiled.replace(r, "\n");
					if(typeof line_stack[line_stack.length - 1] != "string" && line_stack[line_stack.length - 1] != 0) {
						line_stack[line_stack.length - 1]++;
					}
				}
				break;
			case "fence":
				assert(token.markup == "```", "code fence", token);
				compiled += `${token.markup}${token.info}\n${token.content}${token.markup}\n\n`;
				break;
			default:
				assert(false, "false", token);
		}
	}
	compiled = compiled.replace(/ +$/gm, ""); // stray space at end of line
	compiled = compiled.replace(/\n\n$/, "\n"); // double newline at end of file
	return compiled;
}

+function() {
	let argv = process.argv.slice(2);
	if(argv[0] == "--help" || argv.length == 0 || argv.length > 3) {
		console.log("usage: markdown-math-gh-compiler <input> [[-o] output]");
		process.exit(1);
	}
	// very quick and dirty command line parsing
	let [source, target, x] = argv;
	if(target == "-o") {
		target = x;
	} else if(target != undefined && x != undefined) {
		console.log("usage: markdown-math-gh-compiler <input> [[-o] output]");
		process.exit(1);
	}
	let data = fs.readFileSync(source).toString("utf8");
	let tokens = md.parse(data, {});
	let compiled = translate(tokens);
	if(target) {
		fs.writeFileSync(target, compiled);
	} else {
		console.log(compiled);
	}
	if(global.failed_assertions > 0) {
		console.error(`-- ${global.failed_assertions} failed assertions --`);
		process.exit(1);
	}
}();
