import * as vscode from "vscode"
import * as path from 'path';
import * as fs from "fs"
import { Config } from "./config";
import * as src from "./src"

export function compile_html(config:Config) {
    let state_format:string = fs.readFileSync(config.stateHtmlFormatFile).toString();
    let image_format:string = fs.readFileSync(config.imageHtmlFormatFile).toString();
    let state_data:string = "";
    try {
        if (fs.existsSync(config.stateDataFile)){
            state_data = fs.readFileSync(config.stateDataFile).toString();
        }
    } catch ( e ) {
        src.error(`error reading from state_data file, with message ${e}`);
        return;
    } 

    let arr:string[] = [];
    for (let line of state_data.split("\n")) {
        arr.push(line.replace(":", "&").replace("j", "\\mathrm{i}"));
    }
    try {
        fs.writeFileSync(config.outStateHtmlFile, state_format.replace("INSERT_HERE", arr.join("\\\\")).replace("MATH_JS", config.mathJS));
    } catch ( e ) {
        src.error(`error writing to state html file, with message ${e}`);
        return;
    }
    // , (err) => {
    //     if (err) {
    //         src.print(`error compiling to state file with message ${err.message}`);
    //         return;
    //     }
    // });
    
    arr = [];
    for (let file of fs.readdirSync(config.configDir)) {
        if (file.endsWith(config.validImageExt)) {
            arr.push(`<img src="${path.join(config.configDir, file)}" alt="could not find image">`)
        }
    }
    if (!arr.length) {
        arr.push(`<img src="${config.noDataImage}" alt="no image available">`);
    }
    try {
        fs.writeFileSync(config.outImageHtmlFile, image_format.replace("INSERT_HERE", arr.join("\n")));
    } catch ( e ) {
        src.error(`error writing to image html file, with message ${e}`);
        return;
    }
    // , (err) => {
    //     if (err) {
    //         src.print(`error compiling to state file with message ${err.message}`);
    //         return;
    //     }
    // });
    return;
}

// only loads png files from config_dir
export function get_main_html(config:Config):string {
    let main_format:string = "";
    compile_html(config);
    try {
        main_format = fs.readFileSync(config.mainHtmlFormatFile).toString();
    } catch ( e ) {
        src.error(`error reading fr file, with message ${e}`);
        return "";
    }

    main_format = main_format.replace("STATE_PATH", config.outStateHtmlFile).replace("IMAGE_PATH", config.outImageHtmlFile);
    return main_format;

}