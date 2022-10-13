import * as vscode from "vscode";
import * as path from 'path';
import { Config } from "./config";
import {compile_html } from "./compile_html";
import { print } from "./src";
export class UCQ {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: UCQ | undefined;

    public static readonly viewType = "uc-quantum-lab";

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public open:boolean = false;
    public config:Config;

    public static createOrShow(config:Config) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

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
                enableScripts : true
                // And restrict the webview to only loading content from our extension's `media` directory.
                // localResourceRoots: [
                //     vscode.Uri.file(config.workspacePath),
                //     vscode.Uri.from(path.join(config.extensionInstallPath, "media"));
                // ],
            }
        );
        print("Creating new instance");
        UCQ.currentPanel = new UCQ(panel, config);
    }

    public static kill() {
        UCQ.currentPanel?.dispose();
        UCQ.currentPanel = undefined;
    }

    public static revive(panel: vscode.WebviewPanel, config:Config) {
        UCQ.currentPanel = new UCQ(panel, config);
    }

    private constructor(panel: vscode.WebviewPanel, config:Config) {
        this._panel = panel;
        this.config = config;

        // Set the webview's initial html content
        this.update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // // Handle messages from the webview
        // this._panel.webview.onDidReceiveMessage(
        //     (message) => {
        //         switch (message.command) {
        //             case "alert":
        //                 vscode.window.showErrorMessage(message.text);
        //                 return;
        //         }
        //     },
        //     null,
        //     this._disposables
        // );
    }

    public dispose() {
        UCQ.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public async update() {
        const webview = this._panel.webview;
        this._panel.webview.html = await this._getHtmlForWebview(webview);
        print("Updating webview panel");
        print(this._panel.webview.html);

    }

    private async _getHtmlForWebview(webview: vscode.Webview) {
        print("getting html for the page")
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.file(path.join(
            this.config.extensionInstallPath,
            "media",
            "reset.css"
        )));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.file(path.join(
            this.config.extensionInstallPath,
            "media",
            "vscode.css"
        )));

        // Use a nonce to only allow specific scripts to be run
        const image_src = webview.asWebviewUri(vscode.Uri.file(path.join(
            this.config.extensionInstallPath,
            "media",
            "uc.png"
        )));
        
        let source:string = await compile_html(this.config);
        if (source.length) {
            return source;
        } else {
            return `<!DOCTYPE html>\n<html>\n<body>\n<h1>No Content to Display</h1>\n</body>\n</html>`;
        }
    }
}