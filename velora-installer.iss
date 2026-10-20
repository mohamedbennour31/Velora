#define MyAppName "Velora"
#define MyAppVersion "0.1.0"
#define MyAppExeName "velora.exe"

[Setup]
AppId={{B38A35B7-5B3D-4C96-A1E2-8D7C51F04A61}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={autopf}\Velora
DefaultGroupName=Velora
UninstallDisplayIcon={app}\velora.exe
SetupIconFile=src-tauri\icons\icon.ico
OutputDir=installer-output
OutputBaseFilename=Velora-Setup
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64
WizardStyle=modern

[Files]
Source: "src-tauri\target\release\velora.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "src-tauri\icons\icon.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\Velora"; Filename: "{app}\velora.exe"; IconFilename: "{app}\icon.ico"
Name: "{autodesktop}\Velora"; Filename: "{app}\velora.exe"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: checkedonce

[Run]
Filename: "{app}\velora.exe"; Description: "Launch Velora"; Flags: postinstall nowait skipifsilent