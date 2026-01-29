#!/bin/sh
# Clocker TUI Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/Fluf22/clocker/main/install.sh | sh

set -e

# Configuration
REPO="Fluf22/clocker"
INSTALL_DIR="$HOME/.clocker/bin"
BINARY_NAME="clocker"

# Colors (if terminal supports it)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() {
	printf "${BLUE}info${NC}  %s\n" "$1"
}

success() {
	printf "${GREEN}success${NC}  %s\n" "$1"
}

warn() {
	printf "${YELLOW}warn${NC}  %s\n" "$1"
}

error() {
	printf "${RED}error${NC}  %s\n" "$1"
	exit 1
}

# Detect platform
detect_platform() {
	OS=$(uname -s | tr '[:upper:]' '[:lower:]')
	ARCH=$(uname -m)

	case "$OS" in
	darwin)
		OS="darwin"
		;;
	linux)
		OS="linux"
		;;
	*)
		error "Unsupported operating system: $OS"
		;;
	esac

	case "$ARCH" in
	x86_64 | amd64)
		ARCH="x64"
		;;
	arm64 | aarch64)
		ARCH="arm64"
		;;
	*)
		error "Unsupported architecture: $ARCH"
		;;
	esac

	PLATFORM="${OS}-${ARCH}"
	info "Detected platform: $PLATFORM"
}

# Get latest release version
get_latest_version() {
	info "Fetching latest release..."
	VERSION=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

	if [ -z "$VERSION" ]; then
		error "Failed to fetch latest version. Check your internet connection or if the repository exists."
	fi

	info "Latest version: $VERSION"
}

# Download and install binary
install_binary() {
	DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/clocker-${PLATFORM}.gz"

	info "Downloading from: $DOWNLOAD_URL"

	mkdir -p "$INSTALL_DIR"

	if ! curl -fsSL "$DOWNLOAD_URL" -o "${INSTALL_DIR}/${BINARY_NAME}.gz"; then
		error "Failed to download binary. The release may not exist for your platform."
	fi

	info "Decompressing..."
	gunzip -f "${INSTALL_DIR}/${BINARY_NAME}.gz"

	chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

	success "Installed clocker to ${INSTALL_DIR}/${BINARY_NAME}"
}

# Check if install dir is in PATH
check_path() {
	case ":$PATH:" in
	*":$INSTALL_DIR:"*)
		success "clocker is ready to use!"
		;;
	*)
		warn "$INSTALL_DIR is not in your PATH"
		echo ""
		echo "Add it to your shell profile:"
		echo ""

		SHELL_NAME=$(basename "$SHELL")
		case "$SHELL_NAME" in
		zsh)
			echo "  echo 'export PATH=\"\$HOME/.clocker/bin:\$PATH\"' >> ~/.zshrc"
			echo "  source ~/.zshrc"
			;;
		bash)
			echo "  echo 'export PATH=\"\$HOME/.clocker/bin:\$PATH\"' >> ~/.bashrc"
			echo "  source ~/.bashrc"
			;;
		fish)
			echo "  fish_add_path ~/.clocker/bin"
			;;
		*)
			echo "  export PATH=\"\$HOME/.clocker/bin:\$PATH\""
			;;
		esac
		echo ""
		echo "Or run directly with: ${INSTALL_DIR}/${BINARY_NAME}"
		;;
	esac
}

# Main
main() {
	echo ""
	echo "  Clocker TUI Installer"
	echo "  ====================="
	echo ""

	detect_platform
	get_latest_version
	install_binary
	check_path

	echo ""
	success "Installation complete!"
	echo ""
}

main
