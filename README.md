# ⬡ Swarm

Autonomous agent commerce on Arc — AI agents that hire, pay, and coordinate with each other in real time using Circle Nanopayments and USDC.

## What is Swarm?

Swarm is an autonomous agent commerce network built on Arc. An Orchestrator Agent receives a mission, breaks it into subtasks using AI, and hires Worker Agents (Scraper, Summariser, Validator) to complete each task. Every completed subtask triggers an instant sub-cent USDC payment via Circle Nanopayments settled on Arc. No batching, no subscriptions, no intermediaries.

## Why Arc?

This model is economically impossible on Ethereum mainnet where gas fees of $5-15 per transaction destroy the margin on sub-cent payments. Arc makes it viable with gas-free sub-cent transactions and sub-second finality.

## Tech Stack

- Arc L1 Blockchain (Settlement)
- Circle Nanopayments + USDC (Payments)
- Circle Wallets (Agent Wallets)
- OpenRouter AI (Agent Intelligence)
- Next.js + TypeScript (Frontend)

## Agent Architecture

- Orchestrator Agent — breaks missions into subtasks and hires workers
- Scraper Agent — collects raw data
- Summariser Agent — synthesizes results
- Validator Agent — verifies output quality
- Escrow mechanism — funds locked before work, released after validation

## Getting Started

```bash
CIRCLE_API_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_CIRCLE_APP_ID=
OPENROUTER_API_KEY=
CIRCLE_WALLET_ID=
## Hackathon

Built for the Agentic Economy on Arc Hackathon by lablab.ai — April 2026.

Track: Agent-to-Agent Payment Loop