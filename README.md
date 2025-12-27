# Browser Tab Sync

A Raycast extension that synchronizes browser tabs across different browsers and devices using PostgreSQL as the backend storage.

## Features

- 🔄 **Automatic Sync**: Syncs your browser tabs every minute in the background
- 📱 **Multi-Device Support**: Sync tabs across multiple devices with device-specific identification
- 🌐 **Cross-Browser**: Works with any browser that supports the Raycast Browser Extension API
- 📊 **Menu Bar Access**: Quick access to all synced tabs from the menu bar, organized by device
- 🎯 **URL Filtering**: Ignore specific URLs or domains from being synced
- 🔒 **PostgreSQL Backend**: Secure and reliable storage using PostgreSQL database

## Prerequisites

- [Raycast](https://www.raycast.com/) installed on your device
- PostgreSQL database (local or remote)
- Browser Extension support enabled in Raycast

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start development mode

## Setup

### 1. Configure PostgreSQL Connection

1. Open Raycast preferences for Browser Tab Sync
2. Enter your PostgreSQL connection string in the format:

   ```text
   postgres://username:password@host:port/database
   ```

**💡 Tip**: You can quickly deploy a PostgreSQL database using Zeabur PostgreSQL Template

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/B20CX0)

### 2. Set Device Name

1. Open Raycast and search for "Browser Tab Sync Settings"
2. Enter a unique name for this device (e.g., "MacBook Pro", "Work PC")
3. Save the settings

> **Note**: The device name is stored locally and will not sync across devices. Each device needs its own unique name.

### 3. (Optional) Configure Ignored URLs

1. Open Raycast preferences for Browser Tab Sync
2. Add comma-separated URLs or keywords to ignore
3. Example: `localhost, 127.0.0.1, example.com`

## Usage

### Automatic Sync

The extension automatically syncs your browser tabs every minute. You can also manually trigger a sync by running the "Browser Tab Sync" command in Raycast.

### View Synced Tabs

1. Click the Browser Tab Sync icon in your menu bar
2. Tabs are organized by device name
3. Click any tab to open it in your default browser
4. Use `Cmd + R` or `Ctrl + R` to refresh the tab list

## Development

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Fix linting issues
npm run fix-lint
```
