import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as cp from "child_process";
import * as util from "util";

const execProm = util.promisify(cp.exec);
const print = console.log;

export type InfoInnerType = {"path" : string, "exe" : string, "pip" : string, "hasQiskit" : boolean};
export type InfoType = {[name:string] : InfoInnerType};

async function checkIfCondaInstalled():Promise<boolean> {
    if (fs.existsSync(path.join(os.homedir(), "anaconda3")) || await tryCommand("conda --version")) { return true; }
    return false;
}

async function error(msg:string) {
    print(`Error: ${msg}`);
    throw new Error(msg);
}

export async function tryCommand(command:string):Promise<boolean> {
    //print(`Trying command "${command}"`);
    let toReturn:boolean = false;
    try {
        await execProm(command).then(
            (err) => {
                if (err.stderr.length) {
                    // ignores deprication error
                    if (err.stderr.indexOf("DEPRECATION") === -1) { // accounts for pip package problems
                        toReturn = false; 
                        // print(`Encountered error "${err.stderr.toString()}"`);
                    } else {
                        // print(`ignoring error "${err.stderr.toString()}"`);
                        toReturn = true;
                    }
                }
                else { toReturn = true; }
                //else { error(`from try command ${err.stderr.toString()}`); }
            }
        );
    } catch ( e ) {
        //print(`caught "${(e as Error).message}" in try command`);
        toReturn = false;
    }
    return toReturn;
}

async function getCondaEnvs() {
    let toReturn:InfoType = {};
    let connector:string = "";
    if (fs.existsSync(path.join(os.homedir(), "anaconda3"))) {
        print(`Detected conda at: ${path.join(os.homedir(), "anaconda3")}`);
        let p:string = path.join(os.homedir(), "anaconda3", "envs");
        for( const entry of await fs.promises.readdir(p) ) {
            // Get the full paths
            if ((await fs.promises.stat(path.join(p, entry))).isDirectory()) {
                connector = "";
                print(`detected env: ${entry}`);

                if (os.platform() === "win32") {
                    toReturn[entry] = {
                        "path" : path.join(p, entry), 
                        "exe" : path.join(p, entry, "python.exe"),
                        "pip" : path.join(p, entry, "lib", "site-packages", "pip"),
                        "hasQiskit" : false
                    }
                } else {
                    toReturn[entry] = {
                        "path" : path.join(p, entry), 
                        "exe" : path.join(p, entry, "bin", "python"),
                        "pip" : path.join(p, entry, "bin", "pip"),
                        "hasQiskit" : false
                    }
                }
                if (await tryCommand(`${toReturn[entry]["exe"]} -c "import qiskit"`)) {
                    toReturn[entry]["hasQiskit"] = true;
                }
                if (!(fs.existsSync(toReturn[entry]["exe"]))) {
                    await error(`Detected python exe "${toReturn[entry]["exe"]}" does not exist`);
                }
                if (!(fs.existsSync(toReturn[entry]["pip"]))) {
                    await error(`Detected pip exe "${toReturn[entry]["pip"]}" does not exist`);
                }
            }
        }
    } else if (await tryCommand("conda --version")) {
        let toReturn:InfoType = {};
        print("Detected conda command on system (no conda install directory found)")
    
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
}

async function main() {
    if (await checkIfCondaInstalled()) {
        print("Conda is installed");
        let out:InfoType = {};
        out = await getCondaEnvs();
        for (let key in out) {
            print(`${out[key]["path"]}`);
            print(`- Python: ${out[key]["exe"]}`);
            print(`- hasQiskit: ${out[key]["hasQiskit"]}`);
        }
    } else {
        print("Conda is NOT installed");
    }
}
main();
