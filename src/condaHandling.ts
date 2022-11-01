// import * as os from "os";
// import * as path from "path";
// import * as fs from "fs";
// import { print, error, tryCommand, getOutputOfCommand, InfoType } from "./src";
// /**
//  * Checks if conda is installed on the user's machine
//  * @returns a boolean indicating if conda is install on the user's machine
//  */
// export async function checkIfCondaInstalled():Promise<boolean> {
//     if (fs.existsSync(path.join(os.homedir(), "anaconda3")) || await tryCommand("conda --version")) { return true; }
//     return false;
// }

// /**
//  * Gets a dictionary containing information on the user's conda envs
//  * @returns Dictionary of infoType type that contains information on the conda envs on the user machine
//  */
// export async function getCondaEnvs():Promise<InfoType>{
//     let toReturn:InfoType = {};
//     let connector:string = "";
//     // if there is a conda dir
//     if (fs.existsSync(path.join(os.homedir(), "anaconda3"))) {
//         print(`Detected conda at: ${path.join(os.homedir(), "anaconda3")}`);
//         let p:string = path.join(os.homedir(), "anaconda3", "envs");
//         // going through the lsit of envs
//         for( const entry of await fs.promises.readdir(p) ) {
//             // Get the full paths
//             if ((await fs.promises.stat(path.join(p, entry))).isDirectory()) {
//                 connector = "";
//                 // if on windows (eww)
//                 if (os.platform() === "win32") {
//                     toReturn[entry] = {
//                         "path" : path.join(p, entry), 
//                         "exe" : path.join(p, entry, "python.exe"),
//                         "pip" : `${path.join(p, entry, "python.exe")} ${path.join(p, entry, "Lib", "site-packages", "pip", "__pip-runner__.py")}`,
//                         "hasQiskit" : false
//                     };
//                     if (!(fs.existsSync(path.join(p, entry, "Lib", "site-packages", "pip", "__pip-runner__.py")))) {
//                         error(`Detected pip exe "${path.join(p, entry, "Lib", "site-packages", "pip", "__pip-runner__.py")}" does not exist`);
//                     }
//                 // if anything but windows (yay!)
//                 } else {
//                     toReturn[entry] = {
//                         "path" : path.join(p, entry), 
//                         "exe" : path.join(p, entry, "bin", "python"),
//                         "pip" : path.join(p, entry, "bin", "pip"),
//                         "hasQiskit" : false
//                     };
//                 }
//                 // seeing if the python interpreter has the qiskit module installed
//                 if (await tryCommand(`${toReturn[entry]["exe"]} -c "import qiskit"`)) {
//                     toReturn[entry]["hasQiskit"] = true;
//                 }
//                 // checking if the python exe exists
//                 if (!(fs.existsSync(toReturn[entry]["exe"]))) {
//                     error(`Detected python exe "${toReturn[entry]["exe"]}" does not exist`);
//                 }
//             }
//         }
//     // if the dir does not exist try to execute the command
//     } else if (await tryCommand("conda --version")) {
//         let toReturn:InfoType = {};
//         print("Detected conda command on system (no conda install directory found)");
    
//         // reading the available conda envs
//         let command:string = "conda env list";
//         let output:string = await getOutputOfCommand(command);
        
//         // if something was returned from the env list command
//         if (output.length) {
//             // parsing the output of the env list command
//             let arr:string[] = output.split("\n");
//             for (let val of arr.slice(2, arr.indexOf(""))) {
//                 let newSplit = val.replace(/\s+/, " ").split(" ");
//                 toReturn[newSplit[0]] = {"path" : newSplit[1], "exe" : `${newSplit[1]}${path.sep}bin${path.sep}python`, "pip" : `${newSplit[1]}${path.sep}bin${path.sep}pip`, "hasQiskit" : false};
//                 if (await tryCommand(`${toReturn[newSplit[0]]["exe"]} -c "import qiskit"`)) {
//                     toReturn[newSplit[0]]["hasQiskit"] = true;
//                 }
//             }
//         }
//     } else { error("could not find anaconda on the system"); }
//     return toReturn;
// }