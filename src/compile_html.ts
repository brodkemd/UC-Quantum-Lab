import * as vscode from "vscode"
import * as path from 'path';
import * as fs from "fs"
import { Config } from "./config";
import * as src from "./src"

async function readFile(fname:string):Promise<string> {
    let contents:string = "";
    fs.readFile(fname, (err, file)=> {
        if (err) {
            src.error(`can not read file ${fname}, with message ${err.message}`);
            return;
        } else {
            contents = file.toString();
        }
    });
    return contents;
}

async function writeFile(fname:string, data:string):Promise<boolean> {
    let to_return:boolean = true;
    fs.writeFile(fname, data, (err) => {
        if (err) {
            src.error(`can not write to ${fname}, with message ${err.message}`);
            to_return = false;
        }
    });
    return to_return;
}

async function readDir(dir_path:string):Promise<string[]> {
    let to_return:string[] = [];
    fs.readdir(dir_path, (err, files)=>{
        if (err) {
            src.error(`can not read config dir, with message ${err.message}`);
            return;
        } else {
            to_return = files;
        }
    });
    return to_return;
}

export async function compile_html(config:Config):Promise<string> {
    //<frame src = "STATE_PATH" name = "menu_page" scrolling="yes"/>
    //<frame src = "IMAGE_PATH" name = "main_page" scrolling="yes"/>
    src.print("Compiling html");
    let frames:string[] = [];
    let cols:string[] = [];

    let arr:string[] = [];
    if (config.userConfig.showStateVector) {
        let state_format:string = await readFile(config.stateHtmlFormatFile);
        if (!(state_format.length)) {return ""};
        // fs.readFile(config.stateHtmlFormatFile, (err, file)=> {
        //     if (err) {
        //         src.error(`can not read file ${config.stateHtmlFormatFile}`);
        //         return;
        //     } else {
        //         state_format = file.toString();
        //     }
        // });
        let state_data:string = "";
        src.print("Reading state data file")
        if (fs.existsSync(config.stateDataFile)) {
            state_data = await readFile(config.stateDataFile);
            if (!(state_data.length)) { return ""; }
            // fs.readFile(config.stateDataFile, (err, file)=>{
            //     if (err) {
            //         src.error(`can not read file ${config.stateDataFile}`);
            //         return;
            //     } else {
            //         state_data = file.toString();
            //     }
            // });
            for (let line of state_data.split("\n")) {
                arr.push(line.replace(":", "&").replace("j", "\\mathrm{i}"));
            }
    
            let exit_code = await writeFile(config.outStateHtmlFile, state_format.replace("INSERT_HERE", arr.join("\\\\")).replace("MATH_JS", config.mathJS));
            // fs.writeFile(config.outStateHtmlFile, state_format.replace("INSERT_HERE", arr.join("\\\\")).replace("MATH_JS", config.mathJS), (err) => {
            //     if (err) {
            //         src.error(`can not write to ${config.outStateHtmlFile}, with message ${err.message}`);
            //     }
            // });
            frames.push(`<frame src = "${config.outStateHtmlFile}" name = "state page" scrolling="yes"/>`);
            cols.push("200");
        } else {
            src.print(`State data file ${config.stateDataFile} does not exist, skipping`)
        }       

    } else {
        src.print("omitting state vector from viewer");
    }

    if (config.userConfig.showCirc || config.userConfig.showHistogram) {
        let image_format:string = await readFile(config.imageHtmlFormatFile);
        if (!(image_format.length)) { return "";}
        // fs.readFile(config.imageHtmlFormatFile, (err, file) => {
        //     if (err) {
        //         src.error(`can not read file ${config.imageHtmlFormatFile}`);
        //         return;
        //     } else {
        //         image_format = file.toString();
        //     }
        // });
        arr = [];
        for (let file of await readDir(config.configDir)) {
            if (file.endsWith(config.validImageExt)) {
                arr.push(`<img src="${path.join(config.configDir, file)}" alt="could not find image">`);
            }
        }
        // fs.readdir(config.configDir, (err, files)=>{
        //     if (err) {
        //         src.error(`can not read config dir, with message ${err.message}`);
        //         return;
        //     } else {
        //         for (let file of files) {
        //             if (file.endsWith(config.validImageExt)) {
        //                 arr.push(`<img src="${path.join(config.configDir, file)}" alt="could not find image">`)
        //             }
        //         }
        //     }
        // });

        if (!arr.length) {
            arr.push(`<img src="${config.noDataImage}" alt="no image available">`);
        }
        let exit_code:boolean = await writeFile(config.outImageHtmlFile, image_format.replace("INSERT_HERE", arr.join("\n")));
        if (exit_code) {return "";}
        frames.push(`<frame src = "${config.outImageHtmlFile}" name = "image page" scrolling="yes"/>`);
        cols.push("*");
        // fs.writeFile(config.outImageHtmlFile, image_format.replace("INSERT_HERE", arr.join("\n")), (err)=>{
        //     if (err) {
        //         src.error(`error writing to image html file, with message ${err.message}`);
        //         return;
        //     } else {
        //         frames.push(`<frame src = "${config.outImageHtmlFile}" name = "image page" scrolling="yes"/>`)
        //         cols.push("*");
        //         return;
        //     }
        // });
    } else {
        src.print("omitting images from viewer");
    }
    src.print("reading in main html content")
    let main_format:string = await readFile(config.mainHtmlFormatFile);
    
    // fs.readFile(config.mainHtmlFormatFile, (err, file)=>{
    //     if (err) {
    //         src.error(`error reading main format file, with message ${err.message}`);
    //         return;
    //     } else {
    //         src.print("here");
    //         main_format = file.toString();
    //     }
    // });
    src.print(`source:${main_format}`);
    main_format = main_format.replace("COLS", cols.join(", "));
    main_format = main_format.replace("FRAMES", frames.join("\n"));

    src.print(`source:${main_format}`);
    return main_format;
}

async function test_html(config:Config):Promise<string> {
    try {
        return fs.readFileSync(config.testHtmlFile).toString();
    } catch ( e ) {
        src.error(`error reading fr file, with message ${e}`);
        return "";
    }
}