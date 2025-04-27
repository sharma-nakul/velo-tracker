# Contributing to Velo Chat Logger

Thank you for considering contributing to Velo Chat Logger! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Feature Development Process](#feature-development-process)
- [Setting Up Development Environment](#setting-up-development-environment)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Feature Development Process

We use a structured approach to feature development to ensure quality and maintainability:

1. **Feature Proposal**
   - Create a feature request using the feature tracker:
     ```bash
     velo-tracker feature add -n "Feature Name" -d "Detailed description" -p "priority"
     ```
   - For public contributions, create a GitHub issue describing the feature

2. **Feature Tracking**
   - Each feature is tracked with a unique ID
   - Use the feature tracker to monitor progress:
     ```bash
     velo-tracker feature list
     ```

3. **Progress Updates**
   - Regularly update progress as you work on a feature:
     ```bash
     velo-tracker feature progress -i <feature-id> -m "Progress update message" -p <percentage>
     ```
   - This helps maintain transparency and accountability

4. **GitHub Integration**
   - For maintainers, create GitHub issues directly from the feature tracker:
     ```bash
     velo-tracker feature add -n "Feature Name" -d "Description" --github --github-token <token>
     ```
   - Link pull requests to the corresponding feature ID in commit messages

5. **Feature Completion**
   - Mark features as complete when they're finished:
     ```bash
     velo-tracker feature update -i <feature-id> -s completed
     ```
   - Ensure all tests pass and documentation is updated

## Setting Up Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/velo-tracker.git
   cd velo-tracker
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Link the package for local development:
   ```bash
   npm link
   ```

## Pull Request Process

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following our coding standards

3. Add tests for your changes

4. Update documentation as needed

5. Commit your changes with a clear message that references the feature ID:
   ```bash
   git commit -m "Add amazing feature (Feature ID: abc12345)"
   ```

6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Create a pull request to the main repository

8. Wait for code review and address any feedback

## Coding Standards

- Follow the TypeScript style guide
- Use meaningful variable and function names
- Write comments for complex logic
- Keep functions small and focused
- Use async/await for asynchronous operations
- Handle errors appropriately

## Testing

- Write tests for all new features
- Ensure all existing tests pass
- Test on multiple platforms if possible (macOS, Linux, Windows)
- Test with different AWS profiles and configurations

## Documentation

- Update README.md with any new features or changes
- Document all public functions and interfaces
- Provide examples for new functionality
- Keep the documentation in sync with the code

## Release Process

The maintainers will handle the release process, which includes:

1. Updating the version in package.json
2. Creating a new GitHub release
3. Publishing to npm
4. Updating the Homebrew formula

## Questions?

If you have any questions about contributing, please open an issue or reach out to the maintainers.

Thank you for contributing to Velo Chat Logger!
