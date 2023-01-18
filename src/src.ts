import * as path from 'path';
//import * as fs from "fs";
import * as vscode from 'vscode';
// import * as cp from "child_process";
// import * as util from "util";

// const execProm = util.promisify(cp.exec);

//Create output channel
export let out = vscode.window.createOutputChannel("UC_Q");

// declaring print function (because I am lazy)
export function print(msg:string) { out.appendLine(`- ${msg}`); }

/**
 * trims everything but the last file/directory of a path
 * @param _path : string representation of a path
 * @returns : input path with the all but the file/directory removed
 */
export function getLastFromPath(_path:string) {
    return _path.slice(_path.lastIndexOf(path.sep)+1, _path.length);
}

/**
 * Sends an error message to the user
 * @param msg : error message to send to the user
 */
export function error(msg:string) {
    print(`Error: ${msg}`);
    vscode.window.showErrorMessage(msg);
    throw new Error(msg);
}

/**
 * Sends a warning message to the user
 * @param msg : warning message to send to the user
 */
export function warn(msg:string) {
    print(`Warning: ${msg}`);
    vscode.window.showWarningMessage(msg);
}

/**
 * Sends an info message to the user
 * @param msg : info message to send to the user
 */
export function info(msg:string) {
    print(`Info: ${msg}`);
    vscode.window.showInformationMessage(msg);
}

/**
 * delays the execution of the code by the specified milliseconds
 * @param ms : time in milliseconds to delay
 * @returns a promise function that delays the code
 */
export async function delay(ms: number) { return new Promise( resolve => setTimeout(resolve, ms)); }

/*
Deprecated

*/

/**
 * Executes a commands and returns a boolean indicating if it succeeded
 * @param command : string to execute on the system
 * @returns a boolean indicating if the command succeeded
 */
// export async function tryCommand(command:string):Promise<boolean> {
//     let toReturn:boolean = false;
//     try {
//         await execProm(command).then(
//             (err) => {
//                 if (err.stderr.length) {
//                     // ignores deprecation error
//                     if (err.stderr.indexOf("ERROR") === -1) {
//                         if (err.stderr.indexOf("DEPRECATION") === -1 && err.stderr.indexOf("WARNING") === -1) { // accounts for pip package problems
//                             toReturn = false; 
//                             print(`Encountered error "${err.stderr.replace("\n", " ")}" while running "${command}"`);
//                         } else {
//                             print(`Ignoring error "${err.stderr.replace("\n", " ")}" from command "${command}"`);
//                             toReturn = true;
//                         }
//                     } else {
//                         print(`Encountered error "${err.stderr.replace("\n", " ")}" while running "${command}"`);
//                     }
//                 } else { toReturn = true; }
//                 //else { error(`from try command ${err.stderr.toString()}`); }
//             }
//         );
//     } catch ( e ) {
//         print(`Encountered error "${(e as Error).message.replace("\n", " ")}" while running "${command}"`);
//         toReturn = false;
//     }
//     return toReturn;
// }

/*
Deprecated

*/

/**
 * Executes a commands and returns the stdout of the command
 * @param command : string to execute on the system
 * @returns a string that is the stdout of the command if no error was encountered
 */
//  export async function getOutputOfCommand(command:string):Promise<string> {
//     let toReturn:string = "";
//     try {
//         await execProm(command).then(
//             (err) => {
//                 if (err.stderr.length) {
//                     // ignores deprecation error
//                     if (err.stderr.indexOf("ERROR") === -1) {
//                         if (err.stderr.indexOf("DEPRECATION") === -1 && err.stderr.indexOf("WARNING") === -1) { // accounts for pip package problems
//                             print(`Encountered error "${err.stderr.replace("\n", " ")}" while running "${command}"`);
//                             return;
//                         } else {
//                             print(`Ignoring error "${err.stderr.replace("\n", " ")}" from command "${command}"`);
//                         }
//                     } else {
//                         print(`Encountered error "${err.stderr.replace("\n", " ")}" while running "${command}"`);
//                         return;
//                     }
//                 }
//                 // if here then no errors where encountered when running the command
//                 if (err.stdout.length) { toReturn = err.stdout; }
//             }
//         );
//     } catch ( e ) {
//         print(`Encountered error "${(e as Error).message.replace("\n", " ")}" while running "${command}"`);
//     }
//     return toReturn;
// }

/*
Deprecated

*/

/**
 * converts a version string to a float used to compare against another
 * @param version Semantic version string
 * @returns float of the version
 */
// export async function semanticVersionToNum(version:string):Promise<number> {
//     let toReturn:number = 0;
//     let base:number = 100;
//     let arr:string[] = version.split(".");
//     for (let i = 0; i < arr.length; i++) {
//         toReturn+= +arr[i]/(base**i);
//     }
//     //print(`Version to num: ${toReturn.toString()}`);
//     return toReturn;
// }

/*
Deprecated

*/

/**
 * Extracts the version string from the inputted string, returns the first one it comes across
 * @param s : string to extract the version from
 * @returns : the version string or nothing (if there is no version present)
 */
// export async function getVersionStringFrom(s:string):Promise<string> {
//     let m:string[]|null = s.match(/[0-9]+\.[0-9]+\.*[0-9]*/);
//     if (m !== null) {
//         return m[0].trim(); // the trim is for my peace of mind
//     } else { return "";  }
// }

/**
 * Determines if a file is in a directory
 * @param dirPath : directory path in string form
 * @param toFind : name of a file that you want to know if it is in dir_path
 * @returns boolean indicating if to_find is in dir_path
 */
export async function checkIfFileInDir(dirPath : string, toFind : string):Promise<boolean>  {
    try {
        // Loop them all with the new for...of
        for (const entry of await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath))){
            //Get the full paths
            // print(`entry:${entry[0]};${((await vscode.workspace.fs.stat(vscode.Uri.file(path.join(dirPath, entry[0])))).type) === vscode.FileType.File}`);
            if (entry[0] === toFind) {
                return true;
                // if(((await vscode.workspace.fs.stat(vscode.Uri.file(path.join(dirPath, entry[0])))).type) === vscode.FileType.File) { 
                //     return false; 
                // } else { return true; }
            }
        }
    // Catch anything bad that happens
    } catch( e ) { print(`caught error in check_if_file_in_dir: ${e}`); }
    // default return
    return false;
}

/**
 * Makes the provided directory
 * @param dir : string representation of a directory path to make
 * @returns if making the directory succeeded
 */
export async function mkDir(dir:string){
    //making config directory, catches errors, if no errors then continues to building

    try{
        vscode.workspace.fs.createDirectory(vscode.Uri.file(dir));
    } catch ( e ) {
        error(`while making "${dir}" with message ${(e as Error).message}`);
    }
    // fs.mkdir(dir, (err) => {
    //     if (err) {
    //         error(`Error making "${dir}" with message: ${err.message}`);
    //     }
    // });
}
