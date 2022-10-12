import * as vscode from "vscode"
import * as path from 'path';
import * as fs from "fs"
import { Config } from "./config";
import * as src from "./src"

async function readFile(fname:string):Promise<string> {
    try {
        return (await fs.promises.readFile(fname)).toString();
    } catch ( e ) { 
        src.error((e as Error).message); 
        return "";
    }
}

async function writeFile(fname:string, data:string):Promise<boolean> {
    try {
        await fs.promises.writeFile(fname, data);
        return false;
    } catch ( e ) {
        src.error((e as Error).message);
        return true;
    }
}

async function readDir(dir_path:string):Promise<string[]> {
    try {
        return await fs.promises.readdir(dir_path);
    } catch( e ) {
        src.error((e as Error).message);
        return [];
    }
}

export async function compile_html(config:Config):Promise<string> {
    //<frame src = "STATE_PATH" name = "menu_page" scrolling="yes"/>
    //<frame src = "IMAGE_PATH" name = "main_page" scrolling="yes"/>
    src.print("Compiling html");
    let frames:string[] = [];
    let cols:string[] = [];

    let arr:string[] = [];
    if (config.userConfig.showStateVector) {
        src.print("Including state vector");
        let state_format:string = await readFile(config.stateHtmlFormatFile);
        if (!(state_format.length)) {
            src.print("no data was returned from state data file");
            return "";
        }

        let state_data:string = "";
        src.print("Reading state data file")
        if (fs.existsSync(config.stateDataFile)) {
            state_data = await readFile(config.stateDataFile);
            if (!(state_data.length)) { return ""; }

            for (let line of state_data.split("\n")) {
                arr.push(line.replace(":", "&").replace("j", "\\mathrm{i}"));
            }
            
            let exit_code = await writeFile(config.outStateHtmlFile, state_format.replace("INSERT_HERE", arr.join("\\\\")).replace("MATH_JS", config.mathJS));
            if (exit_code) {
                src.error("Could not write data to state out html file");
                return "";
            }
            frames.push(`<frame src = "${config.outStateHtmlFile}" name = "state page" scrolling="yes"/>`);
            cols.push("200");
            src.print("done loading into state htmle file")
        } else {
            src.print(`State data file ${config.stateDataFile} does not exist, skipping`)
        }       

    } else {
        src.print("omitting state vector from viewer");
    }

    if (config.userConfig.showCirc || config.userConfig.showHistogram) {
        let image_format:string = await readFile(config.imageHtmlFormatFile);
        if (!(image_format.length)) { return "";}
        arr = [];
        for (let file of await readDir(config.configDir)) {
            if (file.endsWith(config.validImageExt)) {
                arr.push(`<img src="${path.join(config.configDir, file)}" alt="could not find image">`);
            }
        }


        if (!arr.length) {
            arr.push(`<img src="${config.noDataImage}" alt="no image available">`);
        }
        let exit_code:boolean = await writeFile(config.outImageHtmlFile, image_format.replace("INSERT_HERE", arr.join("\n")));
        if (exit_code) { return ""; }
        frames.push(`<frame src = "${config.outImageHtmlFile}" name = "image page" scrolling="yes"/>`);
        cols.push("*");

    } else {
        src.print("omitting images from viewer");
    }

    let styles:string[] = []
    for (let file of await readDir(config.cssFilesPath)) {
        if (file.endsWith(".css")) {
            styles.push(`<link rel="stylesheet" href="${path.join(config.cssFilesPath, file)}">`);
        }
    }

    if (frames.length) {
        src.print("reading in main html content")
        let main_format:string = await readFile(config.mainHtmlFormatFile);
        main_format = main_format.replace("STYLES", styles.join("\n"));
        main_format = main_format.replace("COLS", cols.join(", "));
        main_format = main_format.replace("FRAMES", frames.join("\n"));
        return main_format;
    } else {
        return "";
    }
}

async function test_html(config:Config):Promise<string> {
    try {
        return fs.readFileSync(config.testHtmlFile).toString();
    } catch ( e ) {
        src.error(`error reading fr file, with message ${e}`);
        return "";
    }
}