import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { ShellConfig } from '../types';
import { logger } from '../logger';

export const getShellConfig = (): ShellConfig => {
  const shell = process.env.SHELL || '';
  
  if (shell.includes('zsh')) {
    return {
      shell: 'zsh',
      rcFile: path.join(os.homedir(), '.zshrc')
    };
  } else {
    // Default to bash
    return {
      shell: 'bash',
      rcFile: path.join(os.homedir(), '.bashrc')
    };
  }
};

export const installShellHook = async (shellConfig: ShellConfig): Promise<boolean> => {
  try {
    const hookContent = `
# Velo Chat Logger integration
function q() {
  if [[ "$1" == "chat" ]]; then
    # Extract AWS profile from arguments or environment
    local aws_profile=""
    local q_profile=""
    
    # Parse command line arguments
    for ((i=1; i<=$#; i++)); do
      local arg="${!i}"
      local next_arg=""
      if [[ $((i+1)) -le $# ]]; then
        next_arg="${!((i+1))}"
      fi
      
      if [[ "$arg" == "--profile" && -n "$next_arg" ]]; then
        aws_profile="$next_arg"
      fi
      
      if [[ "$arg" == "--profile="* ]]; then
        aws_profile="${arg#*=}"
      fi
      
      if [[ "$arg" == "--q-profile" && -n "$next_arg" ]]; then
        q_profile="$next_arg"
      fi
      
      if [[ "$arg" == "--q-profile="* ]]; then
        q_profile="${arg#*=}"
      fi
    done
    
    # Use environment variable if no profile specified in arguments
    if [[ -z "$aws_profile" && -n "$AWS_PROFILE" ]]; then
      aws_profile="$AWS_PROFILE"
    fi
    
    # Default to 'default' if still no profile
    if [[ -z "$aws_profile" ]]; then
      aws_profile="default"
    fi
    
    # Default to 'default' if no Q profile specified
    if [[ -z "$q_profile" ]]; then
      q_profile="default"
    fi
    
    # Start logging session
    velo-tracker start --profile "$aws_profile" --q-profile "$q_profile"
    
    # Run the original command
    command q "$@"
    
    # End logging session
    velo-tracker end --profile "$aws_profile"
  else
    # For other q commands, just pass through
    command q "$@"
  fi
}
`;

    const rcContent = await fs.readFile(shellConfig.rcFile, 'utf8');
    
    // Check if hook is already installed
    if (rcContent.includes('# Velo Chat Logger integration')) {
      logger.info(`Shell hook already installed in ${shellConfig.rcFile}`);
      return true;
    }
    
    // Append hook to rc file
    await fs.appendFile(shellConfig.rcFile, hookContent);
    logger.info(`Shell hook installed in ${shellConfig.rcFile}`);
    logger.info(`Please restart your shell or run 'source ${shellConfig.rcFile}' to activate the hook`);
    
    return true;
  } catch (error) {
    logger.error(`Failed to install shell hook: ${error.message}`);
    return false;
  }
};

export const uninstallShellHook = async (shellConfig: ShellConfig): Promise<boolean> => {
  try {
    const rcContent = await fs.readFile(shellConfig.rcFile, 'utf8');
    
    // Find the hook in the rc file
    const startMarker = '# Velo Chat Logger integration';
    const startIndex = rcContent.indexOf(startMarker);
    
    if (startIndex === -1) {
      logger.info(`No shell hook found in ${shellConfig.rcFile}`);
      return true;
    }
    
    // Find the end of the hook (next empty line after function closing brace)
    let endIndex = rcContent.indexOf('\n}', startIndex);
    if (endIndex !== -1) {
      endIndex = rcContent.indexOf('\n', endIndex + 2);
      if (endIndex === -1) {
        endIndex = rcContent.length;
      }
    } else {
      logger.warn(`Could not find the end of the shell hook in ${shellConfig.rcFile}`);
      return false;
    }
    
    // Remove the hook
    const newContent = rcContent.substring(0, startIndex) + rcContent.substring(endIndex + 1);
    await fs.writeFile(shellConfig.rcFile, newContent);
    
    logger.info(`Shell hook removed from ${shellConfig.rcFile}`);
    logger.info(`Please restart your shell or run 'source ${shellConfig.rcFile}' to apply the changes`);
    
    return true;
  } catch (error) {
    logger.error(`Failed to uninstall shell hook: ${error.message}`);
    return false;
  }
};
