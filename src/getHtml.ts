import * as fs from "fs";
import * as os from "os";
import * as vscode from "vscode";
import { Config } from "./config";
import { print, error } from "./src";

// global variables (here for ease of use in recursion)
let html:string[] = [];
let css:string[] = [];
let sizes:string[] = [];
let count:number = 0;
let _config:Config;
let _webview:vscode.Webview;

/**
 * Turns inputted file path into a uri using the current webview panel
 * @param path : file path to turn into a uri
 * @returns file path as a uri
 */
async function uriIfy(path:string):Promise<string> {
    return _webview.asWebviewUri(vscode.Uri.file(path)).toString();
}

/**
 * Formats an inputted template of html to be displayed
 * @param main : string representation of an html format to use
 * @returns html to display
 */
async function formatMain(main:string):Promise<string> {
    // creating html for the css files
    let styles:string[] = [];
    for (let file of _config.cssFiles) {
        styles.push(`<link rel="stylesheet" href="${await uriIfy(file)}">`);
    }

    // creating html for the java script files
    let scripts:string[] = [];
    for (let file of _config.scriptFiles) {
        scripts.push(`<script src="${await uriIfy(file)}"></script>`);
    }

    // inserting joined lists at the prescribed location is the provided format
    // print(`Replacing content with item of len:${html.length}`);
    main = main.replace("STYLES", styles.join("\n        "));
    main = main.replace("CONTENTS", html.join("\n").trim());
    main = main.replace("CSS", css.join("\n        ").trim());
    main = main.replace("SIZES", sizes.join(",").trim());
    main = main.replace("SCRIPTS", scripts.join("\n        "));

    // resetting the values, if you do not do this, things get messy
    html = [];
    css = [];
    sizes = [];
    count = 0;
    scripts = [];
    styles = [];
    return main;
}

async function adjustUri(uri:string, fpath:string):Promise<string> {
    // accounting for windows weird file path norms
    if (os.platform() === "win32") {
        fpath = fpath.slice(fpath.indexOf(":")+1, fpath.length);
        fpath = fpath.replace(/\\/gi, "/");
    }
    uri = uri.replace(fpath, "");
    return uri;
}

/**
 * Formats the provided html by replacing keywords with html, the map in the function for the keywords
 * @param source : some html to be formatted
 * @returns the inputted html with the key words replaced
 */
async function formatSource(source:string):Promise<string> {
    // the keywords to replace in the inputted string, in the string these keywords must be surrounded by brackets
    // i.e. the syntax is {KEYWORD}
    let keywords = new Map<string, string>([
        ["URI", await adjustUri((await uriIfy(_config.configDir)).toString(), _config.configDir)] // uri for this viewer
    ]);
    let before:string = "";
    let after:string = "";
    let val:string|undefined;
    let s:number;
    let lastS:number = 0;

    // used to limit the number of iterations the while loop can do
    let stop:number = 1000000;
    let i:number = 0;
    while (true) {
        // parsing the source and replacing keywords
        // reads from the last read to the end and searches for brackets surrounding something
        s = lastS + source.slice(lastS, source.length).search(/\{([^)]+)\}/);
        // if the search found something
        if (s - lastS !== -1) {
            // split the string and stuff
            before = source.slice(0, s);
            after = source.slice(source.indexOf("}", s)+1, source.length);
            val = keywords.get(source.slice(s+1, source.indexOf("}", s)).trim());
            //print(`${before}|${val}|${after}`)
            if (val !== undefined) { source = before.concat(val, after); } 
            else { s++; }
        } else { break; }
        lastS = s;

        // caps the iterations just in case it runs away
        if (i === stop) { 
            error("hit iteration limit in format source, reduce number of keywords to replace");
            break; 
        }
        i++;

    }
    // returns the input string with the keywords replaced
    return source;
}

// main class, this does all of the html generation and json parsing
class Content {
    _locations:string[] = [];
    _contents:any[] = [];
    _styles:string[] = [];
    _source:string = "";
    _sizes:number[] = [];

    /**
     * Constructs the class from a json object, this heavily uses recursion
     * @param obj A json object
     */
    constructor(obj:any) {
        // if the object is not a string then it is a json object
        if (typeof obj !== "string") {
            // making sure "left" and "right" is not with "top" and "bottom"
            if ((obj.right !== undefined || obj.left !== undefined) && (obj.top !== undefined || obj.bottom !== undefined)) {
                throw new SyntaxError(`left and right can not be on the same level as top and bottom`);
            }
            // if tiling horizontally
            if (obj.right !== undefined && obj.left !== undefined) {
                this._locations.push("right");
                this._contents.push(new Content(obj.right)); // creating right tile
                this._locations.push("left");
                this._contents.push(new Content(obj.left)); // creating left tile
            // if tiling vertically
            } else if (obj.top !== undefined && obj.bottom !== undefined) {
                this._locations.push("top");
                this._contents.push(new Content(obj.top)); // creating top tile
                this._locations.push("bottom");
                this._contents.push(new Content(obj.bottom)); // creating bottom tile
            // if not tiling at all
            } else if (obj.only !== undefined) {
                this._locations.push("only");
                this._contents.push(new Content(obj.only)); // creating content
            } else {
                throw new SyntaxError(`undefined location specifier, also could be "top" or "right" without corresponding "bottom" or "left"`);
            }
            // if "style" was provided as an argument
            if (obj.style !== undefined) {
                // if not is not a string, no good
                if (typeof obj.style !== "string") {
                    throw new SyntaxError(`"style" must be string`);
                } else {
                    // parsing style to get size because that goes somewhere else and not in css
                    let components:string[] = obj.style.split(";");
                    let toRemove:number[] = [];
                    for (let i = 0; i < components.length; i++) {
                        if (components[i].indexOf("size") !== -1) {
                            // getting the size string and then converting it to a float
                            this._sizes.push(+(components[i].trim().slice(components[i].indexOf(":")+1, components[i].length)).trim());
                            toRemove.push(i);
                            break;
                        }
                    }
                    // rejoining the css style
                    for (let num of toRemove) { components.splice(num, 1); }
                    this._styles.push(components.join(";")); 
                }
            }
        // if the object is a string, then it is html and setting this pane's html to it
        } else { this._source = obj.toString(); }
    }

    /**
     * shifts _styles and _sizes up to the parent object recursively
     * @param level : current level of recursion
     */
    async percolate(level:number=0) {
        let thisLevel:number = level;
        for (let obj of this._contents) {
            if (typeof obj !== "string") {
                if (obj._styles.length) {
                    // shifting the styles and sizes
                    this._styles = this._styles.concat(obj._styles);
                    this._sizes = this._sizes.concat(obj._sizes);
                    // erasing the styles and sizes of the object
                    obj._styles = [];
                    obj._sizes = [];
                }
                await obj.percolate(level=thisLevel+1); // recursion
            }
        }
        // setting the sizes
        if (this._sizes[0] !== undefined) {
            // setting the size of the second pane from the first, this will override the other pane's specified size
            if (this._sizes.length < 2) {
                this._sizes.push(1 - this._sizes[0]);
            } else {
                this._sizes[1] = 1 - this._sizes[0];
            }
        }
        return;
    }

    /**
     * generates html from this class and its subclasses, recursively
     * @param level : current level of recursion
     */
    async getHtml(level:number=0) {
        let thisLevel:number = level;
        for (let i = 0; i < this._locations.length; i++) {
            let pre:string = "";
            // creating a spacer based on the level of recursion
            // used for pretty formatting
            for (let j = 0; j < level*4 + 12; j++) {
                pre = pre.concat(" ");
            }
            // if supposed to tile
            if (this._locations[i] !== "only") {
                count++;
                // creating the html and setting window to the count for later purposes
                html.push(`${pre}<div class="resizable-${this._locations[i]}"  id="win${count}">`);
                // setting size if it is defined
                if (this._sizes[i] !== undefined) {
                    sizes.push(`"win${count}":${this._sizes[i]}`);
                }
                // setting css style of pane is defined
                if (this._styles[i] !== undefined) {
                    // the spacing are just a formatting choice, it makes pretty html
                    css.push(`        #win${count} {${this._styles[i]}}`);
                }
            }
            // if there is source html
            if (this._contents[i]._source.length) {
                // "pre" and the spacing are just a formatting choice, it makes pretty html
                html.push(`${pre}    ${await formatSource(this._contents[i]._source)}`);
            } else {
                await this._contents[i].getHtml(thisLevel+1); // recursion
            }
            // ends the div previously created
            if (this._locations[i] !== "only") {
                // "pre" is a formatting choice, it makes pretty html
                html.push(`${pre}</div>`);
            }
        }
    }

    /**
     * prints the object, recursively
     * @param level : current level of recursion
     */
    async show(level:number=0) {
        let thisLevel:number = level;
        for (let i = 0; i < this._locations.length; i++) {
            // creating message with all of the attributes of this class
            let msg:string = "";
            for (let j = 0; j < thisLevel*4; j++) { msg = msg.concat(" "); }
            msg = msg.concat(`${this._locations[i]} `);
            if (i < this._styles.length) { msg = msg.concat(`style=${this._styles[i]} `); } 
            if (i < this._sizes.length) { msg = msg.concat(`size=${this._sizes[i]} `); } 
            if (this._contents[i]._source.length) { msg = msg.concat(`src=${this._contents[i]._source}`);  }
            print(`${thisLevel} ${msg}`);
            await this._contents[i].show(level=thisLevel+1); // recursion
        }
    }
}

export async function genHtml(webview:vscode.Webview, config:Config):Promise<string> {
    // setting the global vars to the inputs so the recursive class can use them
    _config = config;
    _webview = webview;
    // reading from the main format file to get an html template
    print(`Reading format from: ${config.mainHtmlFormatFile}`);
    let format:string = (await vscode.workspace.fs.readFile(vscode.Uri.file(config.mainHtmlFormatFile))).toString();
    
    try {
        print(`Reading layout from ${config.layoutFile}`);
        // parsing the json
        let directions = JSON.parse((await vscode.workspace.fs.readFile(vscode.Uri.file(config.layoutFile))).toString());
        // starting the recursive class that generates the html
        // must be in this order
        let obj:Content = new Content(directions);
        // shifting all of the styles and sizes to their corresponding pane
        await obj.percolate();
        // generating the html from the class, recursively
        await obj.getHtml();
        // printing it out
        //await obj.show();

        // formatting the html template, replaces keywords
        format = await formatMain(format);

        // putting the time string in the html so that it forces html to update the webview html
        // (guarantees the html to be different)
        format = `<!--${(new Date()).toString()}-->\n${format}`;
        
        // for testing purposes, outputs the html that will be sent to the panel to a file if I want it to
        if (config.outputHtml) {
            try {
                print(`Writing to: ${config.testCompiledHtmlFile}`);
                await fs.promises.writeFile(config.testCompiledHtmlFile, format);
            } catch ( e ) {
                error(`caught in writing compiled html to file: ${(e as Error).message}`);
            }
        }
        return format;
    } catch ( e ) { 
        error((e as Error).message); 
        return "";
    }
}