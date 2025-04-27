# Velo Tracker

[![npm version](https://img.shields.io/npm/v/velo-tracker.svg)](https://www.npmjs.com/package/velo-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)

A powerful command-line tool for tracking and analyzing your Amazon Q Dev CLI sessions, managing feature development, and integrating with AI chatbots. Gain insights into your usage patterns, manage sessions across different AWS profiles, and optimize your workflow.

<p align="center">
  <img src="https://via.placeholder.com/800x400?text=Velo+Tracker" alt="Velo Tracker" width="600">
</p>

## 🚀 Features

- **Automatic Session Tracking**: Seamlessly log when Amazon Q Dev CLI sessions start and end
- **Profile Management**: Track sessions by AWS profile name for project-specific insights
- **Amazon Q Profile Support**: Track usage across different Amazon Q profiles
- **Comprehensive Analytics**: View detailed session history with duration metrics
- **Feature Tracking**: Track feature development with progress updates and status changes
- **GitHub Integration**: Create and link GitHub issues for features
- **AI Chatbot Integration**: Integrate with Amazon Q, Cursor AI, and other chatbots
- **Shell Integration**: Works with both Bash and Zsh shells through simple hooks
- **Data Organization**: Logs automatically organized by profile
- **Cleanup Utilities**: Easily manage log storage with automatic cleanup options
- **Log Compaction**: Compact old logs to save space while preserving usage statistics
- **Usage Summaries**: Generate profile-based usage reports
- **Cross-Platform**: Works on macOS, Linux, and Windows
- **Homebrew Support**: Simple installation for macOS users

## 📋 Table of Contents

- [Installation](#-installation)
- [Usage](#-usage)
- [Commands](#-commands)
- [Shell Integration](#-shell-integration)
- [Amazon Q Profiles](#-amazon-q-profiles)
- [Feature Tracking](#-feature-tracking)
- [AI Chatbot Integration](#-ai-chatbot-integration)
- [Log Structure](#-log-structure)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

## 📦 Installation

### Using npm

```bash
# Install globally
npm install -g velo-tracker

# Or install locally
npm install velo-tracker
```

### Using Homebrew (macOS)

```bash
# Create the Homebrew formula
velo-tracker brew

# Then follow the instructions to tap and install
brew tap sharma-nakul/velo-tracker
brew install velo-tracker
```

## 🔧 Usage

After installation, you can start using Velo Tracker with the following commands:

```bash
# Display help
velo-tracker --help

# Install shell hooks for automatic logging
velo-tracker install

# Start a session manually
velo-tracker start --profile my-profile --q-profile my-q-profile

# End a session manually
velo-tracker end --profile my-profile

# View your session history
velo-tracker list
```

## 📝 Commands

### Shell Integration

```bash
# Install shell hooks (works with both bash and zsh)
velo-tracker install

# To install for a specific shell only
velo-tracker install --shell bash
velo-tracker install --shell zsh

# To uninstall shell hooks
velo-tracker uninstall
```

### Session Management

```bash
# Start a session with default profile
velo-tracker start

# Start a session with a specific AWS profile
velo-tracker start --profile my-profile

# Start a session with a specific Amazon Q profile
velo-tracker start --q-profile my-q-profile

# Start a session with both AWS and Amazon Q profiles
velo-tracker start --profile my-profile --q-profile my-q-profile

# End the active session for default profile
velo-tracker end

# End the active session for a specific profile
velo-tracker end --profile my-profile

# End a specific session by ID
velo-tracker end --session-id 123e4567-e89b-12d3-a456-426614174000
```

### Analytics

```bash
# List sessions for default profile
velo-tracker list

# List sessions for a specific AWS profile
velo-tracker list --profile my-profile

# List sessions for a specific Amazon Q profile
velo-tracker list --q-profile my-q-profile

# Limit the number of sessions displayed
velo-tracker list --limit 5

# Summarize all profiles
velo-tracker summary

# Summarize a specific profile
velo-tracker summary --profile my-profile
```

### Maintenance

```bash
# Delete logs older than 30 days (default)
velo-tracker cleanup

# Delete logs older than a specific number of days
velo-tracker cleanup --days 60

# Clean up logs for a specific profile
velo-tracker cleanup --profile my-profile

# Compact logs older than 30 days instead of deleting them
velo-tracker cleanup --compact

# Compact logs older than a specific number of days
velo-tracker cleanup --days 60 --compact
```

### Homebrew

```bash
# Create a Homebrew formula for the package
velo-tracker brew
```

## 🔄 Shell Integration

Velo Tracker integrates with your shell to automatically track Amazon Q Dev CLI sessions. When you run `q chat`, the shell hook:

1. Detects the AWS profile being used (from command line arguments or environment variables)
2. Detects the Amazon Q profile being used (from command line arguments)
3. Starts a logging session with `velo-tracker start`
4. Runs the original `q chat` command
5. Ends the logging session with `velo-tracker end` when you exit Amazon Q

This provides seamless tracking without requiring manual intervention.

## 🧩 Amazon Q Profiles

Amazon Q supports custom profiles that can be created using the `/profile` command within a chat session. Velo Tracker can track which Amazon Q profile was used for each session, allowing you to:

- Track usage across different Amazon Q profiles
- Compare productivity between different profile configurations
- Understand which profiles you use most frequently

To use this feature:

1. Create Amazon Q profiles using the `/profile` command in Amazon Q
2. Start Amazon Q with a specific profile: `q chat --profile my-q-profile`
3. The shell integration will automatically detect and log the Amazon Q profile
4. View profile-specific usage with `velo-tracker list --q-profile my-q-profile`

## 📊 Feature Tracking

Velo Tracker includes a built-in feature tracking system to manage development and track progress:

```bash
# Add a new feature to track
velo-tracker feature add -n "Feature name" -d "Detailed description" -p high

# List all tracked features
velo-tracker feature list

# Update feature status
velo-tracker feature update -i <feature-id> -s in-progress

# Add progress updates
velo-tracker feature progress -i <feature-id> -m "Implemented core functionality" -p 50

# View progress for a specific feature
velo-tracker feature show-progress -i <feature-id>

# Create GitHub issues for features (maintainers only)
velo-tracker feature add -n "Feature name" -d "Description" --github --github-token <token>
```

This feature tracking system helps maintain transparency in development and provides a clear roadmap for future enhancements.

## 🔌 AI Chatbot Integration

Velo Tracker can be integrated with AI chatbots like Amazon Q, Cursor AI, and others through its Model Context Protocol (MCP) server:

```bash
# Start the MCP server
velo-tracker server

# Start the server on a specific port
velo-tracker server --port 3000
```

### Integration Examples

The package includes example integrations for popular AI chatbots:

- **Amazon Q**: Track sessions and feature development in Amazon Q
- **Cursor AI**: Monitor coding sessions and feature progress in Cursor AI

### API Endpoints

The MCP server provides RESTful API endpoints for:

- Session management (start/end/list)
- Feature tracking (create/update/list)
- Progress monitoring (add/view progress updates)

### Client Library

Use the built-in client library to integrate with the MCP server:

```javascript
const { MCPClient } = require('velo-tracker');

// Create a client
const client = new MCPClient('localhost', 3000);

// Start a session
const session = await client.startSession('my-project', 'my-ai-profile');

// Create a feature
const feature = await client.createFeature('New Feature', 'Description', 'high');

// Update progress
await client.addProgress(feature.id, 'Implemented core functionality', 50);
```

## 📁 Log Structure

Logs are stored in a structured format in the following directory:

```
~/.velo-tracker/logs/<profile>/
```

Each profile directory contains:
- `combined.log`: All log entries
- `error.log`: Error log entries only
- `active-session.json`: Currently active session (if any)
- `archive/`: Directory containing completed session information

Session data is stored as JSON files, making it easy to integrate with other tools or perform custom analysis.

## 💻 Development

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher

### Setup

```bash
# Clone the repository
git clone https://github.com/sharma-nakul/velo-tracker.git
cd velo-tracker

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Project Structure

```
velo-tracker/
├── dist/               # Compiled JavaScript files
├── src/                # TypeScript source code
│   ├── commands/       # CLI command implementations
│   ├── server/         # MCP server implementation
│   ├── clients/        # Client libraries
│   ├── utils/          # Utility functions
│   ├── index.ts        # Main entry point
│   ├── logger.ts       # Logging functionality
│   ├── postinstall.ts  # Post-installation script
│   └── types.ts        # TypeScript type definitions
├── examples/           # Integration examples
├── package.json        # Project configuration
└── tsconfig.json       # TypeScript configuration
```

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please make sure your code follows the existing style and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Nakul Sharma

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/sharma-nakul">Nakul Sharma</a>
</p>
