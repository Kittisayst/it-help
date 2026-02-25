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

[Dirs]
Name: "{userappdata}\ITMonitorAgent\logs"; Flags: uninsneveruninstall
OutputDir=installer_output
OutputBaseFilename=ITMonitorAgent-Setup-v{#MyAppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64
UninstallDisplayIcon={app}\{#MyAppExeName}
SetupIconFile=Icon_Logo.ico
CloseApplications=yes
CloseApplicationsFilter=agent.exe
RestartApplications=no

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
Name: "{group}\Configure Agent"; Filename: "notepad.exe"; Parameters: """{userappdata}\ITMonitorAgent\config.json"""
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
Filename: "notepad.exe"; Parameters: """{userappdata}\ITMonitorAgent\config.json"""; Description: "Configure agent settings (API key, server URL)"; Flags: postinstall shellexec skipifsilent nowait

[UninstallRun]
Filename: "cmd.exe"; Parameters: "/c schtasks /delete /tn ""ITMonitorAgent"" /f"; Flags: runhidden waituntilterminated
Filename: "cmd.exe"; Parameters: "/c taskkill /f /im agent.exe"; Flags: runhidden waituntilterminated skipifdoesntexist

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
  ExecOk: Boolean;
begin
  Result := '';
  // Stop running agent process and remove old scheduled task before overwrite.
  ExecOk := Exec('cmd.exe', '/c taskkill /f /im agent.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  if ExecOk and (ResultCode <> 0) and (ResultCode <> 128) then
    Log(Format('taskkill returned code %d', [ResultCode]));

  ExecOk := Exec('cmd.exe', '/c schtasks /delete /tn "ITMonitorAgent" /f', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  if ExecOk and (ResultCode <> 0) then
    Log(Format('schtasks delete returned code %d', [ResultCode]));

  Sleep(1000);
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    Exec('cmd.exe', '/c taskkill /f /im agent.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('cmd.exe', '/c schtasks /delete /tn "ITMonitorAgent" /f', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ConfigDir: String;
  ConfigFile: String;
  ConfigContent: String;
  ResultCode: Integer;
  ExecOk: Boolean;
begin
  if CurStep = ssPostInstall then
  begin
    ConfigDir := ExpandConstant('{userappdata}\ITMonitorAgent');
    ConfigFile := ConfigDir + '\config.json';
    
    // Create default config if doesn't exist
    if not FileExists(ConfigFile) then
    begin
      ForceDirectories(ConfigDir);
      ConfigContent := '{' + #13#10 +
        '  "server_url": "http://localhost:3000",' + #13#10 +
        '  "api_key": "your-api-key-here",' + #13#10 +
        '  "department": "General",' + #13#10 +
        '  "update_check_interval": 3600' + #13#10 +
        '}';
      SaveStringToFile(ConfigFile, ConfigContent, False);
    end;

    // Install/start startup task. Must be non-interactive to avoid setup hang.
    if WizardIsTaskSelected('autostart') then
    begin
      ExecOk := Exec(ExpandConstant('{app}\install_service.bat'), '/silent', ExpandConstant('{app}'), SW_HIDE, ewWaitUntilTerminated, ResultCode);
      if (not ExecOk) or (ResultCode <> 0) then
      begin
        MsgBox(
          'Failed to install/start the ITMonitorAgent startup task.' + #13#10 +
          'Exit code: ' + IntToStr(ResultCode) + #13#10 +
          'Please run as Administrator and try again.' + #13#10 +
          'You can also run install_service.bat manually from the install folder.',
          mbError,
          MB_OK
        );
      end;
    end;
  end;
end;
