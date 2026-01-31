{
  description = "StockForumX Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_20
            go_1_22
            docker-compose
            mongodb-6_0
          ];

          shellHook = ''
            echo "StockForumX Nix Environment Loaded"
            node --version
            go version
          '';
        };
      }
    );
}
