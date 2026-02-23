; IT Monitor Agent Installer Script
; Inno Setup 6.x

#define MyAppName "IT Monitor Agent"
#define MyAppVersion "1.0"
#define MyAppPublisher "IT Department"
#define MyAppURL "https://github.com/Kittisayst/it-help"
#define MyAppExeName "agent.exe"
#define MyAppServiceName "ITMonitorAgent"

[Setup]
AppId={{8F9A7B2C-3D4E-5F6A-7B8C-9D0E1F2A3B4C}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\ITMonitorAgent
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=LICENSE.txt
OutputDir=installer_output
OutputBaseFilename=ITMonitorAgent-Setup-v{#MyAppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64
UninstallDisplayIcon={app}\{#MyAppExeName}
SetupIconFile=Icon_Logo.ico

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "autostart"; Description: "Install and start Windows Service automatically"; GroupDescription: "Service Options:"; Flags: checkedonce

[Files]
Source: "dist\agent.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "config.json"; DestDir: "{app}"; Flags: ignoreversion onlyifdoesntexist
Source: "version.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "icon_green.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "icon_yellow.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "icon_red.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "icon_gray.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "install_service.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "uninstall_service.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Configure Agent"; Filename: "notepad.exe"; Parameters: """{app}\config.json"""
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\install_service.bat"; Description: "Install and start Windows Service"; Flags: runhidden waituntilterminated; Tasks: autostart
Filename: "notepad.exe"; Parameters: """{app}\config.json"""; Description: "Configure agent settings (API key, server URL)"; Flags: postinstall shellexec skipifsilent nowait

[UninstallRun]
Filename: "{app}\uninstall_service.bat"; Flags: runhidden waituntilterminated

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
  ServicePath: String;
begin
  Result := '';
  // Stop service before upgrade if it exists
  ServicePath := ExpandConstant('{autopf}\ITMonitorAgent\uninstall_service.bat');
  if FileExists(ServicePath) then
  begin
    Exec('cmd.exe', '/c "' + ServicePath + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Sleep(2000); // Wait for service to stop
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  // Stop service before uninstall
  if CurUninstallStep = usUninstall then
  begin
    if FileExists(ExpandConstant('{app}\uninstall_service.bat')) then
    begin
      Exec('cmd.exe', '/c "' + ExpandConstant('{app}\uninstall_service.bat') + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ConfigFile: String;
  ConfigContent: String;
begin
  if CurStep = ssPostInstall then
  begin
    ConfigFile := ExpandConstant('{app}\config.json');
    
    // Create default config if doesn't exist
    if not FileExists(ConfigFile) then
    begin
      ConfigContent := '{' + #13#10 +
        '  "server_url": "http://localhost:3000",' + #13#10 +
        '  "api_key": "your-api-key-here",' + #13#10 +
        '  "department": "General",' + #13#10 +
        '  "update_check_interval": 3600' + #13#10 +
        '}';
      SaveStringToFile(ConfigFile, ConfigContent, False);
    end;
  end;
end;
