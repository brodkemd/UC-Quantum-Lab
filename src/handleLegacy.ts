import * as path from "path";
import * as fs from "fs";
import { Config } from "./config";
import { print } from "./src";

/**
 * Handles features used by previous versions of this extension
 * @param config : configuration of the extension
 */
export async function handleLegacy(config:Config) {
    // files leftover from previous versions of the extension
    print("handling legacy files");
    let legacyFiles:string[] = [
        path.join(config.configDir, "config.json"),
        path.join(config.configDir, ".trigger")
    ];
    // removing the no longer needed files
    for (let file of legacyFiles) {
        if (fs.existsSync(file)) { 
            await fs.promises.rm(file);
            print(`> removed: ${file}`);
        }
    }
}