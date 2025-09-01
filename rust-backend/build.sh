#!/bin/bash

# Build script for AIMS Rust Backend
# This script helps bypass proxy issues and build the project

echo "Building AIMS Rust Backend..."

# Check if we can access rustc directly
if command -v ~/.cargo/bin/rustc &> /dev/null; then
    echo "Using local rustc installation"
    export PATH="$HOME/.cargo/bin:$PATH"
else
    echo "Rust not found in ~/.cargo/bin"
    echo "Please install Rust: https://rustup.rs/"
    exit 1
fi

# Try to build with explicit rustc path
echo "Attempting to build..."
~/.cargo/bin/cargo build --release

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo "You can now run the server with:"
    echo "cargo run --release"
else
    echo "Build failed. Please check the error messages above."
    echo "Common solutions:"
    echo "1. Update Rust: rustup update"
    echo "2. Clear cargo cache: cargo clean"
    echo "3. Check proxy settings in ~/.cargo/config.toml"
fi


