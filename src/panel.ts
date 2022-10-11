import * as vscode from "vscode";
import * as path from 'path';
import { Config } from "./config";
import { get_main_html } from "./compile_html";
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
                enableScripts : true,
                // And restrict the webview to only loading content from our extension's `media` directory.
                localResourceRoots: [
                    vscode.Uri.file(config.workspacePath),
                    vscode.Uri.file(config.extensionInstallPath)
                ],
            }
        );

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
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
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
        //		<h1>hello</h1>
        // <img src=\"${image_src.fsPath}\" alt="No Image to Display"/>
//         let source:string = `<!DOCTYPE html>
// <html lang="en">
// <head><meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1.0">
// </head>
// 	<body>
// `;
//         for (let file of this._text_files) {
//             let to_add:string = "h:matrix>";
//             let contents:string = readFileSync(file).toString();
//             for (let element of contents.split("\n")) {
//                 to_add.concat(element.split(":")[0], "|", element.split(":")[-1], ";");
//             }
//             to_add = to_add.slice(0, to_add.length -1)
//             to_add.concat("</h:matrix>");
            
//         }
        
        //source.concat(`</body>\n</html>`);
        let source:string = get_main_html(this.config);
        if (source.length) {
            return source;
        } else {
            return `<!DOCTYPE html>\n<html>\n<body>\n<h1>Error setting html</h1>\n</body>\n</html>`;
        }
    }
}