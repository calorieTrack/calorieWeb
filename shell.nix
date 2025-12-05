{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = with pkgs; [
    nodejs
    chromium
  ];

  shellHook = ''
    export PUPPETEER_SKIP_DOWNLOAD=true
    
    export PUPPETEER_EXECUTABLE_PATH="${pkgs.chromium}/bin/chromium"
    
   # export CI=true 
  '';
}