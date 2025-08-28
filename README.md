# SwiftEX Server

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

## Description

SwiftEX Server is a NestJS-based backend service that provides APIs for cryptocurrency trading, wallet management, and market data services. Built with TypeScript and designed for scalability and performance.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with OTP verification
- 💰 **Wallet Management** - Stellar blockchain wallet operations
- 📊 **Market Data** - Real-time cryptocurrency market information
- 🔔 **Notifications** - Firebase push notifications
- 📧 **Email Services** - Gmail integration for notifications
- 📱 **Device Management** - FCM token management for mobile apps
- ⚡ **Alchemy Integration** - Blockchain transaction services
- 🌟 **Stellar Network** - Stellar blockchain operations

## Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, Passport
- **Email**: Gmail OAuth2, Handlebars templates
- **Notifications**: Firebase Admin SDK
- **Blockchain**: Stellar SDK, Alchemy API
- **Package Manager**: Yarn
- **Runtime**: Node.js 18 (LTS)

## Prerequisites

- Node.js 18+
- Yarn
- MongoDB
- Docker (optional)

## Project Setup

### Local Development

```bash
# Install dependencies
$ yarn install

# Set up environment variables
$ cp .env.example .env
# Edit .env with your configuration

# Start development server
$ yarn run start:dev
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
MONGODB_CONN_STRING=mongodb://localhost:27017
DB_NAME=swift-ex-server

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Gmail (for notifications)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
GMAIL_USER=your-email@gmail.com
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground

# External APIs
ALCHEMY_API_KEY=your-alchemy-api-key
STELLAR_NETWORK=testnet

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## Docker Setup

### Quick Start

```bash
# Build and run with Docker
$ ./build.sh

# Or manually
$ docker build -t swift-ex-server .
$ docker run -p 3000:3000 swift-ex-server
```

### Docker Compose (Optional)

```bash
# Start with MongoDB
$ docker-compose up --build
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/send-otp` - Send OTP
- `POST /api/v1/auth/verify-otp` - Verify OTP

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile

### Wallets
- `POST /api/v1/wallet` - Create wallet
- `GET /api/v1/wallet/address` - Get wallet address

### Market Data
- `GET /api/v1/market-data` - Get market data

## Development

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod

# build
$ yarn run build
```

## Testing

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

### Docker Deployment

```bash
# Build and push to ECR
$ ./build.sh

# The script will:
# 1. Build the Docker image
# 2. Tag it for ECR
# 3. Push to ECR
```

### Environment Setup

Ensure your production environment has all required environment variables configured, especially:
- MongoDB connection string
- JWT secret
- Gmail OAuth2 credentials
- API keys for external services

## Project Structure

```
src/
├── api/v1/           # API modules
│   ├── auth/         # Authentication
│   ├── users/        # User management
│   ├── wallet/       # Wallet operations
│   ├── alchemy/      # Blockchain services
│   ├── stellar/      # Stellar operations
│   ├── mail/         # Email services
│   └── notification/ # Push notifications
├── common/           # Shared utilities
└── main.ts          # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the NestJS documentation for framework-specific questions
