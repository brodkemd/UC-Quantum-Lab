import * as cp from "child_process";
import * as util from "util";
import * as fs from "fs";

const execProm = util.promisify(cp.exec);

// declaring print function (because I am lazy)
export function print(msg:string) { console.log(`- ${msg}`); }

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
                            print(`Encountered error "${err.stderr.replace("\n", " ")}" while running "${command}"`);
                            return;
                        } else {
                            print(`Ignoring error "${err.stderr.replace("\n", " ")}" from command "${command}"`);
                        }
                    } else {
                        print(`Encountered error "${err.stderr.replace("\n", " ")}" while running "${command}"`);
                        return;
                    }
                }
                // if here then no errors where encountered when runnin the command
                if (err.stdout.length) { toReturn = err.stdout; }
            }
        );
    } catch ( e ) {
        print(`Encountered error "${(e as Error).message.replace("\n", " ")}" while running "${command}"`);
    }
    return toReturn;
}

async function main() {
    // let out:string = await getOutputOfCommand("python -m pip --version");
    // //let out:string = await getOutputOfCommand("python -m pip show UC-Quantum-tools");
    // print(out.trim());
    // let m:string[]|null = out.match(/[0-9]+\.[0-9]+\.*[0-9]*/);
    // if (m !== null) {
    //     print(m.toString());
    // } else {
    //     print("no matches");
    // }
    let out = JSON.parse(await fs.promises.readFile("../../registry/pythons.json", "utf8"));
    if (out.pythons !== undefined) {
        let pythons:string[] = out.pythons;
        
    } else {
        print("Error: registry file is not valid");

    }
}
main();