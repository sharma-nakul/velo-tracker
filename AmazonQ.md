# Using Velo Chat Logger with Amazon Q

Velo Chat Logger is designed to track and log your Amazon Q Dev CLI sessions, providing insights into your usage patterns and helping you manage your interactions with Amazon Q.

## How It Works

When integrated with your shell, Velo Chat Logger automatically:

1. Detects when you start an Amazon Q session with `q chat`
2. Records the start time and AWS profile being used
3. Tracks the session duration
4. Logs when the session ends

## Benefits

- **Usage Tracking**: See how much time you spend using Amazon Q
- **Profile Management**: Track usage across different AWS profiles
- **Session History**: Review past sessions and their durations
- **Automatic Cleanup**: Maintain a clean log history with automatic cleanup of old logs

## Shell Integration

The shell integration works by creating a wrapper function for the `q` command that intercepts calls to `q chat` and automatically logs the session start and end times.

### How the Integration Works

When you run `q chat`, the shell hook:

1. Detects the AWS profile being used (from command line arguments or environment variables)
2. Starts a logging session with `velo-tracker start`
3. Runs the original `q chat` command
4. Ends the logging session with `velo-tracker end` when you exit Amazon Q

## Viewing Your Amazon Q Usage

To view your Amazon Q usage statistics:

```bash
# List recent sessions
velo-tracker list

# Get a summary of usage by profile
velo-tracker summary

# View sessions for a specific profile
velo-tracker list --profile my-profile
```

## Tips for Amazon Q Users

- Use different AWS profiles for different projects to better track your usage patterns
- Regularly check your session history to understand your Amazon Q usage patterns
- Clean up old logs periodically with `velo-tracker cleanup`
