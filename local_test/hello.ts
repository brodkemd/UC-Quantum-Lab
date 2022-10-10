import * as src from "./src"
import * as fs from "fs"
import * as path from "path"
import * as process from "process"

function print(msg:string) { console.log(`- ${msg}`); }


async function checks(package_name:string):Promise<boolean>{
    // checking on what python is installed and helps with installation
    if (await src.check_if_conda_installed()){
        print(`Detected conda, do you want to use it with this extension (this is the recommend method)?`);
        let choice:string = "yes";
        if (choice === "yes") {
            let dict:{[name:string] : {"path"       : string, 
                                    "exe"        : string, 
                                    "pip"        : string,
                                    "has_qiskit" : boolean}}  = await src.get_conda_envs();
            print("Select env from list below")
            let key_that_has_qiskit:string = "";
            for (let key in dict) {
                if (dict[key]["has_qiskit"]) {
                    print(`> ${key} at ${dict[key]["path"]} (suggested)`);
                    key_that_has_qiskit = key;
                } else {
                    print(`> ${key} at ${dict[key]["path"]}`);
                }
            }
            let result = key_that_has_qiskit;
            print(`Setting up conda envrionment ${result}`);
            if (await src.try_command(`${dict[result]["exe"]} -c "import ${package_name}"`)) {
                print(`Package is already in ${result} do not need to install`)
            } else {
                print(`Installing ${package_name} in ${result}`)
                
            }
            return true;
        } else { return await src.install_in_sys_python(package_name); }
        
    } else {
        print("Did not detect anaconda on this system do you want to continue with a system python install (it would be better to use this extension with anaconda)\nIf not go to https://docs.anaconda.com/anaconda/install/index.html for a guide to install anaconda");
        let choice:string = "yes";
        if (choice === "yes") {
            return await src.install_in_sys_python(package_name);
        }
    }
    return false;
}

async function main(){
    let package_name:string = "UC_Quantum_Lab";
    let config_dir:string = path.join(process.cwd(), ".config");
    let mirror_dir:string = path.join(process.cwd(), "templates", "template_config");
    if (await checks(package_name)) {
        if (!(fs.existsSync(config_dir))) {
            print(`Do you want to initialize your current directory for this extension (will make the dir ${config_dir.slice(config_dir.lastIndexOf(path.sep)+1, config_dir.length)} here)`);
            let choice:string = "yes";
            if (choice === "yes") {
                src.build_config_dir(config_dir, mirror_dir);
            } else {
                print("Can not execute this extension without a config directory, sorry");
                return;
            }
        } else {
            print(`Config path ${config_dir} exists`);
            // makes sure that the config path is configured correctly
            src.check_config_dir(config_dir, mirror_dir);
        }
    } else {
        print("Error in checks function")
    }
}
main()