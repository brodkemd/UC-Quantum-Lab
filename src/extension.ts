// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
/** known Isssues:
 * Possible overlap with file that has the same name as config_dir
 * 
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { UCQ } from './panel';
import { getConfig, Config } from "./config";
import { setupPython, verifyPython } from "./pythonHandling";
import { print, error, info, getLastFromPath, mkDir, checkIfFileInDir, waitForTriggerFile, delay } from "./src";

/**
 * Initializes the workspace/current directory for this extension
 * @param config : configuration of the extension
 * @param verbose : boolean indicating whether to be verbose in messages
 * @returns boolean indicating whether or not this function extension exceeded
 */
async function init(config:Config, verbose:boolean=false) {
 	print("Running \"init\"");
	
	// the config directory exists
	if (!(fs.existsSync(config.configDir))) {
		// setting up python if need be, if function returns true then the setup succeeded and vice versa
		await setupPython(config);

		// prompting the user if they want to make the config directory
		let choice:string|undefined = await vscode.window.showInformationMessage(`Do you want to initialize your current directory for this extension (will make the dir "${getLastFromPath(config.configDir)}" here)`, config.yes, config.no);
		
		// if the user wants to make the config directory
		if (choice === config.yes) {
			// making the config directory
			await mkDir(config.configDir);
		} else {
			// can not operate without config directory
			error("User blocked config directory creation, can not execute without it");
		}
		// saving user config the config file in the config directory
		config.userConfig.save();

		// copies template layout file to be displayed in the viewer
		try {
			await fs.promises.copyFile(config.templateLayoutFile, config.layoutFile);
		} catch ( e ) {
			error(`while trying to copy template layout file to config dir: ${(e as Error).message}`);
		}

		// getting the template main file name from the template main file path
		let fname = getLastFromPath(config.templatePythonFile);

		// if the main file is not in the current directory
		if (!(await checkIfFileInDir(config.workspacePath, fname))) {
			// prompting the user if they want an example main file
			let selection:string|undefined = await vscode.window.showInformationMessage(`Do you want an example main file?`, config.yes, config.no);
			
			// if they want a main file
			if (selection === config.yes) {
				print("Making main file");
				// copying template file to current directory
				fs.copyFile(config.templatePythonFile, 
							path.join(config.workspacePath, fname), 
							(err) => {
					if (err){
						error(`Error copying "${config.templatePythonFile}" to "${fname}"`);
					}
				});
				// opening the example file in the editor
				let documet:vscode.TextDocument|undefined = await vscode.workspace.openTextDocument(path.join(config.workspacePath, fname));
				if (documet === undefined) {
					// if the opening of the file failed let the user know
				 	error(`could not open "${path.join(config.workspacePath, fname)} in code"`);
				} else {
					// opens document in first column
					await vscode.window.showTextDocument(documet, vscode.ViewColumn.One, false);
				}
			}
		}
	} else {
		// if the user config file exists
		if (fs.existsSync(config.configFile)) {
			// loading the user config from the file
			config.userConfig.get();

			try {
				// checking python setup
				await verifyPython(config);
			} catch ( e ) {
				print("detected faulty config");
				// asking the user if they want to reinitialize the current directory
				let choice:string|undefined = await vscode.window.showInformationMessage("Detected faulty config, do you want to reinit the workspace?", config.yes, config.no);
				// if yes, then reinit it
				if (choice === config.yes) {
					// running the reinit command
					vscode.commands.executeCommand('uc-quantum-lab.reinit');
				} else if (choice === undefined) {
					// if the user choose nothing
					error("Invalid choice for whether or not to reinit");
				}
			}
			if (verbose) {
				info("Current workspace is already initialized, nothing to do");
			}
		// if there is no config file to pull information from
		} else {
			print("detected faulty config");
			// asking the user if they want to reinitialize the current directory
			let choice:string|undefined = await vscode.window.showInformationMessage("Detected faulty config, do you want to reinit the workspace?", config.yes, config.no);
			
			// if yes, then reinit it
			if (choice === config.yes) {
				// running the reinit command
				vscode.commands.executeCommand('uc-quantum-lab.reinit');
			} else if (choice === undefined) {
				// if the user choose nothing
				error("Invalid choice for whether or not to reinit");
			}
		}
	}
}

/**
 * This is essentially the main function for this extension, vscode calls this when
 * the extension is activated
 */
export async function activate(context: vscode.ExtensionContext) {
	print("In activate");

	// adding the command to vscode
	context.subscriptions.push(
		vscode.commands.registerCommand("uc-quantum-lab.execute", async () => {
			print("--- executing ---");
			try {
				// loading the configuration from the ./config.ts
				let config:Config = await getConfig(context);
			
				// if the viewer panel is open and there is an active editor
				if (UCQ.currentPanel && vscode.window.activeTextEditor) {
					print("Window is active");
					// if there is a document open in the text editor
					if (vscode.window.activeTextEditor.document !== undefined) {
						// loads python from local config.json
						config.userConfig.get();

						// checking if the active editor file is a python file
						if (!(vscode.window.activeTextEditor.document.fileName.endsWith(".py"))) {
							// can not execute non python file, so telling the user that
							error(`"${vscode.window.activeTextEditor.document.fileName}" is not a python file, can not execute it`);
							return;
						} else {
							// if here, then the file is a python file
							print("saving active document");
							await vscode.window.activeTextEditor.document.save();
							
							print("executing in termial");
							// if there is an active terminal in editor
							if (vscode.window.activeTerminal) {
								print("Sending to active terminal");
								// making sure the user can see the terminal
								vscode.window.activeTerminal.show(true);
								// sending the python command to active terminal to execute the active python file
								vscode.window.activeTerminal.sendText(`${config.userConfig.python} ${vscode.window.activeTextEditor.document.fileName}`);
							} else {
								// if here, then there was no active terminal so one is made
								print("creating terminal and sending to it");
								// creating terminal in vscode
								let term = vscode.window.createTerminal();
								// sending the python command to active terminal to execute the active python file
								term.sendText(`${config.userConfig.python} ${vscode.window.activeTextEditor.document.fileName}`);
							}
							print("Waiting for trigger file");
							
							// waiting for trigger file to be made by the python module, this extension waits for it then continues
							await waitForTriggerFile(config);
							
							// this is temporary, waiting a bit to let things cool down in the filesystem
							await delay(100); // milliseconds
							
							// updating the panel, note: no longer need to pass the config because no longer html from config
							UCQ.currentPanel.update();
						}
					} else {
						// can not execute nothing
						error("Must have an active document open"); 
						return; 
					}
				} else {
					// if nothing is opening, first running init to make sure everything is setup correctly
					await init(config);
					print("Creating Window");
					// creating window
					UCQ.createOrShow(config);
				}
			// functions handle their own errors so do not need to do anything here
			} catch ( e ) {}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('uc-quantum-lab.init', async () => {
			try {
				// loading the config from "./config.ts"
				let config:Config = await getConfig(context);
				
				// initing the current directory
				await init(config, true);
			// functions handle their own errors so do not need to do anything here
			} catch ( e ) {}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('uc-quantum-lab.reinit', async () => {
			try {
				// loading the config from "./config.ts"
				let config:Config = await getConfig(context);

				// if the config directory exists in the current directory
				if (fs.existsSync(config.configDir)) {
					// prompting user with what it will do to the config directory
					let choice:string|undefined = await vscode.window.showInformationMessage(`Will delete "${config.configDir}" from the current directory, is this ok`, config.yes, config.no);

					// if they agreed to the previous message
					if (choice === config.yes) {
						// removing the config directory and catching errors
						try { fs.rmSync(config.configDir, { recursive: true, force: true }); }
						catch ( e ) { error(`error encountered when deleting config directory, with message: ${e}`); }

					} else if (choice === undefined) {
						// the user can not choose nothing
						error("Invalid choice for deletion config dir");
						return;
					}
				}
				// initing the current directory, do not to wrap the function call in an "if" because the function will handle its own errors
				await init(config);
			// functions handle their own errors so do not need to do anything here
			} catch ( e ) {}
		})
	);
}

// This method is called when your extension is deactivated, currently does nothing
export function deactivate() {}