import * as path from 'path';
import * as fs from "fs"
import * as vscode from 'vscode';
import { OutgoingMessage } from 'http';

//Create output channel
export let out = vscode.window.createOutputChannel("UC_Q");

export async function check_if_in_dir(dir_path : vscode.Uri, to_find : string) {
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