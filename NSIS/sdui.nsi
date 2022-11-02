; Script generated by the HM NIS Edit Script Wizard.

; HM NIS Edit Wizard helper defines
!define PRODUCT_NAME "Stable Diffusion UI"
!define PRODUCT_VERSION "Installer 2.35"
!define PRODUCT_PUBLISHER "cmdr2 and contributors"
!define PRODUCT_WEB_SITE "https://stable-diffusion-ui.github.io"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Cmdr2\App Paths\installer.exe"

; MUI 1.67 compatible ------
!include "MUI.nsh"
!include "LogicLib.nsh"
!include "nsDialogs.nsh"

Var Dialog
Var Label
Var Text
Var V14
Var V15

; This function returns the number of spaces in a string.
; The string is passed on the stack (using Push $STRING)
; The result is also returned on the stack and can be consumed with Pop $var
; https://nsis.sourceforge.io/Check_for_spaces_in_a_directory_path
Function CheckForSpaces
  Exch $R0
  Push $R1
  Push $R2
  Push $R3
  StrCpy $R1 -1
  StrCpy $R3 $R0
  StrCpy $R0 0
  loop:
    StrCpy $R2 $R3 1 $R1
    IntOp $R1 $R1 - 1
    StrCmp $R2 "" done
    StrCmp $R2 " " 0 loop
    IntOp $R0 $R0 + 1
  Goto loop
  done:
  Pop $R3
  Pop $R2
  Pop $R1
  Exch $R0
FunctionEnd

Function DirectoryLeave
   ; check whether the installation directory path is longer than 40 characters.
   ;----------------------------------------------------------------------------
   StrLen $0 "$INSTDIR"
   ${If} $0 > 40
      MessageBox MB_OK|MB_ICONEXCLAMATION "Installation path name too long. The installation path must not have more than 40 characters."
      abort
   ${EndIf}
   
   ; Check for spaces in the installation directory path.
   ; ----------------------------------------------------

   ; $R0 = CheckForSpaces( $INSTDIR )
   Push $INSTDIR # Input string (install path).
     Call CheckForSpaces
   Pop $R0 # The function returns the number of spaces found in the input string.

   ; Check if any spaces exist in $INSTDIR.
   ${If} $R0 != 0
     ; Plural if more than 1 space in $INSTDIR.
     ; If $R0 == 1: $R1 = ""; else: $R1 = "s"
     StrCmp $R0 1 0 +3
       StrCpy $R1 ""
     Goto +2
       StrCpy $R1 "s"

     ; Show message box then take the user back to the Directory page.
     MessageBox MB_OK|MB_ICONEXCLAMATION "Error: The Installaton directory \
     has $R0 space character$R1.$\nPlease choose an installation directory without space characters."
     Abort
   ${EndIf}

FunctionEnd

Function nsDialogsPage
    !insertmacro MUI_HEADER_TEXT "Default Stable diffusion model" "Select the default model to be installed"
    nsDialogs::Create 1018
    Pop $Dialog

    ${If} $Dialog == error
	Abort
    ${EndIf}
	
    ${NSD_CreateLabel} 0 0 100% 48u "Which Stable Diffusion Modell do you want to use?$\r$\n$\r$\nThere are two models of Stable Diffusion.$\r$\n- Version 1.4 is using less memory.$\r$\n- Version 1.5 is bigger, but has slightly better results."
    Pop $Label
 	
    ${NSD_CreateFirstRadioButton} 0 49u 100% 12u "Use SD v1.4 as default"
    Pop $V14

    ${NSD_CreateAdditionalRadioButton} 0 62u 100% 12u "Use SD v1.5 as default"
    Pop $V15

    nsDialogs::Show
FunctionEnd


; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "sd.ico"

!define MUI_WELCOMEFINISHPAGE_BITMAP "astro.bmp"

; Welcome page
!insertmacro MUI_PAGE_WELCOME
; License page
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_LICENSE "..\CreativeML Open RAIL-M License"
; Directory page
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE "DirectoryLeave"
!insertmacro MUI_PAGE_DIRECTORY

;; TODO: Requires support from "Start Stable Diffusion UI.cmd" and "server.py"
;; which needs to be developed first
; --------
; Page custom nsDialogsPage
; --------

; Instfiles page
!insertmacro MUI_PAGE_INSTFILES
; Finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\Start Stable Diffusion UI.cmd"
!insertmacro MUI_PAGE_FINISH

; Language files
!insertmacro MUI_LANGUAGE "English"

; MUI end ------

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "Install Stable Diffusion UI.exe"
InstallDir "C:\Stable-Diffusion-UI\"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  File "..\CreativeML Open RAIL-M License"
  File "..\How to install and run.txt"
  File "..\LICENSE"
  File "..\Start Stable Diffusion UI.cmd"
  SetOutPath "$INSTDIR\scripts"
  File "..\scripts\bootstrap.bat"
  File "..\scripts\install_status.txt"
  File "..\scripts\on_env_start.bat"
  CreateDirectory "$INSTDIR\profile"
  CreateDirectory "$SMPROGRAMS\Stable Diffusion UI"
  CreateShortCut "$SMPROGRAMS\Stable Diffusion UI\Start Stable Diffusion UI.lnk" "$INSTDIR\Start Stable Diffusion UI.cmd"
SectionEnd

; Our installer only needs 25 KB, but once it has run, we need 25 GB
; So we need to overwrite the automatically detected space requirements.
; https://nsis.sourceforge.io/Docs/Chapter4.html#4.9.13.7
; The example in section 4.9.13.7 seems to be wrong: the number
; needs to be provided in Kilobytes.
Function .onInit
  # Set required size of section 'SEC01' to 25 Gigabytes
  SectionSetSize ${SEC01} 26214400
FunctionEnd


Section -Post
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\installer.exe"
SectionEnd