import * as vscode from "vscode";
import * as fs from "fs"
import path = require("path");
import { isBooleanObject, isStringObject } from "util/types";
import { print } from "./src";

export class UserConfig {
    userFile:string = "";
    showHistogram:boolean = false;
    showStateVector:boolean = false;
    showCirc:boolean = false;
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
        let read_in = JSON.parse(fs.readFileSync(this.userFile, "utf8"));
        // checking user output config
        if (read_in["show_histogram"] !== undefined) {
            this.showHistogram = read_in["show_histogram"];
        }

        if (read_in["show_state_vector"] !== undefined) {
            this.showStateVector = read_in["show_state_vector"];
        }

        if (read_in["show_circ"] !== undefined) {
            this.showCirc = read_in["show_circ"];
        }

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
        //this.save();
    }

    toDict():{[name:string] : string|boolean} {
        let to_return:{[name:string] : string|boolean} = {};
        to_return["show_histogram"] = this.showHistogram;
        to_return["show_state_vector"] = this.showStateVector;
        to_return["show_circ"] = this.showCirc;
        to_return["pip"] = this.pip;
        to_return["python"] = this.python;
        return to_return
    }

    setFromDict(dict:{[name:string] : string|boolean}) {
        // checking user output config
        if (isBooleanObject(dict["show_histogram"])) {
            this.showHistogram = dict["show_histogram"];
        } else {
            this.errorEncountered = true;
            this.errorMessage = "show_histogram variable must be bool";
            return;
        }

        if (isBooleanObject(dict["show_state_vector"])) {
            this.showStateVector = dict["show_state_vector"];
        } else {
            this.errorEncountered = true;
            this.errorMessage = "show_state_vector variable must be bool";
            return;
        }

        if (isBooleanObject(dict["show_circ"])) {
            this.showCirc = dict["show_circ"];
        } else {
            this.errorEncountered = true;
            this.errorMessage = "show_circ variable must be bool";
            return;
        }

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
        let config:{[name:string]:string|boolean} = {"show_histogram" : this.showHistogram,
                                                     "show_state_vector" :this.showStateVector, "show_circ" : this.showCirc, 
                                                     "python" : this.python, 
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
    templateConfigFile:string = "";
    templatePythonFile:string = "";
    validImageExt:string = "";
    stateDataFile:string = "";
    stateHtmlFormatFile:string = "";
    imageHtmlFormatFile:string = "";
    mainHtmlFormatFile:string = "";
    testHtmlFile:string = "";
    mathJS:string = "";
    noDataImage:string = "";
    outStateHtmlFile:string = "";
    outImageHtmlFile:string = "";


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

export async function get_config(context:vscode.ExtensionContext):Promise<Config> {
    if (vscode.workspace.workspaceFolders !== undefined) {
        let config:Config = new Config(vscode.workspace.workspaceFolders[0].uri.fsPath, context.extensionPath);
        // setting paths
        config.configDir = path.join(config.workspacePath, ".UCQ_config");
		config.configFile = path.join(config.configDir, "config.json"); // needs to be json
        config.stateDataFile = path.join(config.configDir, "__state__.txt");
        config.templateConfigFile = path.join(config.extensionInstallPath, "templates", "template_config");
        config.templatePythonFile = path.join(config.extensionInstallPath, "templates", "main.py");
        config.stateHtmlFormatFile = path.join(config.extensionInstallPath, "media", "state.html");
        config.imageHtmlFormatFile = path.join(config.extensionInstallPath, "media", "images.html");
        config.mathJS = path.join(config.extensionInstallPath, "media", "mathjax", "tex-chtml.js");
        config.noDataImage = path.join(config.extensionInstallPath, "media", "no_img.jpg");
        config.outImageHtmlFile = path.join(config.configDir, "__images__.html");
        config.outStateHtmlFile = path.join(config.configDir, "__state__.html");
        config.mainHtmlFormatFile = path.join(config.extensionInstallPath, "media", "index.html");
        config.testHtmlFile = path.join(config.extensionInstallPath, "media", "test.html");
        config.validImageExt = ".png";

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
    } else {
        return new Config(undefined, undefined);
    }
}