import * as fs from "fs";
import * as vscode from "vscode";
import { Config } from "./config";
import { print,error } from "./src";
import * as path from "path";

let html:string[] = [];
let css:string[] = [];
let sizes:string[] = [];
let count:number = 0;
let _config:Config;
let _webview:vscode.Webview;


async function readFile(fname:string):Promise<string> {
    try {
        return (await fs.promises.readFile(fname)).toString();
    } catch ( e ) { 
        error((e as Error).message); 
        return "";
    }
}

async function writeFile(fname:string, data:string):Promise<boolean> {
    try {
        await fs.promises.writeFile(fname, data);
        return false;
    } catch ( e ) {
        error((e as Error).message);
        return true;
    }
}

async function readDir(dir_path:string):Promise<string[]> {
    try {
        return await fs.promises.readdir(dir_path);
    } catch( e ) {
        error((e as Error).message);
        return [];
    }
}

async function getErrorHtml():Promise<string> {
    return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width>\n</head>\n<body>\n<h1>ERROR</h1>\n</body>\n</html>\n`;
}

async function formatMain(main:string):Promise<string> {
    let styles:string[] = []
    for (let file of _config.cssFiles) {
        styles.push(`<link rel="stylesheet" href="${_webview.asWebviewUri(vscode.Uri.file(file))}">`);
    }

    let scripts:string[] = [];
    for (let file of _config.scriptFiles) {
        scripts.push(`<script src="${_webview.asWebviewUri(vscode.Uri.file(file))}"></script>`);
    }

    main = main.replace("STYLES", styles.join("\n        "));
    main = main.replace("CONTENTS", html.join("\n").trim());
    main = main.replace("CSS", css.join("\n        ").trim());
    main = main.replace("SIZES", sizes.join(",").trim());
    main = main.replace("SCRIPTS", scripts.join("\n        "));
    // reseting the values
    html = [];
    css = [];
    sizes = [];
    count = 0;
    return main;
}
async function formatSource(source:string):Promise<string> {
    let keywords = new Map<string, string>([
        ["URI", _webview.asWebviewUri(vscode.Uri.file(_config.configFile)).toString().replace(_config.configFile, "")],
        ["BACKSLASH", "\\"]
    ]);
    let before:string = "";
    let after:string = "";
    let val:string|undefined;
    let s:number;
    //print(`source: ${source}`);
    let last_s:number = 0;
    print("before loop")
    while (true) {
        s = source.slice(last_s, source.length).search(/\{([^)]+)\}/);
        last_s = s;
        if (s !== -1) {
            before = source.slice(0, s);
            after = source.slice(source.indexOf("}", s)+1, source.length);
            val = keywords.get(source.slice(s+1, source.indexOf("}", s)));
            if (val !== undefined) { 
                source = before.concat(val, after);
            }
        } else { break; }
    }
    print("after loop")
    return source;
}

class content {
    _locations:string[] = [];
    _contents:any[] = [];
    _styles:string[] = [];
    _source:string = "";
    _sizes:number[] = [];
    constructor(obj:any) {
        if (typeof obj !== "string") {
            if (obj.right !== undefined && obj.left !== undefined) {
                this._locations.push("right");
                this._contents.push(new content(obj.right));
                this._locations.push("left");
                this._contents.push(new content(obj.left));
            } else if (obj.top !== undefined && obj.bottom !== undefined) {
                this._locations.push("top");
                this._contents.push(new content(obj.top));
                this._locations.push("bottom");
                this._contents.push(new content(obj.bottom));
            } else if (obj.only !== undefined) {
                this._locations.push("only");
                this._contents.push(new content(obj.only));
            } else {
                throw new SyntaxError(`undefined location specifier, also could be "top" or "right" without corresponding "bottom" or "left"`);
            }
            if (obj.style !== undefined) {
                if (typeof obj.style !== "string") {
                    throw new SyntaxError(`"style" must be string`);
                } else { this._styles.push(obj.style); }
            }
        } else { this._source = obj.toString(); }
    }

    async setSizes(level:number=0) {
        let this_level:number = level;
        for (let obj of this._contents) {
            if (typeof obj !== "string") {
                if (obj._styles.length) {
                    for (let j = 0; j< obj._styles.length; j++) {
                        let components:string[] = obj._styles[j].split(";");
                        let to_remove:number[] = [];
                        for (let i = 0; i < components.length; i++) {
                            if (components[i].indexOf("size") !== -1) {
                                this._sizes.push(+(components[i].trim().slice(components[i].indexOf(":")+1, components[i].length)).trim());
                                to_remove.push(i);
                                break;
                            }
                        }
                        for (let num of to_remove) { components.splice(num, 1); }
                        obj._styles[j] = components.join(";");
                        if (to_remove.length) { break; }
                    }
                }
                if (this._sizes[0] !== undefined) {
                    if (this._sizes.length < 2) {
                        this._sizes.push(1 - this._sizes[0]);
                    } else {
                        this._sizes[1] = 1 - this._sizes[0];
                    }
                }
                await obj.setSizes(level=this_level+1);
            }
        }
    }

    async perculate_styles(level:number=0) {
        let this_level:number = level;
        print(`On level: ${this_level}`);
        print(`${this_level} 1`);
        for (let obj of this._contents) {
            print(`${this_level} 2`);
            if (obj === content.prototype) {
                print(`${this_level} 3`);
                if (obj._styles.length) {
                    print(`${this_level} 4`);
                    this._styles = this._styles.concat(obj._styles);
                    print(`${this_level} 5`);
                    obj._styles = [];
                }
                print(`${this_level} 6`)
                await obj.perculate_styles(level=this_level+1);
                print(`${this_level} 7`);
            } else {
                print(`${this_level} 8`);
                print(`obj:${obj}`);
            }
            print(`${this_level} 9`);
        }
        print(`${this_level} 10`);
        print(`exiting this_level: ${this_level}`)
        return;
    }

    async getHtml(level:number=0) {
        let this_level:number = level;
        for (let i = 0; i < this._locations.length; i++) {
            let pre:string = "";
            for (let j = 0; j < level*4 + 12; j++) {
                pre = pre.concat(" ");
            }
            if (this._locations[i] !== "only") {
                count++;
                html.push(`${pre}<div class="resizable-${this._locations[i]}"  id="win${count}">`);
                if (this._sizes[i] !== undefined) {
                    sizes.push(`"win${count}":${this._sizes[i]}`);
                }
                if (this._styles[i] !== undefined) {
                    css.push(`        #win${count} {${this._styles[i]}}`);
                }
            }
            if (this._contents[i]._source.length) {
                print("formatting sorce")
                html.push(`${pre}    ${await formatSource(this._contents[i]._source)}`);
            } else {
                await this._contents[i].getHtml(this_level+1, this_level+1);
            }
            if (this._locations[i] !== "only") {
                html.push(`${pre}</div>`);
            }
        }
    }

    async show(level:number=0) {
        let this_level:number = level;
        for (let i = 0; i < this._locations.length; i++) {
            let msg:string = "";
            for (let j = 0; j < this_level*4; j++) { msg = msg.concat(" "); }
            msg = msg.concat(`${this._locations[i]} `);
            if (i < this._styles.length) { msg = msg.concat(`style=${this._styles[i]} `); } 
            if (i < this._sizes.length) { msg = msg.concat(`size=${this._sizes[i]} `); } 
            if (this._contents[i]._source.length) { msg = msg.concat(`src=${this._contents[i]._source}`);  }
            print(`${this_level} ${msg}`);
            await this._contents[i].show(level=this_level+1);
        }
    }
}

export async function genHtml(webview:vscode.Webview, config:Config):Promise<string> {
    // let format_file:string = "format.html";
    // let direction_file:string = "directions.json";
    // let out_file:string = "out.html";
    _config = config;
    _webview = webview;
    print(`Reading format from: ${config.mainHtmlFormatFile}`);
    let format:string = (await fs.promises.readFile(config.mainHtmlFormatFile)).toString();
    
    // try {  
        print(`Reading layout from ${config.layoutFile}`);
        let directions = JSON.parse((await fs.promises.readFile(config.layoutFile)).toString());
        // must be in this order
        print("constructing")
        let obj:content = new content(directions);
        print("setting sizes")
        await obj.setSizes();
        print("setting styles")
        await obj.perculate_styles();
        print("getting html")
        await obj.getHtml();
        print("");
        await obj.show();
        format = await formatMain(format);
        // for testing puposes
        if (true) {
            try {
                print(`Writing to: ${config.testCompiledHtmlFile}`);
                await fs.promises.writeFile(config.testCompiledHtmlFile, format);
            } catch ( e ) {
                error(`caught in writing compiled html to file: ${(e as Error).message}`);
            }
        }
    // } catch ( e ) {
    //     error((e as Error).message);
    //     return getErrorHtml();
    // }

    return format;
}