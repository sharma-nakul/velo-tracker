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
Object.defineProperty(exports, "__esModule", { value: true });
exports.installShellHooks = installShellHooks;
exports.uninstallShellHooks = uninstallShellHooks;
exports.createHomebrewFormula = createHomebrewFormula;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
/**
 * Shell configuration file paths
 */
const SHELL_CONFIG_FILES = {
    bash: path.join(os.homedir(), '.bashrc'),
    zsh: path.join(os.homedir(), '.zshrc'),
};
/**
 * Hook script to automatically log Amazon Q sessions
 */
const HOOK_SCRIPT = `
# Amazon Q Velo Chat Logger integration
function q() {
  if [[ "$1" == "chat" ]]; then
    # Start a new velo-tracker session
    local profile="default"
    
    # Check for AWS_PROFILE environment variable
    if [[ -n "$AWS_PROFILE" ]]; then
      profile="$AWS_PROFILE"
    fi
    
    # Check for --profile flag in the command
    for arg in "$@"; do
      if [[ "$arg" == "--profile" ]]; then
        # Get the next argument after --profile
        profile_found=true
      elif [[ "$profile_found" == "true" ]]; then
        profile="$arg"
        unset profile_found
      fi
    done
    
    # Start logging session
    velo-tracker start --profile "$profile" > /dev/null 2>&1
    
    # Run the original command
    command q "$@"
    
    # End logging session
    velo-tracker end --profile "$profile" > /dev/null 2>&1
  else
    # Run the original command without logging
    command q "$@"
  fi
}
`;
/**
 * Install shell hooks to automatically log Amazon Q sessions
 * @param shells Array of shells to install hooks for ('bash', 'zsh', or both)
 * @returns Object with installation status for each shell
 */
async function installShellHooks(shells = ['bash', 'zsh']) {
    const results = {};
    for (const shell of shells) {
        const configFile = SHELL_CONFIG_FILES[shell];
        if (!await fs.pathExists(configFile)) {
            results[shell] = false;
            continue;
        }
        try {
            // Read current config
            const currentConfig = await fs.readFile(configFile, 'utf8');
            // Check if hook is already installed
            if (currentConfig.includes('# Amazon Q Velo Chat Logger integration')) {
                results[shell] = true;
                continue;
            }
            // Append hook script
            await fs.appendFile(configFile, HOOK_SCRIPT);
            results[shell] = true;
        }
        catch (error) {
            results[shell] = false;
        }
    }
    return results;
}
/**
 * Uninstall shell hooks
 * @param shells Array of shells to uninstall hooks from ('bash', 'zsh', or both)
 * @returns Object with uninstallation status for each shell
 */
async function uninstallShellHooks(shells = ['bash', 'zsh']) {
    const results = {};
    for (const shell of shells) {
        const configFile = SHELL_CONFIG_FILES[shell];
        if (!await fs.pathExists(configFile)) {
            results[shell] = false;
            continue;
        }
        try {
            // Read current config
            let currentConfig = await fs.readFile(configFile, 'utf8');
            // Check if hook is installed
            if (!currentConfig.includes('# Amazon Q Velo Chat Logger integration')) {
                results[shell] = true;
                continue;
            }
            // Remove hook script
            const hookStartIndex = currentConfig.indexOf('# Amazon Q Velo Chat Logger integration');
            const hookEndIndex = currentConfig.indexOf('}\n', hookStartIndex) + 2;
            if (hookStartIndex >= 0 && hookEndIndex > hookStartIndex) {
                currentConfig =
                    currentConfig.substring(0, hookStartIndex) +
                        currentConfig.substring(hookEndIndex);
                await fs.writeFile(configFile, currentConfig);
                results[shell] = true;
            }
            else {
                results[shell] = false;
            }
        }
        catch (error) {
            results[shell] = false;
        }
    }
    return results;
}
/**
 * Create a Homebrew formula for the package
 * @param packagePath Path to the package
 * @param version Package version
 * @returns Path to the created formula file
 */
async function createHomebrewFormula(packagePath, version) {
    const formulaDir = path.join(os.homedir(), 'homebrew-velo-tracker');
    const formulaPath = path.join(formulaDir, 'velo-tracker.rb');
    // Create formula directory if it doesn't exist
    await fs.ensureDir(formulaDir);
    // Create tarball of the package
    const tarballName = `velo-tracker-${version}.tgz`;
    const tarballPath = path.join(os.tmpdir(), tarballName);
    (0, child_process_1.execSync)(`npm pack ${packagePath} --pack-destination ${os.tmpdir()}`, { stdio: 'ignore' });
    // Calculate SHA256 hash of the tarball
    const sha256 = (0, child_process_1.execSync)(`shasum -a 256 ${tarballPath}`).toString().split(' ')[0];
    // Get repository URL from package.json
    const packageJson = await fs.readJson(path.join(packagePath, 'package.json'));
    const repoUrl = packageJson.repository?.url || '';
    const homepage = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
    // Create formula file
    const formula = `
class VeloChatLogger < Formula
  desc "A command line tool for tracking Amazon Q Dev CLI sessions and feature development"
  homepage "${homepage}"
  url "file://${tarballPath}"
  sha256 "${sha256}"
  license "ISC"
  
  depends_on "node"
  
  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end
  
  test do
    assert_match "velo-tracker", shell_output("#{bin}/velo-tracker --help")
  end
end
`;
    await fs.writeFile(formulaPath, formula);
    return formulaPath;
}
