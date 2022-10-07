import * as path from 'path';
import * as fs from "fs"
import * as vscode from 'vscode';
import * as cp from "child_process";
import * as util from "util";
const execProm = util.promisify(cp.exec);

//Create output channel
export let out = vscode.window.createOutputChannel("UC_Q");
export function print(msg:string) { out.appendLine(`- ${msg}`); }

export async function try_command(command:string):Promise<boolean> {
    let to_return:boolean = false;
    try {
        await execProm(command).then(
            (err) => {
                if (!(err.stderr.length)) { to_return = true; }
                return;
            }
        );
    } catch ( e ) {}
    return to_return;
}

export async function check_if_in_dir(dir_path : string, to_find : string):Promise<boolean>  {
    try {
        // Loop them all with the new for...of
        for( const entry of await fs.promises.readdir(dir_path) ) {
            // Get the full paths
            if (entry == to_find){
                if(!((await fs.promises.stat(path.join(dir_path, entry))).isDirectory())){
                    print(`"${to_find}" is in your current directory and is not a directory please delete it from the current directory`);
                    vscode.window.showErrorMessage(`"${to_find}" is in your current directory and is not a directory please delete it from the current directory`);
                    return false;
                } else { return true; }
            }
        }
    }
    // Catch anything bad that happens
    catch( e ) { print(`${e}`); }
    // default return
    return false;
}


export async function check_config_dir(config_dir:string, mirror_dir:string):Promise<boolean> {
    print(`Checking ${config_dir} against ${mirror_dir}`);
    let exited_good:boolean = true;
    //making config directory, catches errors, if no errors then continues to building
    fs.readdir(mirror_dir, (err, files) => {
        if (err) {
            print(`Error in reading dir ${mirror_dir}`); 
            exited_good = false;
        } 
        else {
            // Loop them all with the new for...of
            for( const entry of files ) {
                // Get the full paths
                try {
                    if (!(fs.existsSync(path.join(config_dir, entry)))) {
                        fs.copyFile(path.join(mirror_dir, entry), path.join(config_dir, entry), (err) => {
                            if (err){
                                print(`> Error copying ${path.join(mirror_dir, entry)} to ${path.join(config_dir, entry)}`);
                                exited_good = false;
                                return;
                            } else {
                                print(`> Copied ${path.join(mirror_dir, entry)} to ${path.join(config_dir, entry)}`);
                            }
                        });
                    } else {
                        print(`> Skipped ${entry} because it already exists in ${config_dir}`);
                    }
                } catch ( e ) { 
                    print(`> ${e}`); 
                    exited_good = false;
                    return;
                }
            }
        }
    });
    return exited_good;
}

export async function build_config_dir(config_dir:string, mirror_dir:string):Promise<boolean> {
    print(`Building from ${mirror_dir} to ${config_dir}`)
    let exited_good:boolean = true;
    //making config directory, catches errors, if no errors then continues to building
    fs.mkdir(config_dir, (err) => {
        if (err) {
            print(`Error making ${config_dir}`); 
            exited_good = false;
        }
        else {
            print(`Made config dir: ${config_dir}`);
            fs.readdir(mirror_dir, (err, files) => {
                if (err) {
                    print(`Error in reading dir ${mirror_dir}`); 
                    exited_good = false;
                    return;
                } 
                else {
                    // Loop them all with the new for...of
                    for( const entry of files ) {
                        // Get the full paths
                        print(`-- At entry ${entry} in ${config_dir}`);
                        try {
                            if (!(fs.existsSync(path.join(config_dir, entry)))) {
                                fs.copyFile(path.join(mirror_dir, entry), path.join(config_dir, entry), (err) => {
                                    if (err){
                                        print(`> Error copying ${path.join(mirror_dir, entry)} to ${path.join(config_dir, entry)}`);
                                        exited_good = false;
                                        return;
                                    } else {
                                        print(`> Copied ${path.join(mirror_dir, entry)} to ${path.join(config_dir, entry)}`);
                                    }
                                });
                            } else {
                                print(`> Skipped ${entry} because it already exists in ${config_dir}`);
                            }
                        } catch ( e ) { 
                            print(`> ${e}`);
                            //vscode.window.showErrorMessage(`${e}`);
                            exited_good = false;
                            return;
                        }
                    }
                }
            });
        }
    });
    return exited_good;
}


export async function install_in_sys_python(package_name:string):Promise<boolean> {
    if (!(await check_if_python_installed())) {
        print("Python was not detected on your system, please install it");
        vscode.window.showErrorMessage("Python was not detected on your system, please install it");
    } else {
        if (!(await check_if_pip_installed())) {
            print("python pip was not detected on your system, please install it");
            vscode.window.showErrorMessage("python pip was not detected on your system, please install it");
        } else {
            if (!(await try_command(`python3 -c \"import ${package_name}\"`))){
                print(`the package "${package_name}" is not detected for your python installation, do you want to install it?`);
                let choice:string|undefined = await vscode.window.showInformationMessage(`the package "${package_name}" is not detected for your python installation, do you want to install it?`, "yes", "no");
                if (choice === "yes") {
                    print(`> Would install package ${package_name}`);
                    return true;
                } else {
                    print(`User skipped installation of package ${package_name}`);
                }
            } else {
                return true;
            }
        }
    }
    return false;
}


export async function get_conda_envs():Promise<{[name:string] : {"path" : string, "exe" : string, "pip" : string, "has_qiskit" : boolean}} >{
    let to_return:{[name:string] : {"path" : string, "exe" : string, "pip" : string, "has_qiskit" : boolean}} = {};
    print("Getting conda envs")
    let command:string = "conda env list";
    let output:string = "";
    try {
        await execProm(command).then(
            (err) => {
                output = err.stdout; 
                return;
            }
        );
    } catch ( e ) {}
    
    let arr:string[] = output.split("\n");
    for (let val of arr.slice(2, arr.indexOf(""))) {
        let new_split = val.replace(/\s+/, " ").split(" ");
        to_return[new_split[0]] = {"path" : new_split[1], "exe" : `${new_split[1]}${path.sep}bin${path.sep}python`, "pip" : `${new_split[1]}${path.sep}bin${path.sep}pip`, "has_qiskit" : false};
        if (await try_command(`${to_return[new_split[0]]["exe"]} -c "import qiskit"`)) {
            to_return[new_split[0]]["has_qiskit"] = true;
        }
    }
    return to_return;
}


export async function check_if_python_installed():Promise<boolean> {
    return await try_command("python3 --version");
}


export async function check_if_pip_installed():Promise<boolean> {
    return await try_command("pip3 --version");
}


export async function check_if_conda_installed():Promise<boolean> {
    return await try_command("conda --version");
}