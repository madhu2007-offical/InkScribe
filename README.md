# InkScribe – Real-Time Collaborative Writing Engine 

Real-time collaborative writing engine built for the CUSoC (Chandigarh University Season of Code) program. InkScribe lets multiple users edit the same document simultaneously, similar to Google Docs, with live cursors and instant sync.

## Project Description

**Abstract**: InkScribe is an advanced InnovateInk infrastructure initiative focused on building a real-time collaborative writing engine. The project aims to create scalable systems supporting concurrent multi-user editing while advancing publishing, intelligence, and knowledge infrastructure.

**Problem Statement**: Design and implement a real-time collaborative writing engine with scalability, resilience, security, and AI-native capabilities.

**Proposed Solution**: A modular architecture using distributed services (client, sync server, API server), REST APIs, WebSocket-based real-time sync, and CRDT-based conflict resolution.

## Tech Stack

- **Frontend**: React + TipTap (rich text editor)
- **Real-time Sync**: Yjs (CRDT) + y-websocket
- **Backend API**: Node.js + Express
- **Database**: PostgreSQL
- **Cache/Pub-Sub**: Redis
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

## Project Status

🚧 **In active development** — currently in Sprint 1 (basic editor setup)

## Repository Structure

```
InkScribe/
├── README.md
├── LICENSE
├── docker-compose.yml
├── .env.example
├── .github/
│   └── workflows/          # CI/CD pipelines
├── docs/
│   ├── architecture.md
│   ├── api-docs.md
│   └── deployment.md
├── src/
│   ├── client/              # React frontend (TipTap editor)
│   ├── api-server/          # Express REST API
│   └── sync-server/         # WebSocket sync server (Yjs)
├── tests/
└── demo/
    ├── screenshots/
    └── demo-video-link.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (optional, for full stack)

### Frontend (Client)

```bash
cd src/client
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

## Roadmap

- [x] Repo scaffold and structure
- [ ] Sprint 1: Basic single-user editor (React + TipTap)
- [ ] Sprint 2: Real-time sync (Yjs + WebSocket)
- [ ] Sprint 3: Authentication + access control
- [ ] Sprint 4: Testing, documentation, demo

## Contributing

This project follows CUSoC contributor guidelines:
- Branches: `feature/`, `fix/`, `docs/`
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) format
- All PRs should target this repository's `main` branch

## License

See [LICENSE](./LICENSE) file for details.

## Program

Built as part of **Chandigarh University Season of Code (CUSoC)** — C Square Club.
