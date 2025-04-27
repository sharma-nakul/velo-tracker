"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = registerCommands;
const list_1 = require("./list");
const start_1 = require("./start");
const end_1 = require("./end");
const cleanup_1 = require("./cleanup");
const summary_1 = require("./summary");
const install_1 = require("./install");
const brew_1 = require("./brew");
/**
 * Register all commands with the program
 * @param program Commander program instance
 */
function registerCommands(program) {
    (0, start_1.registerStartCommand)(program);
    (0, end_1.registerEndCommand)(program);
    (0, list_1.registerListCommand)(program);
    (0, cleanup_1.registerCleanupCommand)(program);
    (0, summary_1.registerSummaryCommand)(program);
    (0, install_1.registerInstallCommand)(program);
    (0, brew_1.registerBrewCommand)(program);
}
