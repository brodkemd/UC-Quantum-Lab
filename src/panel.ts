import * as vscode from "vscode";
import * as path from 'path';
import { Config } from "./config";
// import {compile_html, test_html } from "./compile_html";
import { genHtml } from "./getHtml";
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
    public _config:Config;

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
                     vscode.Uri.file(path.join(config.extensionInstallPath))
                ],
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
        this._config = config;
        // Set the webview's initial html content
        this.update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
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
        // updates user options
        this._panel.webview.html = await this._getHtmlForWebview(webview);
        print("Updating webview panel");
        //print(this._panel.webview.html);

    }

    private async _getHtmlForWebview(webview: vscode.Webview) {
        print("getting html for the page")
        
        let source:string = await genHtml(this._panel.webview, this._config);
        // print(webview.asWebviewUri(vscode.Uri.file("/home/marekbrodke/Documents/vscode_exts/uc-quantum-lab/packages/jquery/dist/jquery.js")).toString());
        // print(webview.asWebviewUri(vscode.Uri.file("/home/marekbrodke/Documents/vscode_exts/uc-quantum-lab/media/extern.html")).toString());
        // return `<!doctype html>
        // <html lang="en">
        //   <head>
        //     <!-- Required meta tags -->
        //     <meta charset="utf-8">
        //     <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        //     <script id="MathJax-script" async src="${webview.asWebviewUri(vscode.Uri.file("/home/marekbrodke/Documents/vscode_exts/uc-quantum-lab/packages/mathjax/tex-chtml.js"))}"></script>
        //     <script src="${webview.asWebviewUri(vscode.Uri.file("/home/marekbrodke/Documents/vscode_exts/uc-quantum-lab/packages/jquery/dist/jquery.js"))}"></script> 
        //     <script> 
        //       $(function () {
        //         var includes = $('[data-include]')
        //         $.each(includes, function () {
        //           var file = $(this).data('include')
        //           $(this).load(file)
        //         })
        //       })
        //     </script> 
        //   </head>
        //   <body>
        //     <div data-include="${webview.asWebviewUri(vscode.Uri.file("/home/marekbrodke/Documents/vscode_exts/uc-quantum-lab/media/extern.html"))}"></div>
        //   </body>
        // </html>`;
        if (source.length) {
            return source;
        } else {
            //return `<!DOCTYPE html>\n<html>\n<body>\n<h1>No Content to Display</h1>\n</body>\n</html>`;
            return `<!doctype html>
            <html lang="en">
              <head>
                <!-- Required meta tags -->
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
                <script src="${vscode.Uri.file("/home/marekbrodke/Documents/vscode_exts/uc-quantum-lab/packages/jquery/dist/jquery.js")}"></script> 
                <script> 
                  $(function () {
                    var includes = $('[data-include]')
                    $.each(includes, function () {
                      var file = $(this).data('include')
                      $(this).load(file)
                    })
                  })
                </script> 
              </head>
              <body>
                <div data-include="${vscode.Uri.file("/home/marekbrodke/Documents/vscode_exts/uc-quantum-lab/media/extern.html")}"></div>
              </body>
            </html>`;
        }
    }
}