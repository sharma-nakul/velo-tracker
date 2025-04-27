"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBrewCommand = registerBrewCommand;
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const shell_integration_1 = require("../utils/shell-integration");
/**
 * Register the brew command
 * @param program Commander program instance
 */
function registerBrewCommand(program) {
    program
        .command('brew')
        .description('Create a Homebrew formula for the package')
        .action(async () => {
        try {
            // Get package info
            const packagePath = path.resolve(__dirname, '..', '..');
            const packageJson = await fs.readJson(path.join(packagePath, 'package.json'));
            const version = packageJson.version;
            console.log(chalk_1.default.blue('Creating Homebrew formula...'));
            const formulaPath = await (0, shell_integration_1.createHomebrewFormula)(packagePath, version);
            console.log(chalk_1.default.green(`✓ Homebrew formula created at: ${formulaPath}`));
            // Extract username from repository URL
            const repoUrl = packageJson.repository?.url || '';
            const username = repoUrl.match(/github\.com\/([^\/]+)/)?.[1] || 'your-username';
            console.log(chalk_1.default.yellow('\nTo install with Homebrew:'));
            console.log(chalk_1.default.blue(`brew tap ${username}/velo-tracker`));
            console.log(chalk_1.default.blue(`brew install velo-tracker`));
            console.log(chalk_1.default.yellow('\nNote: You need to:'));
            console.log('1. Create a GitHub repository for your tap');
            console.log('2. Push the formula to the repository');
            console.log('3. Update the formula URL to point to your GitHub releases');
        }
        catch (error) {
            console.error(chalk_1.default.red('Error creating Homebrew formula:'), error);
            process.exit(1);
        }
    });
}
