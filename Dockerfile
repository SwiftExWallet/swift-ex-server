# Multi-stage Dockerfile for SwiftEX NestJS application
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build argument for .env file
ARG ENV_FILE
COPY ${ENV_FILE:-.env} .env

RUN yarn run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat aws-cli jq
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built application and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/templates ./templates

# Create startup script that fetches env vars from Parameter Store at RUNTIME
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
set -e

# Default values
ENVIRONMENT_NAME="${ENVIRONMENT_NAME:-dev}"
COMPONENT_NAME="${COMPONENT_NAME:-swiftx}"
PART_NAME="${PART_NAME:-engines}"
AWS_REGION="${AWS_REGION:-ap-south-1}"

# Base path for parameters
PARAM_BASE_PATH="/${ENVIRONMENT_NAME}/${COMPONENT_NAME}/${PART_NAME}"

echo "Fetching environment variables from Parameter Store at runtime..."
echo "Base path: ${PARAM_BASE_PATH}"

# Create .env file dynamically from all parameters
echo "# Environment Configuration" > /app/.env
echo "AWS_REGION=${AWS_REGION}" >> /app/.env

# Get all parameters and create .env file
# TEMP: Add profile for local testing (comment out for production)
AWS_PROFILE_OPT=""
if [[ -n "${AWS_PROFILE:-}" ]]; then
    AWS_PROFILE_OPT="--profile ${AWS_PROFILE}"
fi

aws ssm describe-parameters \
    --parameter-filters "Key=Name,Option=BeginsWith,Values=${PARAM_BASE_PATH}/" \
    --region "${AWS_REGION}" \
    ${AWS_PROFILE_OPT} \
    --query 'Parameters[].Name' \
    --output text | tr '\t' '\n' | while read param_name; do
        param_key=$(basename "$param_name")
        param_value=$(aws ssm get-parameter \
            --name "$param_name" \
            --with-decryption \
            --region "${AWS_REGION}" \
            ${AWS_PROFILE_OPT} \
            --query 'Parameter.Value' \
            --output text 2>/dev/null || echo "")
        if [[ -n "$param_value" ]]; then
            echo "${param_key}=${param_value}" >> /app/.env
        fi
    done

echo "Environment variables fetched and .env file created successfully!"
echo "Total variables: $(wc -l < /app/.env)"
echo "Starting application..."

# Execute the command passed to the container
exec "$@"
EOF

# Make startup script executable
RUN chmod +x /app/start.sh

# Change ownership
RUN chown -R nestjs:nodejs /app

# TEMP: For local testing, copy AWS credentials (comment out for production)
# RUN mkdir -p /home/nestjs/.aws && chown -R nestjs:nodejs /home/nestjs/.aws

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Set entrypoint to fetch env vars and then run the app
ENTRYPOINT ["/app/start.sh"]
CMD ["node", "dist/main.js"]