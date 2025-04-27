"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
// This script runs after npm install
console.log(chalk_1.default.green('\n✓ Velo Chat Logger installed successfully!\n'));
console.log(chalk_1.default.blue('To automatically log Amazon Q sessions, run:'));
console.log('  velo-tracker install\n');
console.log(chalk_1.default.blue('To start logging manually:'));
console.log('  velo-tracker start\n');
console.log(chalk_1.default.blue('For more information:'));
console.log('  velo-tracker --help\n');
