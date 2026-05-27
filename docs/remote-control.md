# Continue local sessions from any device with Remote Control

> Continue a local Claude Code session from your phone, tablet, or any browser using Remote Control. Works with claude.ai/code and the Claude mobile app.

> **Note:** Remote Control is in research preview and available on all plans. On Team and Enterprise, it is off by default until an admin enables the Remote Control toggle in [Claude Code admin settings](https://claude.ai/admin-settings/claude-code).

Remote Control connects [claude.ai/code](https://claude.ai/code) or the Claude app for [iOS](https://apps.apple.com/us/app/claude-by-anthropic/id6473753684) and [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude) to a Claude Code session running on your machine. Start a task at your desk, then pick it up from your phone on the couch or a browser on another computer.

When you start a Remote Control session on your machine, Claude keeps running locally the entire time, so nothing moves to the cloud. With Remote Control you can:

- **Use your full local environment remotely**: your filesystem, MCP servers, tools, and project configuration all stay available, and typing `@` autocompletes file paths from your local project
- **Work from both surfaces at once**: the conversation stays in sync across all connected devices, so you can send messages from your terminal, browser, and phone interchangeably
- **Survive interruptions**: if your laptop sleeps or your network drops, the session reconnects automatically when your machine comes back online

> **Note:** Remote Control requires Claude Code v2.1.51 or later. Check your version with `claude --version`.

---

## Requirements

Before using Remote Control, confirm that your environment meets these conditions:

- **Subscription**: available on Pro, Max, Team, and Enterprise plans. API keys are not supported. On Team and Enterprise, an admin must first enable the Remote Control toggle in [Claude Code admin settings](https://claude.ai/admin-settings/claude-code).
- **Authentication**: run `claude` and use `/login` to sign in through claude.ai if you haven't already.
- **Workspace trust**: run `claude` in your project directory at least once to accept the workspace trust dialog.

---

## Start a Remote Control session

### Server mode

Navigate to your project directory and run:

```bash
claude remote-control
```

The process stays running in your terminal in server mode, waiting for remote connections. It displays a session URL you can use to connect from another device, and you can press spacebar to show a QR code for quick access from your phone.

**Available flags:**

| Flag | Description |
|---|---|
| `--name "My Project"` | Set a custom session title visible in the session list at claude.ai/code. |
| `--remote-control-session-name-prefix <prefix>` | Prefix for auto-generated session names. Defaults to your machine's hostname. Set `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX` for the same effect. |
| `--spawn <mode>` | How the server creates sessions: `same-dir` (default), `worktree` (each session gets its own git worktree), or `session` (single-session mode). Press `w` at runtime to toggle between `same-dir` and `worktree`. |
| `--capacity <N>` | Maximum number of concurrent sessions. Default is 32. Cannot be used with `--spawn=session`. |
| `--verbose` | Show detailed connection and session logs. |
| `--sandbox` / `--no-sandbox` | Enable or disable sandboxing for filesystem and network isolation. Off by default. |

### Interactive session

To start a normal interactive Claude Code session with Remote Control enabled, use the `--remote-control` flag (or `--rc`):

```bash
claude --remote-control
# or with a session name:
claude --remote-control "My Project"
```

This gives you a full interactive session in your terminal that you can also control from claude.ai or the Claude app.

### From an existing session

If you're already in a Claude Code session, use the `/remote-control` (or `/rc`) command:

```
/remote-control
# or with a name:
/remote-control My Project
```

This starts a Remote Control session carrying over your current conversation history.

### VS Code

In the Claude Code VS Code extension, type `/remote-control` or `/rc` in the prompt box. Requires Claude Code v2.1.79 or later.

A banner appears above the prompt box showing connection status. Click **Open in browser** in the banner to go directly to the session.

---

## Connect from another device

Once a Remote Control session is active:

- **Open the session URL** in any browser to go directly to the session on [claude.ai/code](https://claude.ai/code).
- **Scan the QR code** shown alongside the session URL to open it directly in the Claude app. With `claude remote-control`, press spacebar to toggle the QR code display.
- **Open [claude.ai/code](https://claude.ai/code) or the Claude app** and find the session by name in the session list.

The remote session title is chosen in this order:
1. The name you passed to `--name`, `--remote-control`, or `/remote-control`
2. The title you set with `/rename`
3. The last meaningful message in existing conversation history
4. An auto-generated name like `myhost-graceful-unicorn`

### Enable Remote Control for all sessions

To enable it automatically for every interactive session, run `/config` inside Claude Code and set **Enable Remote Control for all sessions** to `true`.

---

## Connection and security

Your local Claude Code session makes outbound HTTPS requests only and never opens inbound ports on your machine. When you start Remote Control, it registers with the Anthropic API and polls for work.

All traffic travels through the Anthropic API over TLS. The connection uses multiple short-lived credentials, each scoped to a single purpose and expiring independently.

---

## Remote Control vs Claude Code on the web

| | Remote Control | Claude Code on the web |
|---|---|---|
| Runs on | Your machine | Anthropic cloud |
| Local MCP servers | Available | Not available |
| Local filesystem | Full access | Cloned repo only |
| Best for | Continuing in-progress local work from another device | Starting fresh tasks without local setup |

---

## Mobile push notifications

When Remote Control is active, Claude can send push notifications to your phone when a long-running task finishes or when it needs a decision.

> **Note:** Mobile push notifications require Claude Code v2.1.110 or later.

**Setup:**
1. Install the Claude mobile app for [iOS](https://apps.apple.com/us/app/claude-by-anthropic/id6473753684) or [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude).
2. Sign in with the same account and organization you use for Claude Code.
3. Allow notifications when prompted by your operating system.
4. In your terminal, run `/config` and enable **Push when Claude decides**.

**If notifications don't arrive:**
- If `/config` shows **No mobile registered**, open the Claude app on your phone to refresh its push token.
- On iOS, check Settings → Notifications → Claude for Focus mode or notification summary interference.
- On Android, exempt the Claude app from battery optimization in system settings.

---

## Limitations

- **One remote session per interactive process**: outside of server mode, each Claude Code instance supports one remote session at a time. Use server mode for multiple concurrent sessions.
- **Local process must keep running**: if you close the terminal, quit VS Code, or otherwise stop the `claude` process, the session ends.
- **Extended network outage**: if your machine is awake but unable to reach the network for more than roughly 10 minutes, the session times out and the process exits.
- **Ultraplan disconnects Remote Control**: starting an ultraplan session disconnects any active Remote Control session.
- **Some commands are local-only**: `/mcp`, `/plugin`, `/resume` work only from the local CLI. Commands like `/compact`, `/clear`, `/context`, `/usage`, `/exit` work from mobile and web.

---

## Troubleshooting

### "Remote Control requires a claude.ai subscription"
You're not authenticated with a claude.ai account. Run `claude auth login` and choose the claude.ai option. If `ANTHROPIC_API_KEY` is set, unset it first.

### "Remote Control requires a full-scope login token"
You're using a long-lived token from `claude setup-token` or `CLAUDE_CODE_OAUTH_TOKEN`. Run `claude auth login` to authenticate with a full-scope session token instead.

### "Unable to determine your organization for Remote Control eligibility"
Your cached account information is stale. Run `claude auth login` to refresh it.

### "Remote Control is not yet enabled for your account"
Check for these environment variables and unset them if present:
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` or `DISABLE_TELEMETRY`
- `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, or `CLAUDE_CODE_USE_FOUNDRY`

If none are set, run `/logout` then `/login` to refresh.

### "Remote Control is disabled by your organization's policy"
Run `/status` to check your login method and subscription. Possible causes:
- You're authenticated with an API key — run `/login` and choose the claude.ai option
- Your Team/Enterprise admin hasn't enabled it — they can do so at [claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code)
- Your organization has a data retention configuration incompatible with Remote Control — contact Anthropic support
- Your IT admin has disabled Remote Control on this device through managed settings

### "Remote credentials fetch failed"
Re-run with `--verbose` to see the full error:

```bash
claude remote-control --verbose
```

Common causes: not signed in, network/proxy blocking outbound HTTPS on port 443, or an inactive subscription.

---

## Choose the right approach

| | Trigger | Claude runs on | Best for |
|---|---|---|---|
| Dispatch | Message a task from the Claude mobile app | Your machine (Desktop) | Delegating work while you're away |
| **Remote Control** | Drive a running session from claude.ai/code or the Claude app | Your machine (CLI or VS Code) | Steering in-progress work from another device |
| Channels | Push events from Telegram, Discord, or your own server | Your machine (CLI) | Reacting to external events |
| Slack | Mention `@Claude` in a team channel | Anthropic cloud | PRs and reviews from team chat |
| Scheduled tasks | Set a schedule | CLI, Desktop, or cloud | Recurring automation |

---

## Related resources

- [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web): run sessions in Anthropic-managed cloud environments
- [Authentication](https://code.claude.com/docs/en/authentication): set up `/login` and manage credentials
- [CLI reference](https://code.claude.com/docs/en/cli-reference): full list of flags and commands including `claude remote-control`
- [Security](https://code.claude.com/docs/en/security): how Remote Control sessions fit into the Claude Code security model
- [Data usage](https://code.claude.com/docs/en/data-usage): what data flows through the Anthropic API during local and remote sessions
