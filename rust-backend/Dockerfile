# Multi-stage build for optimized production image
FROM rust:1.70 as builder

# Set working directory
WORKDIR /app

# Copy manifest files
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (this layer will be cached)
RUN cargo build --release

# Remove dummy main.rs and copy actual source code
RUN rm src/main.rs
COPY src/ ./src/

# Build the application
RUN cargo build --release

# Production stage
FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -r -s /bin/false aims

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/target/release/aims-backend /usr/local/bin/

# Create necessary directories
RUN mkdir -p /app/logs && chown -R aims:aims /app

# Switch to non-root user
USER aims

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Run the application
CMD ["aims-backend"]
