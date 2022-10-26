import * as path from 'path';
import * as fs from "fs";
import * as vscode from 'vscode';
import * as cp from "child_process";
import * as util from "util";
import * as os from "os";
import { Config } from './config';

const execProm = util.promisify(cp.exec);


//Create output channel
export let out = vscode.window.createOutputChannel("UC_Q");

// declaring print function (because I am lazy)
export function print(msg:string) { out.appendLine(`- ${msg}`); }

// declaring types for easy of use later
export type InfoInnerType = {"path" : string, "exe" : string, "pip" : string, "hasQiskit" : boolean};
export type InfoType = {[name:string] : InfoInnerType};
export type ConfigType = {[key : string] : string|boolean};

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
 * Sends an error message to the user
 * @param msg : error message to send to the user
 */
 export function info(msg:string) {
    print(`Info: ${msg}`);
    vscode.window.showInformationMessage(msg);}

/**
 * delays the execution of the code by the specified milliseconds
 * @param ms : time in milliseconds to delay
 * @returns a promise function that delays the code
 */
export async function delay(ms: number) { return new Promise( resolve => setTimeout(resolve, ms)); }

/**
 * Executes a commands and returns a boolean indicating if it suceeded
 * @param command : string to execute on the system
 * @returns a boolean indicating if the command succeeded
 */
export async function tryCommand(command:string):Promise<boolean> {
    let toReturn:boolean = false;
    try {
        await execProm(command).then(
            (err) => {
                if (err.stderr.length) {
                    // ignores deprication error
                    if (err.stderr.indexOf("ERROR") === -1) {
                        if (err.stderr.indexOf("DEPRECATION") === -1 && err.stderr.indexOf("WARNING") === -1) { // accounts for pip package problems
                            toReturn = false; 
                            print(`Encountered error "${err.stderr.replace("\n", " ").toString()}" while running "${command}"`);
                        } else {
                            print(`Ignoring error "${err.stderr.replace("\n", " ").toString()}" from command "${command}"`);
                            toReturn = true;
                        }
                    } else {
                        print(`Encountered error "${err.stderr.replace("\n", " ").toString()}" while running "${command}"`);
                    }
                }
                else { toReturn = true; }
                //else { error(`from try command ${err.stderr.toString()}`); }
            }
        );
    } catch ( e ) {
        print(`Encountered error "${(e as Error).message.replace("\n", " ")}" while running "${command}"`);
        toReturn = false;
    }
    return toReturn;
}

/**
 * Executes a commands and returns the stdout of the command
 * @param command : string to execute on the system
 * @returns a string that is the stdout of the command if no error was encountered
 */
 export async function getOutputOfCommand(command:string):Promise<string> {
    let toReturn:string = "";
    try {
        await execProm(command).then(
            (err) => {
                if (err.stderr.length) {
                    // ignores deprication error
                    if (err.stderr.indexOf("ERROR") === -1) {
                        if (err.stderr.indexOf("DEPRECATION") === -1 && err.stderr.indexOf("WARNING") === -1) { // accounts for pip package problems
                            print(`Encountered error "${err.stderr.replace("\n", " ").toString()}" while running "${command}"`);
                            return;
                        } else {
                            print(`Ignoring error "${err.stderr.replace("\n", " ").toString()}" from command "${command}"`);
                        }
                    } else {
                        print(`Encountered error "${err.stderr.replace("\n", " ").toString()}" while running "${command}"`);
                        return;
                    }
                }
                if (err.stdout.length) { toReturn = err.stdout; }
                //else { error(`from try command ${err.stderr.toString()}`); }
            }
        );
    } catch ( e ) {
        print(`Encountered error "${(e as Error).message.replace("\n", " ")}" while running "${command}"`);
    }
    return toReturn;
}

/**
 * Installs the inputted python module with the inputted pip
 * @param pip : path to pip exe
 * @param module : python module to install
 * @returns a bool indicating if the install suceed
 */
 export async function pipInstall(pip:string, module:string):Promise<boolean> {
    return await tryCommand(`${pip} install -q --no-warn-script-location ${module}`);
}

/**
 * Uninstalls the inputted python module with the inputted pip
 * @param pip : path to pip exe
 * @param module : python module to uninstall
 * @returns a bool indicating if the uninstall suceed
 */
 export async function pipUpdate(pip:string, module:string):Promise<boolean> {
    return await tryCommand(`${pip} install --upgrade ${module}`);
}

/**
 * Waits for the trigger file (a file that lets the execution of this extension continue)
 * @param config : current configuration of the extension
 */
export async function waitForTriggerFile(config:Config) {
    // while loop that waits for the file
    while (true) {
        if (fs.existsSync(config.triggerFile)) { break; } 
        else { await delay(100); } /// short delay so things don't get crazy
    }
    // removes the trigger file when done
    try { await fs.promises.rm(config.triggerFile); } 
    catch ( e ) {
        error(`caught error in waiting for trigger file: ${(e as Error).message.replace("\n", " ")}`);
    }
}

/**
 * Gets the current version of the inputted module from pip
 * @param pip : string path to pip executable
 * @param module : string name of module to check
 * @returns current version of the provided module
 */
export async function getVersionOfPythonModuleWithName(pip:string, module:string):Promise<string> {
    let toReturn:string = "";
    try {
        await execProm(`${pip} show ${module}`).then(
            (err) => {
                // if there was output\
                if (err.stdout.length) { 
                    // parsing the output and getting the version
                    let arr:string[] = err.stdout.split("\n");
                    for (let val of arr) {
                        if (val.indexOf("Version")>=0){
                            toReturn = val.replace("Version:", "").trim();
                            return;
                        }
                    }
                    
                }
            }
        );
    // catches any errors
    } catch ( e ) {}
    //print(`version: ${toReturn}`);
    return toReturn;
}

/**
 * Determines if a file is in a directory
 * @param dirPath : directory path in string form
 * @param toFind : name of a file that you want to know if it is in dir_path
 * @returns boolean indicating if to_find is in dir_path
 */
export async function checkIfFileInDir(dirPath : string, toFind : string):Promise<boolean>  {
    try {
        // Loop them all with the new for...of
        for( const entry of await fs.promises.readdir(dirPath) ) {
            // Get the full paths
            if (entry === toFind) {
                if(!((await fs.promises.stat(path.join(dirPath, entry))).isFile())){ return false; } 
                else { return true; }
            }
        }
    }
    // Catch anything bad that happens
    catch( e ) { print(`caught error in check_if_file_in_dir: ${e}`); }
    // default return
    return false;
}

/**
 * Makes the provided directory
 * @param dir : string representation of a directory path to make
 * @returns if making the directory succeeded
 */
export async function mkDir(dir:string){
    //print(`Building from ${mirror_dir} to ${config_dir}`)

    //making config directory, catches errors, if no errors then continues to building
    fs.mkdir(dir, (err) => {
        if (err) {
            error(`Error making ${dir} with message: ${err.message}`);
        }
    });
}
/**
 * Sets up system python for this extension and returns if it was sucessful or not as a boolean
 * @param config : current configuration of the extension
 * @returns boolean indicating if there was successful setup of system python for this extension
 */

export async function setupSysPython(config:Config) {
    print("Setting up for sys python");
    // if python is installed
    if (!(await tryCommand("python3 --version")) && !(await tryCommand("python --version"))) {
        // no
        info("Python was not detected on your system, please install it");
    } else {
        // yes
        let version:string = "";
        let output:string = "";
        if (!(await tryCommand("python3 --version"))) {
            config.userConfig.python = "python";
        } else {
            config.userConfig.python = "python3";
        }

        output = await getOutputOfCommand(`${config.userConfig.python} --version`);
        version = output.slice(output.search(/[0-9]/), output.length).trim();
        if (version.length) {
            let major:number = +version.split(".")[0];
            let minor:number = +version.split(".")[1];
            if (!(major >= 3 && minor >= 6)) {
                error("Your system python is too old, need to update it");
            }
        } else {
            error("could not detect python version, trying installing python3");
        }
        // if pip is installed
        if (!(await tryCommand("pip3 --version")) && !(await tryCommand("pip --version"))) {
            // no
            error("python pip was not detected on your system, please install it");
        } else {
            let version:string = "";
            let output:string = "";
            if (!(await tryCommand("pip --version"))) {
                config.userConfig.pip = "pip3";
            } else {
                config.userConfig.pip = "pip";
            }
            output = await getOutputOfCommand(`${config.userConfig.pip} --version`);
            version = output.slice(output.search(/[0-9]/), output.length).trim();
            version = version.slice(0, version.search(/[a-zA-Z]/)+1).trim();
            if (version.length) {
                let major:number = +version.split(".")[0];
                let minor:number = +version.split(".")[1];
                //print(`major:${major} minor:${minor}`);
                if (!(major >= 20 && minor >= 0)) {
                    error("Your system python is too old, need to update it");
                }
            } else {
                error("could not detect python version, trying installing python3");
            }
            // yes

            // if the module is installed
            if (!(await tryCommand(`${config.userConfig.python} -c \"import ${config.pythonModuleName}\"`))){
                // asking the user if the want to install the python module
                let choice:string|undefined = await vscode.window.showInformationMessage(`the package "${config.pythonModuleName}" is not detected for your python installation, do you want to install it?`, config.yes, config.no);
                // if they want to install the python module
                if (choice === config.yes) {
                    // try installing the python module with pip, if it succeeds tell the user and if not tell the user
                    // it did not
                    info(`Installing ${config.pythonModuleName}`);
                    if (await pipInstall(config.userConfig.pip, config.pythonModulePyPi)) {
                        info(`Successfully setup ${config.pythonModuleName}`);
                    }
                    else {
                        error(`error installing ${config.pythonModuleName} for ${config.userConfig.python}`);
                    }
                } else {
                    print(`User skipped installation of package ${config.pythonModuleName}`);
                }
            }
        }
    }
}

/**
 * Gets a dictionary containing information on the user's conda envs
 * @returns Dictionary of infoType type that contains information on the conda envs on the user machine
 */
export async function getCondaEnvs():Promise<InfoType>{
    let toReturn:InfoType = {};
    let connector:string = "";
    if (fs.existsSync(path.join(os.homedir(), "anaconda3"))) {
        print(`Detected conda at: ${path.join(os.homedir(), "anaconda3")}`);
        let p:string = path.join(os.homedir(), "anaconda3", "envs");
        for( const entry of await fs.promises.readdir(p) ) {
            // Get the full paths
            if ((await fs.promises.stat(path.join(p, entry))).isDirectory()) {
                connector = "";
                if (os.platform() === "win32") {
                    toReturn[entry] = {
                        "path" : path.join(p, entry), 
                        "exe" : path.join(p, entry, "python.exe"),
                        "pip" : `${path.join(p, entry, "python.exe")} ${path.join(p, entry, "Lib", "site-packages", "pip", "__pip-runner__.py")}`,
                        "hasQiskit" : false
                    };
                    if (!(fs.existsSync(path.join(p, entry, "Lib", "site-packages", "pip", "__pip-runner__.py")))) {
                        error(`Detected pip exe "${path.join(p, entry, "Lib", "site-packages", "pip", "__pip-runner__.py")}" does not exist`);
                    }
                } else {
                    toReturn[entry] = {
                        "path" : path.join(p, entry), 
                        "exe" : path.join(p, entry, "bin", "python"),
                        "pip" : path.join(p, entry, "bin", "pip"),
                        "hasQiskit" : false
                    };
                }
                if (await tryCommand(`${toReturn[entry]["exe"]} -c "import qiskit"`)) {
                    toReturn[entry]["hasQiskit"] = true;
                }
                if (!(fs.existsSync(toReturn[entry]["exe"]))) {
                    error(`Detected python exe "${toReturn[entry]["exe"]}" does not exist`);
                }
            }
        }
    } else if (await tryCommand("conda --version")) {
        let toReturn:InfoType = {};
        print("Detected conda command on system (no conda install directory found)");
    
        // reading the available conda envs
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
        
        // if something was returned from the env list command
        if (output.length) {
            // parsing the output of the env list command
            let arr:string[] = output.split("\n");
            for (let val of arr.slice(2, arr.indexOf(""))) {
                let newSplit = val.replace(/\s+/, " ").split(" ");
                toReturn[newSplit[0]] = {"path" : newSplit[1], "exe" : `${newSplit[1]}${path.sep}bin${path.sep}python`, "pip" : `${newSplit[1]}${path.sep}bin${path.sep}pip`, "hasQiskit" : false};
                if (await tryCommand(`${toReturn[newSplit[0]]["exe"]} -c "import qiskit"`)) {
                    toReturn[newSplit[0]]["hasQiskit"] = true;
                }
            }
        }
    } else { error("could not find anaconda on the system"); }
    return toReturn;

    // let toReturn:InfoType = {};
    // print("Getting conda envs");

    // // reading the available conda envs
    // let command:string = "conda env list";
    // let output:string = "";
    // try {
    //     await execProm(command).then(
    //         (err) => {
    //             output = err.stdout; 
    //             return;
    //         }
    //     );
    // } catch ( e ) {}
    
    // // if something was returned from the env list command
    // if (output.length) {
    //     // parsing the output of the env list command
    //     let arr:string[] = output.split("\n");
    //     for (let val of arr.slice(2, arr.indexOf(""))) {
    //         let newSplit = val.replace(/\s+/, " ").split(" ");
    //         toReturn[newSplit[0]] = {"path" : newSplit[1], "exe" : `${newSplit[1]}${path.sep}bin${path.sep}python`, "pip" : `${newSplit[1]}${path.sep}bin${path.sep}pip`, "hasQiskit" : false};
    //         if (await tryCommand(`${toReturn[newSplit[0]]["exe"]} -c "import qiskit"`)) {
    //             toReturn[newSplit[0]]["hasQiskit"] = true;
    //         }
    //     }
    // }
    // return toReturn;
}

// /**
//  * Checks if python is installed on the user's machine
//  * @returns a boolean indicating if python is install on the user's machine
//  */
// export async function checkIfPythonInstalled():Promise<boolean> {
//     return await tryCommand("python3 --version");
// }

// /**
//  * Checks if pip is installed on the user's machine
//  * @returns a boolean indicating if pip is install on the user's machine
//  */
// export async function checkIfPipInstalled():Promise<boolean> {
//     return await tryCommand("pip3 --version");
// }

/**
 * Checks if conda is installed on the user's machine
 * @returns a boolean indicating if conda is install on the user's machine
 */
export async function checkIfCondaInstalled():Promise<boolean> {
    if (fs.existsSync(path.join(os.homedir(), "anaconda3")) || await tryCommand("conda --version")) { return true; }
    return false;
}