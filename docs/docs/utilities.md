---
title: "Utilities"
hide:
  - navigation
---

# Utilities Page

!!! note "New and Updated Utilities Page"

    The Utilities page has been completely redesigned and updated with new features and controls for better usability and functionality.

## Overview

The new Utilities page provides direct access to system maintenance tools and settings management with intuitive controls like toggles, buttons, and dropdowns. All utilities run PowerShell scripts behind the scenes and sync with your Windows configuration.

## Available Utilities

### Disk Management

| Utility | Description | Control Type |
|---------|-------------|--------------|
| **Disk Cleaner** | Free up space by removing unnecessary files. | Button - "Clean Now" |
| **Storage Sense** | Automatically free up space by getting rid of files you don't need. | Toggle |

### System Information & Diagnostics

| Utility | Description | Control Type |
|---------|-------------|--------------|
| **System Information** | View detailed information about your system. | Button - "View Info" |
| **Graphics Driver** | Restart your graphics driver to fix display issues. | Button - "Restart" |

### Performance & Power

| Utility | Description | Control Type |
|---------|-------------|--------------|
| **Fast Startup** | Improve boot times by optimizing startup settings. | Toggle |
| **Power Plan** | Choose how your computer manages power and performance. | Dropdown - [Balanced, High Performance, Power Saver, Ultimate Performance] |

### Network & Connectivity

| Utility | Description | Control Type |
|---------|-------------|--------------|
| **Flush DNS Cache** | Fix connection issues by clearing DNS resolver cache. | Button - "Flush" |
| **Network Reset** | Reset your network stack to fix connectivity problems. | Button - "Reset" |

### Audio & Updates

| Utility | Description | Control Type |
|---------|-------------|--------------|
| **Restart Audio Service** | Fix sound issues by restarting Windows Audio. | Button - "Restart" |
| **Windows Updates** | Control how Windows handles automatic updates. | Dropdown - [Default, Manual, Disabled] |

!!! info

    All utilities automatically detect and display your current system settings. Changes are applied instantly using PowerShell scripts, and you'll see toast notifications for success or failure.
