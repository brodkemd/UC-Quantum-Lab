import * as path from 'path';
import * as fs from "fs"
import * as cp from "child_process";
import * as util from "util";
import { Config } from './config';
const execProm = util.promisify(cp.exec);

//Create output channel
export function print(msg:string) { console.log(`- ${msg}`); }

export type infoInnerType = {"path" : string, "exe" : string, "pip" : string, "has_qiskit" : boolean}
export type infoType = {[name:string] : infoInnerType};

export type configType = {[key : string] : string|boolean};

export function get_last_from_path(_path:string) {
    return _path.slice(_path.lastIndexOf(path.sep)+1, _path.length);
}

export function error(msg:string) {
    print(`Error: ${msg}`);
}

export async function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

// export async function try_command(command:string):Promise<boolean> {
//     print(`Trying command "${command}"`);
//     let to_return:boolean = false;
//     try {
//         await execProm(command).then(
//             (err) => {
//                 if (err.stderr.length) {
//                     if (err.stderr.indexOf("DEPRECATION") === -1) { // accounts for pip package problems
//                         to_return = false; 
//                         print(`Encountered error "${err.stderr.toString()}"`);
//                     } else {
//                         print(`ignoring error "${err.stderr.toString()}"`);
//                         to_return = true;
//                     }
//                 }
//                 else { to_return = true; }
//                 //else { error(`from try command ${err.stderr.toString()}`); }
//             }
//         );
//     } catch ( e ) {
//         print(`caught "${(e as Error).message}" in try command`);
//         to_return = false;
//     }
//     return to_return;
// }

// export async function wait_for_trigger_file(config:Config) {
//     while (true) {
//         if (await fs.existsSync(config.triggerFile)) { break; } 
//         else { await delay(100); }
//     }
//     try { 
//         print("removing trigger file");
//         await fs.promises.rm(config.triggerFile); 
//     } 
//     catch ( e ) {
//         error(`caught error in waiting for trigger file: ${(e as Error).message}`);
//     }
// }   

// export async function get_version_of_python_module_with_name(pip:string, module:string):Promise<string> {
//     let to_return:string = "";
//     try {
//         await execProm(`${pip} show ${module}`).then(
//             (err) => {
//                 if (err.stdout.length) { 
//                     let arr:string[] = err.stdout.split("\n");
//                     for (let val of arr) {
//                         if (val.indexOf("Version")>=0){
//                             to_return = val.replace("Version:", "").trim();
//                             return;
//                         }
//                     }
                    
//                 }
//             }
//         );
//     } catch ( e ) {}
//     return to_return;
// }


// export async function check_if_file_in_dir(dir_path : string, to_find : string):Promise<boolean>  {
//     try {
//         // Loop them all with the new for...of
//         for( const entry of await fs.promises.readdir(dir_path) ) {
//             // Get the full paths
//             if (entry == to_find) {
//                 if(!((await fs.promises.stat(path.join(dir_path, entry))).isFile())){ return false; } 
//                 else { return true; }
//             }
//         }
//     }
//     // Catch anything bad that happens
//     catch( e ) { print(`caught error in check_if_file_in_dir: ${e}`); }
//     // default return
//     return false;
// }


// export async function check_config_dir(config_dir:string, mirror_dir:string):Promise<boolean> {
//     print(`Checking ${config_dir} against ${mirror_dir}`);
//     let exited_good:boolean = true;
//     //making config directory, catches errors, if no errors then continues to building
//     fs.readdir(mirror_dir, (err, files) => {
//         if (err) {
//             print(`Error in reading dir ${mirror_dir}`); 
//             exited_good = false;
//         } 
//         else {
//             // Loop them all with the new for...of
//             for( const entry of files ) {
//                 // Get the full paths
//                 try {
//                     if (!(fs.existsSync(path.join(config_dir, entry)))) {
//                         fs.copyFile(path.join(mirror_dir, entry), path.join(config_dir, entry), (err) => {
//                             if (err){
//                                 print(`> Error copying ${path.join(mirror_dir, entry)} to ${path.join(config_dir, entry)}`);
//                                 exited_good = false;
//                                 return;
//                             } else {
//                                 print(`> Copied ${path.join(mirror_dir, entry)} to ${path.join(config_dir, entry)}`);
//                             }
//                         });
//                     } else {
//                         print(`> Skipped ${entry} because it already exists in ${config_dir}`);
//                     }
//                 } catch ( e ) { 
//                     print(`> ${e}`); 
//                     exited_good = false;
//                     return;
//                 }
//             }
//         }
//     });
//     return exited_good;
// }

// export async function mkDir(dir:string):Promise<boolean> {
//     //print(`Building from ${mirror_dir} to ${config_dir}`)
//     let exited_good:boolean = true;
//     //making config directory, catches errors, if no errors then continues to building
//     fs.mkdir(dir, (err) => {
//         if (err) {
//             error(`Error making ${dir} with message: ${err.message}`)
//             exited_good = false;
//         }
//         // else {
//         //     print(`Made config dir: ${config_dir}`);
//         //     fs.readdir(mirror_dir, (err_0, files) => {
//         //         if (err_0) {
//         //             print(`Error in reading dir ${mirror_dir} with message: ${err_0.message}`); 
//         //             exited_good = false;
//         //             return;
//         //         } 
//         //         else {
//         //             // Loop them all with the new for...of
//         //             for( const entry of files ) {
//         //                 // Get the full paths
//         //                 print(`-- At entry ${entry} in ${config_dir}`);
//         //                 try {
//         //                     if (!(fs.existsSync(path.join(config_dir, entry)))) {
//         //                         fs.copyFile(path.join(mirror_dir, entry), path.join(config_dir, entry), (err_1) => {
//         //                             if (err_1){
//         //                                 print(`> Error copying ${path.join(mirror_dir, entry)} to ${path.join(config_dir, entry)} with message: ${err_1.message}`);
//         //                                 exited_good = false;
//         //                                 return;
//         //                             } else {
//         //                                 print(`> Copied ${path.join(mirror_dir, entry)} to ${path.join(config_dir, entry)}`);
//         //                             }
//         //                         });
//         //                     } else {
//         //                         print(`> Skipped ${entry} because it already exists in ${config_dir}`);
//         //                     }
//         //                 } catch ( e ) { 
//         //                     print(`> ${e}`);
//         //                     //vscode.window.showErrorMessage(`${e}`);
//         //                     exited_good = false;
//         //                     return;
//         //                 }
//         //             }
//         //         }
//         //     });
//         // }
//     });
//     return exited_good;
// }


// export async function setupSysPython(config:Config):Promise<boolean> {
//     print("Setting up for sys python");
//     if (!(await try_command("python3 --version"))) {
//         print("Python was not detected");
//         //vscode.window.showErrorMessage("Python was not detected on your system, please install it");
//     } else {
//         config.userConfig.python = "python3";
//         if (!(await try_command("pip3 --version"))) {
//             print("python pip was not detected");
//             //vscode.window.showErrorMessage("python pip was not detected on your system, please install it");
//         } else {
//             config.userConfig.pip = "pip3";
//             if (!(await try_command(`python3 -c \"import ${config.pythonModuleName}\"`))){
//                 let choice:string|undefined = await vscode.window.showInformationMessage(`the package "${config.pythonModuleName}" is not detected for your python installation, do you want to install it?`, config.yes, config.no);
//                 if (choice === config.yes) {
//                     print(`> Would install package ${config.pythonModuleName} from ${config.pythonModulePath}`);
//                     return true;
//                 } else {
//                     print(`User skipped installation of package ${config.pythonModuleName}`);
//                 }
//             } else { return true; }
//         }
//     }
//     return false;
// }


// export async function get_conda_envs():Promise<infoType>{
//     let to_return:infoType = {};
//     print("Getting conda envs")
//     let command:string = "conda env list";
//     let output:string = "";
//     try {
//         await execProm(command).then(
//             (err) => {
//                 output = err.stdout; 
//                 return;
//             }
//         );
//     } catch ( e ) {}
    
//     let arr:string[] = output.split("\n");
//     for (let val of arr.slice(2, arr.indexOf(""))) {
//         let new_split = val.replace(/\s+/, " ").split(" ");
//         to_return[new_split[0]] = {"path" : new_split[1], "exe" : `${new_split[1]}${path.sep}bin${path.sep}python`, "pip" : `${new_split[1]}${path.sep}bin${path.sep}pip`, "has_qiskit" : false};
//         if (await try_command(`${to_return[new_split[0]]["exe"]} -c "import qiskit"`)) {
//             to_return[new_split[0]]["has_qiskit"] = true;
//         }
//     }
//     return to_return;
// }


// export async function check_if_python_installed():Promise<boolean> {
//     return await try_command("python3 --version");
// }


// export async function check_if_pip_installed():Promise<boolean> {
//     return await try_command("pip3 --version");
// }


// export async function check_if_conda_installed():Promise<boolean> {
//     return await try_command("conda --version");
// }