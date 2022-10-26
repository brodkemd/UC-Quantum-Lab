import * as vscode from "vscode";
import * as path from 'path';
import { Config } from "./config";
import { genHtml } from "./getHtml";
import { print } from "./src";

/**
 * Class for the viewer panel
 */
export class UCQ {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: UCQ | undefined;
    public static readonly viewType = "uc-quantum-lab";
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    public _config:Config;

    public static createOrShow(config:Config) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        if (UCQ.currentPanel) {
            UCQ.currentPanel._panel.reveal(column);
            UCQ.currentPanel.update();
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            UCQ.viewType,
            "UCQ Viewer ",
            {viewColumn : vscode.ViewColumn.Two, preserveFocus : false},
            {
                // Enable javascript in the webview
                enableScripts : true,
                // And restrict the webview to only loading content from our extension's install path and the workspace folder.
                localResourceRoots: [
                     vscode.Uri.file(config.workspacePath),
                     vscode.Uri.file(path.join(config.extensionInstallPath))
                ],
            }
        );
        print("Creating new Window");
        UCQ.currentPanel = new UCQ(panel, config);
    }

    /**
     * Destroys the panel
     */
    public static kill() {
        UCQ.currentPanel?.dispose();
        UCQ.currentPanel = undefined;
    }

    /**
     * Creates a new panel
     * @param panel : webview panel to reconstruct this class with
     * @param config : configuration of this extension
     */
    public static revive(panel: vscode.WebviewPanel, config:Config) {
        UCQ.currentPanel = new UCQ(panel, config);
    }

    /**
     * Constructs this class
     * @param panel : panel to construct this class with
     * @param config : configuration of this extension
     */
    private constructor(panel: vscode.WebviewPanel, config:Config) {
        this._panel = panel;
        this._config = config;
        // Set the webview's initial html content
        this.update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    /**
     * destroys this class
     */
    public dispose() {
        UCQ.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) { x.dispose(); }
        }
    }

    /**
     * Updates the panel with new html
     */
    public async update() {
        // updates user options
        this._panel.webview.html = await this._getHtmlForWebview();
        print("Updating webview panel");
    }

    /**
     * Gets the html for the viewer
     * @returns html as a string for the viewer
     */
    private async _getHtmlForWebview() {
        print("getting html for the page");
        // getting the html
        let source:string = await genHtml(this._panel.webview, this._config);
        // if something was returned from the html generator, return it
        if (source.length) { return source; }
        else {
            // if nothing was returned, return some html to indicate something went wrong
            return `<!DOCTYPE html>\n<html>\n<body>\n<h1>ERROR OCCURED: No Content to Display</h1>\n</body>\n</html>`;
        }
    }
}