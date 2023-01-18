import * as vscode from "vscode";
//import * as fs from "fs";
import * as path from "path";
import { print, error } from "./src";
import { ProposedExtensionAPI } from "./pythonApiTypes";

/**
 * Class to store information about the current configuration for the user
 */
export class UserConfig {
    // the python interpreter path or command
    python:string= "";
    // pip executable path or command
    //pip:string = "";

    constructor() {}
}

/**
 * Class containing all of the information on the configuration of this extension
 */
export class Config {
    // the path of the workspace open in vscode
    workspacePath:string;
    // path where this extension is installed at
    extensionInstallPath:string;
    // the user config directory
    configDir:string = "";
    // the file containing the layout of the viewer
    layoutFile:string = "";
    // template config file to load into the user config directory with it is made
    templateLayoutFile:string = "";
    // example python file to give to the user if they want it
    templatePythonFile:string = "";
    // html format file to load and use as a template for the viewer's html
    mainHtmlFormatFile:string = "";
    // if an output of the html to be rendered should be created
    outputHtml:boolean = false;
    // for testing purposes, file to output viewer html to
    testCompiledHtmlFile:string = "";
    // css files to include in the compiled html
    cssFiles:string[] = [];
    // java script files to include in the compiled
    scriptFiles:string[] = [];
    // the minimum allowed version of the python module
    // minPythonModVer:string = "";
    // // minimum allowed version of python
    // minPythonVer:string = "";
    // // python module name on the python index
    // pythonModulePyPi:string = "";
    // // python module name in python
    // pythonModuleName:string = "";
    // yes response by user
    yes:string = "yes";
    // no response by user
    no:string = "no";
    // constructing user config class
    userConfig:UserConfig = new UserConfig();

    /**
     * 
     * @param workspacePath : path of the open workspace
     * @param extensionInstallPath : path to the installation of this extension
     */
    constructor(workspacePath:string|undefined, extensionInstallPath:string|undefined) {
        // checks if the inputs are valid
        if (workspacePath !== undefined && extensionInstallPath !== undefined) {
            this.workspacePath = workspacePath;
            this.extensionInstallPath = extensionInstallPath;
        } else {
            error("workspace is not valid, please open a folder");
            this.workspacePath = "";
            this.extensionInstallPath = "";
        }
    }
}

/**
 * 
 * @param context : context for this extension
 * @returns Config class containing the configuration of this extension
 */
export async function getConfig(context:vscode.ExtensionContext):Promise<Config> {
    if (vscode.workspace.workspaceFolders !== undefined) {
        // if here, then a workspace is open
        // init the above class
        let config:Config = new Config(vscode.workspace.workspaceFolders[0].uri.fsPath, context.extensionPath);
        /**
         * For a description of what the attributes do, see the above class definition
         */
        config.configDir = path.join(config.workspacePath, ".UCQ_config");
        config.layoutFile =  path.join(config.configDir, "layout.json"); // needs to be json
        config.templateLayoutFile = path.join(config.extensionInstallPath, "templates", "layout.json");
        config.templatePythonFile = path.join(config.extensionInstallPath, "templates", "main.py");
        config.mainHtmlFormatFile = path.join(config.extensionInstallPath, "media", "format.html");

        config.outputHtml = false;
        config.testCompiledHtmlFile = path.join(config.configDir, "out.html");
        
        config.cssFiles = [
            // path.join(config.extensionInstallPath, "packages", "bootstrap", "bootstrap.min.css"),
            path.join(config.extensionInstallPath, "media",  "reset.css"), 
            path.join(config.extensionInstallPath, "media", "vscode.css")
            //path.join(config.extensionInstallPath, "packages", "zoomist", "zoomist.css") // working on this
        ];
        config.scriptFiles = [
            path.join(config.extensionInstallPath, "packages", "resizable", "resizable.js"), // makes the resizable panels
            path.join(config.extensionInstallPath, "packages", "mathjax"  , "tex-chtml.js"), // allows latex to render
            path.join(config.extensionInstallPath, "packages", "jquery"   , "jquery.js") // used for loading other html files
            //path.join(config.extensionInstallPath, "packages", "zoomist", "zoomist.min.js") // working on this
            // path.join(config.extensionInstallPath, "media", "main.js")
        ];
        config.yes = "yes";
        config.no = "no";

        // loading python extension
        const extension = vscode.extensions.getExtension('ms-python.python');
        
        // if it was successfully loaded
        if (extension) {
            // if it is not active activate it
            if (!extension.isActive) { await extension.activate(); }

            // loading the api from the extension
            const pythonApi: ProposedExtensionAPI = extension.exports as ProposedExtensionAPI;
            
            // Loading the selected python path This will return something like /usr/bin/python
            const environmentPath = pythonApi.environments.getActiveEnvironmentPath();
            
            // setting the required attributes
            config.userConfig.python = environmentPath.path;
            // config.userConfig.pip = `${config.userConfig.python} -m pip`;
        } else { error("python extension is not available and it must installed to use this extension"); }
        
        // python module stuff
        // config.pythonModuleName = "UC_Quantum_Lab";
        // config.pythonModulePyPi = "UC-Quantum-tools";
        // config.minPythonModVer = "0.1.11";
        // config.minPythonVer = "3.8.0";

        return config;
    } else {
        error("must have an open folder in the workspace");
        // just so the compiler is happy
        return new Config(undefined, undefined);
    }
}