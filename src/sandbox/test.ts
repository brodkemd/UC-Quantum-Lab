import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const print = console.log;


async function main() {
    let python:string = "";
    let pip:string = "";
    let connector:string = "";
    if (fs.existsSync(path.join(os.homedir(), "anaconda3"))) {
        print("Detected conda");
        let p:string = path.join(os.homedir(), "anaconda3", "envs");
        for( const entry of await fs.promises.readdir(p) ) {
            // Get the full paths
            if ((await fs.promises.stat(path.join(p, entry))).isDirectory()) {
                connector = "";
                print(`detected env: ${entry}`);

                if (os.platform() === "win32") {
                    python = path.join(p, entry, "python.exe");
                    pip = path.join(p, entry, "lib", "site-packages", "pip");
                } else {
                    python = path.join(p, entry, "bin", "python");
                    pip = path.join(p, entry, "bin", "pip");
                }
                if (fs.existsSync(python)) {
                    print(`- python: ${python}`);
                } else {
                    print("- python: does not exist");
                }

                if (fs.existsSync(pip)) {
                    print(`- pip: ${pip}`);
                } else {
                    print("- pip: doesn not exist");
                }
            }
        }
    }
}
main();
