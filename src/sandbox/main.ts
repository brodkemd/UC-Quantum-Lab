import { print } from "./src"
import {Config, get_config} from "./config"
import {genHtml} from "./htmlCompiler"

async function main() {
    let config:Config = await get_config();
    let out:string = await genHtml(config);
}

main();
