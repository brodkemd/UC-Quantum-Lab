/**
 * 
 * THIS FILE IS DEPRICATED, SEE genHtml.ts INSTEAD
 * 
 */


// import * as vscode from "vscode"
// import * as path from 'path';
// import * as fs from "fs"
// import { Config } from "./config";
// import * as src from "./src"

// async function readFile(fname:string):Promise<string> {
//     try {
//         return (await fs.promises.readFile(fname)).toString();
//     } catch ( e ) { 
//         src.error((e as Error).message); 
//         return "";
//     }
// }

// async function writeFile(fname:string, data:string):Promise<boolean> {
//     try {
//         await fs.promises.writeFile(fname, data);
//         return false;
//     } catch ( e ) {
//         src.error((e as Error).message);
//         return true;
//     }
// }

// async function readDir(dir_path:string):Promise<string[]> {
//     try {
//         return await fs.promises.readdir(dir_path);
//     } catch( e ) {
//         src.error((e as Error).message);
//         return [];
//     }
// }

// export async function compile_html(webview:vscode.Webview, config:Config):Promise<string> {
//     //<frame src = "STATE_PATH" name = "menu_page" scrolling="yes"/>
//     //<frame src = "IMAGE_PATH" name = "main_page" scrolling="yes"/>
//     config.userConfig.get(); // loads again after python executed
//     src.print(`Cofiguration: circ = ${config.userConfig.showCirc} hist = ${config.userConfig.showHistogram} state = ${config.userConfig.showStateVector}`);
//     src.print("Compiling html");

//     let imgFormat:string = `<div class="col-12 col-centered">\n<img src="SRC" alt="could not find image">\n</div>`

//     src.print("reading in main html content")
//     let main_format:string = await readFile(config.mainHtmlFormatFile);
//     let arr:string[] = [];
//     // if the statevector must be shown
//     if (config.userConfig.showStateVector) {
//         src.print("Including state vector");

//         let state_data:string = "";
//         src.print("Reading state data file")
//         if (fs.existsSync(config.stateDataFile)) {
//             state_data = await readFile(config.stateDataFile);
//             if (!(state_data.length)) { return ""; }

//             for (let line of state_data.split("\n")) {
//                  arr.push(line.replace(":", "&").replace("j", "\\mathrm{i}"));
//             }
//             main_format = main_format.replace("VECTOR", `\\[\\color{white}\\begin{matrix}${arr.join("\\\\")}\\end{matrix}\\]`)
//             main_format = main_format.replace("VECTOR", arr.join("\\\\")).replace("MATHJS", webview.asWebviewUri(vscode.Uri.file(config.mathJS)).toString());

//         } else {
//             src.print(`State data file ${config.stateDataFile} does not exist, setting no data in ui`);
//             main_format = main_format.replace("VECTOR", "<h1>No State data to display</h1>").replace("MATHJS", webview.asWebviewUri(vscode.Uri.file(config.mathJS)).toString());
//         }
//     } else {
//         src.print("omitting state vector from viewer");
//         main_format = main_format.replace("VECTOR", "").replace("MATHJS", webview.asWebviewUri(vscode.Uri.file(config.mathJS)).toString());
//     }
    
//     arr = [];
//     if (config.userConfig.showCirc){
//         src.print("including circuit image");
//         if (fs.existsSync(config.circImageFile)) {
//             arr.push(imgFormat.replace("SRC", webview.asWebviewUri(vscode.Uri.file(config.circImageFile)).toString()));
//         } else {
//             arr.push(imgFormat.replace("SRC", webview.asWebviewUri(vscode.Uri.file(config.noDataImage)).toString()));
//         }
//     } else {
//         src.print("omitting circ from viewer");
//     }

//     if (config.userConfig.showHistogram) {
//         src.print("including histogram");
//         if (fs.existsSync(config.histImageFile)) {
//             arr.push(imgFormat.replace("SRC", webview.asWebviewUri(vscode.Uri.file(config.histImageFile)).toString()));
//         } else {
//             arr.push(imgFormat.replace("SRC", webview.asWebviewUri(vscode.Uri.file(config.noDataImage)).toString()));
//         }
//     } else {
//         src.print("omitting hist from viewer");
//     }

//     if (!arr.length) {
//         arr.push(`<h1>No Images to Display</h1>`);
//     }

//     main_format = main_format.replace("IMAGES", arr.join("\n"));

//     let styles:string[] = []
//     for (let file of await readDir(config.cssFilesPath)) {
//         if (file.endsWith(".css")) {
//             styles.push(`<link rel="stylesheet" href="${webview.asWebviewUri(vscode.Uri.file(path.join(config.cssFilesPath, file)))}">`);
//         }
//     }

//     main_format = main_format.replace("STYLES", styles.join("\n"));
    
//     // for testing puposes
//     if (true) {
//         try {
//             await fs.promises.writeFile(config.testCompiledHtmlFile, main_format);
//         } catch ( e ) {
//             src.error(`caught in writing compiled html to file: ${(e as Error).message}`);
//         }
//     }
//     // main_format = main_format.replace("COLS", cols.join(", "));
//     // main_format = main_format.replace("FRAMES", frames.join("\n"));
//     return main_format;
// }

// export async function test_html(config:Config):Promise<string> {
//     try {
//         return fs.readFileSync(config.testHtmlFile).toString();
//     } catch ( e ) {
//         src.error(`error reading fr file, with message ${e}`);
//         return "";
//     }
// }