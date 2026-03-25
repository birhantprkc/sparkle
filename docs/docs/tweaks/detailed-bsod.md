# Detailed BSOD

## Overview
- **ID/URL**: `detailed-bsod`
- **Description**: Adds detailed information to the Blue Screen of Death (BSOD) screen
- **Risk Level**: <span style="color:#4caf50">Safe</span>





## Details

- Enables detailed technical information on the Blue Screen of Death by setting DisplayParameters to 1 in the CrashControl registry.





## Apply

```powershell { .no-copy }  
Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\CrashControl" -Name "Value" -Type DWord -Value 1

```

## Unapply

```powershell
Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\CrashControl" -Name "Value" -Type DWord -Value 0

```
