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
RUN printf '#!/bin/sh\nset -e\n\n# Default values\nENVIRONMENT_NAME="${ENVIRONMENT_NAME:-dev}"\nCOMPONENT_NAME="${COMPONENT_NAME:-swiftx}"\nPART_NAME="${PART_NAME:-engines}"\nAWS_REGION="${AWS_REGION:-ap-south-1}"\n\n# Base path for parameters\nPARAM_BASE_PATH="/${ENVIRONMENT_NAME}/${COMPONENT_NAME}/${PART_NAME}"\n\necho "Fetching environment variables from Parameter Store at runtime..."\necho "Base path: ${PARAM_BASE_PATH}"\n\n# Create .env file dynamically from all parameters\necho "# Environment Configuration" > /app/.env\necho "AWS_REGION=${AWS_REGION}" >> /app/.env\n\n# Get all parameters and create .env file\n# TEMP: Add profile for local testing (comment out for production)\nAWS_PROFILE_OPT=""\nif [[ -n "${AWS_PROFILE:-}" ]]; then\n    AWS_PROFILE_OPT="--profile ${AWS_PROFILE}"\nfi\n\naws ssm describe-parameters \\\n    --parameter-filters "Key=Name,Option=BeginsWith,Values=${PARAM_BASE_PATH}/" \\\n    --region "${AWS_REGION}" \\\n    ${AWS_PROFILE_OPT} \\\n    --query "Parameters[].Name" \\\n    --output text | tr "\\t" "\\n" | while read param_name; do\n        param_key=$(basename "$param_name")\n        # Convert parameter name to uppercase for environment variable\n        env_var_name=$(echo "$param_key" | tr "[:lower:]" "[:upper:]")\n        param_value=$(aws ssm get-parameter \\\n            --name "$param_name" \\\n            --with-decryption \\\n            --region "${AWS_REGION}" \\\n            ${AWS_PROFILE_OPT} \\\n            --query "Parameter.Value" \\\n            --output text 2>/dev/null || echo "")\n        if [[ -n "$param_value" ]]; then\n            echo "${env_var_name}=${param_value}" >> /app/.env\n        fi\n    done\n\necho "Environment variables fetched and .env file created successfully!"\necho "Total variables: $(wc -l < /app/.env)"\necho "Starting application..."\n\n# Execute the command passed to the container\nexec "$@"\n' > /app/start.sh

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