import * as fs from "fs"
import path = require("path");
import * as process from "process"
import { isBooleanObject, isStringObject } from "util/types";
import { print } from "./src";

export class UserConfig {
    userFile:string = "";
    python:string= "";
    pip:string = "";
    errorEncountered:boolean=false;
    errorMessage:string = "";

    constructor(user_config_file:string|undefined) {
        if (user_config_file!==undefined) {
            this.userFile = user_config_file;
        }
    }
    get() {
        print(`print reading from ${this.userFile}`);
        let read_in = JSON.parse(fs.readFileSync(this.userFile, "utf8"));

        // checks python exe
        if (read_in["python"] !== undefined) {
            if (fs.existsSync(read_in["python"])) { 
                this.python = read_in["python"]; 
            } else {
                this.errorEncountered = true;
                this.errorMessage = `the python path from user config ${read_in["python"]} does not exist, config file is ${this.userFile}`;
            }
        } else { 
            this.errorEncountered = true;
            this.errorMessage = `python was not found in the user config file, config file is ${this.userFile}`;
        }

        // checks pip exe
        if (read_in["pip"] !== undefined) {
            if (fs.existsSync(read_in["pip"])) { 
                this.pip = read_in["pip"]; 
            } else {
                this.errorEncountered = true;
                this.errorMessage = `the pip path from user config ${read_in["pip"]} does not exist, config file is ${this.userFile}`;
            }
        } else { 
            this.errorEncountered = true;
            this.errorMessage = `pip was not found in the user config file, config file is ${this.userFile}`;
        }
    }

    toDict():{[name:string] : string|boolean} {
        let to_return:{[name:string] : string|boolean} = {};
        // to_return["show_histogram"] = this.showHistogram;
        // to_return["show_state_vector"] = this.showStateVector;
        // to_return["show_circ"] = this.showCirc;
        to_return["pip"] = this.pip;
        to_return["python"] = this.python;
        return to_return
    }

    setFromDict(dict:{[name:string] : string|boolean}) {

        // checks python exe
        if (isStringObject(dict["python"])) {
            if (fs.existsSync(dict["python"])) { 
                this.python = dict["python"]; 
            } else {
                this.errorEncountered = true;
                this.errorMessage = `python variable from dict ${dict["python"]} does not exist`;
            }
        } else { 
            this.errorEncountered = true;
            this.errorMessage = `python variable must be a string`;
        }

        // checks pip exe
        if (isStringObject(dict["pip"])) {
            if (fs.existsSync(dict["pip"])) { 
                this.python = dict["pip"]; 
            } else {
                this.errorEncountered = true;
                this.errorMessage = `pip variable from dict ${dict["pip"]} does not exist`;
            }
        } else { 
            this.errorEncountered = true;
            this.errorMessage = `pip variable must be a string`;
        }
        this.save();
    }

    save() {
        print(`saving user config to ${this.userFile}`);
        let config:{[name:string]:string|boolean} = {"python" : this.python, 
                                                     "pip" : this.pip};
        // write data back to file
        fs.writeFile(this.userFile, JSON.stringify(config, null, 4), err => {
            if (err) {
                this.errorMessage = `could not save user config back to file, with message ${err.message}`;
                this.errorEncountered = true;
            }
        });
    }
}

export class Config {
    workspacePath:string;
    extensionInstallPath:string;
    errorEncountered:boolean = false;
    errorMessage:string = "";

    pythonModuleName:string = "";
    configDir:string = "";
    configFile:string = "";
    layoutFile:string = "";
    templateConfigFile:string = "";
    templatePythonFile:string = "";
    // validImageExt:string = "";
    // stateDataFile:string = "";
    // circImageFile:string = "";
    // histImageFile:string = "";
    // stateHtmlFormatFile:string = "";
    // imageHtmlFormatFile:string = "";
    mainHtmlFormatFile:string = "";
    testCompiledHtmlFile:string = "";
    testHtmlFile:string = "";
    // mathJS:string = "";
    noDataImage:string = "";
    // outStateHtmlFile:string = "";
    // outImageHtmlFile:string = "";
    triggerFile:string = "";
    // cssFilesPath:string = "";
    cssFiles:string[] = [];
    scriptFiles:string[] = [];
    curPythonModVer:string = "";
    pythonModulePath:string = "";
    yes:string = "";
    no:string = "";

    // user data
    userConfig:UserConfig = new UserConfig(undefined);

    constructor(workspace_path:string|undefined, extension_install_path:string|undefined) {
        if (workspace_path !== undefined && extension_install_path !== undefined) {
            this.workspacePath = workspace_path;
            this.extensionInstallPath = extension_install_path;

        } else {
            this.errorEncountered = true;
            this.errorMessage = "workspace is not valid, please open a folder";
            this.workspacePath = "";
            this.extensionInstallPath = "";
        }
    }
    initUserConfig() {
        this.userConfig = new UserConfig(this.configFile);
        this.errorEncountered = this.userConfig.errorEncountered;
        this.errorMessage = this.userConfig.errorMessage;
    }
    setUserConfig() {
        this.userConfig.get();
    }
}

// package_name= "UC_Quantum_Lab";
// cur_path = vscode.workspace.workspaceFolders[0].uri.fsPath;
// ext_path = context.extension.extensionPath;
// config_dir = path.join(cur_path, ".UCQ_config");
// config_file = path.join(config_dir, "config.json");
// mirror_dir = path.join(ext_path, "templates", "template_config");
// template_python_file = path.join(ext_path, "templates", "main.py");

export async function get_config():Promise<Config> {
    let config:Config = new Config(process.cwd(), "/home/marekbrodke/Documents/vscode_extensions/UC_Quantum_Lab_V2");
    // setting paths
    config.configDir = path.join(config.workspacePath, ".UCQ_config");
    config.configFile = path.join(config.configDir, "config.json"); // needs to be json
    config.layoutFile =  path.join(config.configDir, "layout.json"); // needs to be json
    // config.stateDataFile = path.join(config.configDir, "__state__.txt");
    // config.circImageFile = path.join(config.configDir, "__circ__.png");
    // config.histImageFile = path.join(config.configDir, "__hist__.png");
    config.triggerFile = path.join(config.configDir, ".trigger");
    config.templateConfigFile = path.join(config.extensionInstallPath, "templates", "template_config");
    config.templatePythonFile = path.join(config.extensionInstallPath, "templates", "main.py");

    // config.stateHtmlFormatFile = path.join(config.extensionInstallPath, "media", "state.html");
    // config.imageHtmlFormatFile = path.join(config.extensionInstallPath, "media", "images.html");
    // config.mathJS = path.join(config.extensionInstallPath, "packages", "mathjax", "tex-chtml.js");
    config.noDataImage = path.join(config.extensionInstallPath, "media", "no_img.jpg");
    // config.outImageHtmlFile = path.join(config.configDir, "__images__.html");
    // config.outStateHtmlFile = path.join(config.configDir, "__state__.html");
    config.mainHtmlFormatFile = path.join(config.extensionInstallPath, "media", "format.html");
    config.testHtmlFile = path.join(config.extensionInstallPath, "media", "test.html");
    config.testCompiledHtmlFile = path.join(config.configDir, "out.html");
    config.cssFiles = [
        path.join(config.extensionInstallPath, "media", "reset.css"), 
        path.join(config.extensionInstallPath, "media", "vscode.css")
    ];
    config.scriptFiles = [
        path.join(config.extensionInstallPath, "packages", "resizable", "resizable.js"),
        path.join(config.extensionInstallPath, "packages", "mathjax"  , "tex-chtml.js"),
        path.join(config.extensionInstallPath, "packages", "jquery"   , "jquery.js")
    ];
    // config.cssFilesPath = path.join(config.extensionInstallPath, "media");
    // config.validImageExt = ".png";

    config.yes = "yes";
    config.no = "no";

    // python module stuff
    config.pythonModulePath = path.join(config.extensionInstallPath, "python_module");
    config.pythonModuleName = "UC_Quantum_Lab";
    config.curPythonModVer = "0.0.1";

    // initializing user config
    config.initUserConfig();

    //if (get_user_config) {
        // if we should load from file, it is loaded
    //    config.setUserConfig();
    //}
    return config
}