import * as vscode from "vscode";
import * as fs from "fs"
import path = require("path");
import { isBooleanObject, isStringObject } from "util/types";
import { print } from "./src";

/**
 * Class to store information about the current configuration for the user
 */
export class UserConfig {
    // the file where the user configuration is stored
    userFile:string = "";
    // the python interpreter path or command
    python:string= "";
    // pip executable path or command
    pip:string = "";
    // whether or not this class encounters a problem
    errorEncountered:boolean=false;
    // the message from a problem that this encounters
    errorMessage:string = "";

    // setting the userfile
    constructor(user_config_file:string|undefined) {
        if (user_config_file!==undefined) {
            this.userFile = user_config_file;
        }
    }
    /**
     * gets the current user config from the user config file and sets attributes of this class
     */
    get() {
        print(`print reading from ${this.userFile}`);
        // reading the json file
        let read_in = JSON.parse(fs.readFileSync(this.userFile, "utf8"));

        // checks python exe read from the file
        if (read_in["python"] !== undefined) {
            // if the python interpreter path exists or it is a command, set the attribute
            if (fs.existsSync(read_in["python"]) || read_in["python"].indexOf(path.sep) === -1) {
                this.python = read_in["python"]; 
            } else {
                this.errorEncountered = true;
                this.errorMessage = `the python path from user config ${read_in["python"]} does not exist, config file is ${this.userFile}`;
            }
        } else { 
            this.errorEncountered = true;
            this.errorMessage = `python was not found in the user config file, config file is ${this.userFile}`;
        }

        // checks pip exe read from the file
        if (read_in["pip"] !== undefined) {
            // if the pip executable path exists or it is a command, set the attribute
            if (fs.existsSync(read_in["pip"]) || read_in["pip"].indexOf(path.sep) === -1) { 
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

    /**
     * takes the attributes of this class and puts them in a dictionary
     * @returns a dictionary containing the attributes of this class
     */
    toDict():{[name:string] : string|boolean} {
        let to_return:{[name:string] : string|boolean} = {};
        // to_return["show_histogram"] = this.showHistogram;
        // to_return["show_state_vector"] = this.showStateVector;
        // to_return["show_circ"] = this.showCirc;
        to_return["pip"] = this.pip;
        to_return["python"] = this.python;
        return to_return
    }
    /**
     * sets the attributes of this class from the inputted dictionary
     * @param dict : dictionary that contains information that you want to use to set the attributes of this class
     */
    setFromDict(dict:{[name:string] : string|boolean}) {
        // checks python exe
        if (typeof dict["python"] === "string") {
            // if the python interpreter path exists or it is a command, set the attribute
            if (fs.existsSync(dict["python"]) || dict["python"].indexOf(path.sep) === -1) { 
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
        if (typeof dict["pip"] === "string") {
            // if the pip exe path exists or it is a command, set the attribute
            if (fs.existsSync(dict["pip"]) || dict["pip"].indexOf(path.sep) === -1) { 
                this.python = dict["pip"]; 
            } else {
                this.errorEncountered = true;
                this.errorMessage = `pip variable from dict ${dict["pip"]} does not exist`;
            }
        } else { 
            this.errorEncountered = true;
            this.errorMessage = `pip variable must be a string`;
        }
        // saving this class to the user config file
        this.save();
    }
    /**
     * Saves this class to the user config file
     */
    save() {
        print(`saving user config to ${this.userFile}`);
        // creating config from attributes of this class
        let config:{[name:string]:string|boolean} = {"python" : this.python, 
                                                     "pip" : this.pip};
        // write data to user config file
        fs.writeFile(this.userFile, JSON.stringify(config, null, 4), err => {
            if (err) {
                this.errorMessage = `could not save user config back to file, with message ${err.message}`;
                this.errorEncountered = true;
            }
        });
    }
}

/**
 * Class containing all of the information on the configuration of this extension
 */
export class Config {
    // the path of the workspace open in vscode
    workspacePath:string;
    // path where this extension is installed at
    extensionInstallPath:string;
    // if this class encountered an error
    errorEncountered:boolean = false;
    // the message from an error if one was encountered
    errorMessage:string = "";
    // name of the python module used with this extension
    pythonModuleName:string = "";
    // the user config directory
    configDir:string = "";
    // the user config file
    configFile:string = "";
    // the file containing the layout of the viewer
    layoutFile:string = "";
    // template config file to load into the user config directory with it is made
    templateConfigFile:string = "";
    // example python file to give to the user if they want it
    templatePythonFile:string = "";
    // html format file to load and use as a template for the viewer's html
    mainHtmlFormatFile:string = "";
    // for testing purposes, file to output viewer html to
    testCompiledHtmlFile:string = "";
    // file to use to test the viewer rendering
    testHtmlFile:string = "";
    // image to display if could not load desired image
    noDataImage:string = "";
    // file made by the python module to trigger this extension
    triggerFile:string = "";
    // css files to include in the compiled html
    cssFiles:string[] = [];
    // java script files to include in the compiled
    scriptFiles:string[] = [];
    // the current version of the python module
    curPythonModVer:string = "";
    // the path to the python module
    pythonModulePath:string = "";
    // yes response by user
    yes:string = "yes";
    // no response by user
    no:string = "no";

    // constructing user config class
    userConfig:UserConfig = new UserConfig(undefined);

    /**
     * 
     * @param workspace_path : path of the open workspace
     * @param extension_install_path : path to the installation of this extension
     */
    constructor(workspace_path:string|undefined, extension_install_path:string|undefined) {
        // checks if the inputs are valid
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
    /**
     * constructs the user config class attribute of this class
     */
    initUserConfig() {
        this.userConfig = new UserConfig(this.configFile);
        this.errorEncountered = this.userConfig.errorEncountered;
        this.errorMessage = this.userConfig.errorMessage;
    }
}

/**
 * 
 * @param context : context for this extension
 * @returns Config class containing the configuration of this extension
 */
export async function get_config(context:vscode.ExtensionContext):Promise<Config> {
    if (vscode.workspace.workspaceFolders !== undefined) {
        // if here, then a workspace is open
        // init the above class
        let config:Config = new Config(vscode.workspace.workspaceFolders[0].uri.fsPath, context.extensionPath);
        /**
         * For a description of what the attributes do, see the above class
         */
        config.configDir = path.join(config.workspacePath, ".UCQ_config");
		config.configFile = path.join(config.configDir, "config.json"); // needs to be json
        config.layoutFile =  path.join(config.configDir, "layout.json"); // needs to be json
        config.triggerFile = path.join(config.configDir, ".trigger");
        config.templateConfigFile = path.join(config.extensionInstallPath, "templates", "template_config");
        config.templatePythonFile = path.join(config.extensionInstallPath, "templates", "main.py");
        config.noDataImage = path.join(config.extensionInstallPath, "media", "no_img.jpg");
        config.mainHtmlFormatFile = path.join(config.extensionInstallPath, "media", "format.html");
        config.testHtmlFile = path.join(config.extensionInstallPath, "media", "test.html");
        config.testCompiledHtmlFile = path.join(config.configDir, "out.html");
        config.cssFiles = [
            path.join(config.extensionInstallPath, "media",  "reset.css"), 
            path.join(config.extensionInstallPath, "media", "vscode.css")
        ];
        config.scriptFiles = [
            path.join(config.extensionInstallPath, "packages", "resizable", "resizable.js"), // makes the resizable panels
            path.join(config.extensionInstallPath, "packages", "mathjax"  , "tex-chtml.js"), // allows latex to render
            path.join(config.extensionInstallPath, "packages", "jquery"   , "jquery.js") // used for loading other html files
        ];
        config.yes = "yes";
        config.no = "no";

        // python module stuff
        config.pythonModulePath = path.join(config.extensionInstallPath, "python_module");
        config.pythonModuleName = "UC_Quantum_Lab";
        config.curPythonModVer = "0.0.1";

        // initializing user config
        config.initUserConfig();

        return config
    } else {
        // returning a class that has no info
        return new Config(undefined, undefined);
    }
}