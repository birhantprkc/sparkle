# Disable Location Tracking

## Overview
- **ID/URL**: `disable-location-tracking`
- **Description**: Disables Windows location tracking.
- **Risk Level**: <span style="color:#4caf50">Safe</span>





## Details

- Disables telemetry, location access, diagnostic tracking, and automatic Windows updates by setting related registry values, reducing background data collection and improving system privacy and performance.



!!! tip "Recommended"
    This tweak is recommended.


## Apply

```powershell { .no-copy }  
  Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection" -Name "Allow" -Value "Deny" -Type String -Force
  Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location" -Name "SensorPermissionState" -Value 0 -Type DWord -Force
  Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Diagnostics\DiagTrack" -Name "Status" -Value 0 -Type DWord -Force
  Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update" -Name "AutoUpdateEnabled" -Value 0 -Type DWord -Force
```

## Unapply

```powershell
  Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection" -Name "Allow" -Value "Allow" -Type String -Force
  Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location" -Name "SensorPermissionState" -Value 1 -Type DWord -Force
  Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Diagnostics\DiagTrack" -Name "Status" -Value 1 -Type DWord -Force
  Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update" -Name "AutoUpdateEnabled" -Value 1 -Type DWord -Force
```
