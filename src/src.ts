import * as path from 'path';
import * as fs from "fs"
import * as vscode from 'vscode';
import * as cp from "child_process";
import * as util from "util";
const execProm = util.promisify(cp.exec);

//Create output channel
export let out = vscode.window.createOutputChannel("UC_Q");
export function print(msg:string) { out.appendLine(msg); }

export async function check_if_in_dir(dir_path : vscode.Uri, to_find : string):Promise<boolean>  {
    let got_it : boolean = false;
    try {
        // Get the files as an array
        const files = await fs.promises.readdir(dir_path.fsPath);

        // Loop them all with the new for...of
        for( const entry of files ) {
            // Get the full paths
            if (entry == to_find){
                let p = path.join(dir_path.fsPath, entry);
                const stat = await fs.promises.stat(p);
                if(!stat.isDirectory() ){
                    vscode.window.showErrorMessage(`"${to_find}" is not a directory please delete it from the current directory`);
                    return false;
                }
                got_it = true;
                break;
            }
        }
    }
    catch( e ) {
        // Catch anything bad that happens
        vscode.window.showErrorMessage(`${e}`);
    }
    if (got_it) { return true; }
    return false;
}

export async function build_config_dir(config_dir:string, mirror_dir:string) {
    out.appendLine(`Building from ${mirror_dir} to ${config_dir}`)
    // making config directory
    fs.mkdir(config_dir, (err) => {
        if (err) {
            out.appendLine(`Error making ${config_dir}`);
        }
    });
    out.appendLine(`Made config dir: ${config_dir}`);
    
    const files = await fs.promises.readdir(mirror_dir);
    // Loop them all with the new for...of
    for( const entry of files ) {
        // Get the full paths
        out.appendLine(`-- At entry ${entry} in ${config_dir}`)
        try {
            fs.copyFile(path.join(mirror_dir, entry), path.join(config_dir, entry), (err) => {
                if (err){
                    out.appendLine(`Error copying ${path.join(mirror_dir, entry)} to ${path.join(config_dir, entry)}`);
                }
            });
            //fs.promises.copyFile(path.join(mirror_dir, entry), config_dir).then( () => {
            //    out.appendLine(`Copied ${path.join(mirror_dir, entry)} to ${config_dir}`);
            //});
        } catch ( e ) {
            vscode.window.showErrorMessage(`${e}`);
        }
    }
}

export async function get_conda_envs():Promise<string[]>{
    let arr:string[] = [];
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
    for (let _path of output.replace("# conda environments:\n#\n", "").replace("*", "").split("\n")) {
        let split_p = _path.replace("\n", "").split(" ");
        while (true) {
            let index = split_p.indexOf("");
            if (index !== -1) {
                split_p.splice(index, 1);
            } else {
                break;
            }
        }
        for (let i =0; i < split_p.length; i++) {
            if (split_p[i] !== "" && split_p[i].search("/")===-1) {
                // getting python path
                command = path.join(split_p[i+1], "bin", "python");
                command.concat(" -c \"import qiskit\"");
                let to_append:string = "";
                try {
                    await execProm(command).then(
                        (err) => {
                            print(err.stderr.length.toString());
                            if (!(err.stderr.length)) {
                                to_append = " (qiskit found here)";
                            }
                            return;
                        }
                    );
                } catch ( e ) {}
                arr.push(`${split_p[i]} ${split_p[i+1]}${to_append}`);
            }
        }
    }
    return arr;
}

export async function check_if_python_installed():Promise<boolean> {
    print("Checking if python install")
    let command:string = "python3 --version";
    let to_return:boolean = false;
    try {
        await execProm(command).then(
            (err) => {
                if (!(err.stderr.length)) { to_return = true; }
                return;
            }
        );
    } catch ( e ) {  }
    return to_return;
}

export async function check_if_pip_installed():Promise<boolean> {
    print("Checking if pip install")
    let command:string = "pip3 --version";
    let to_return:boolean = false;
    try {
        await execProm(command).then(
            (err) => {
                if (!(err.stderr.length)) { to_return = true; }
                return;
            }
        );
    } catch ( e ) {  }
    return to_return;
}

export async function check_if_conda_installed():Promise<boolean> {
    print("Checking if conda install")
    let command:string = "conda --version";
    let to_return:boolean = false;
    try {
        await execProm(command).then(
            (err) => {
                if (!(err.stderr.length)) { to_return = true; }
                return;
            }
        );
    } catch ( e ) {  }
    return to_return;
}

export async function check_if_python_package_installed(name : string):Promise<boolean> {
    print(`Checking if ${name} is installed for python`)
    let command:string = `python -c \"import ${name}\"`;
    let to_return:boolean = false;
    try {
        await execProm(command).then(
            (err) => {
                if (!(err.stderr.length)) { to_return = true; }
                return;
            }
        );
    } catch ( e ) {  }
    return to_return;
}

export const execShell = (cmd: string) =>
    new Promise<string>((resolve, reject) => {
        cp.exec(cmd, (err, out) => {
            if (err) {
                return reject(err);
            }
            return resolve(out);
        });
    });