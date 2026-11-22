# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Visitors at a service desk arrive and need to take a numbered ticket, see where they stand in the queue, and know roughly how long the wait will be. Staff at the same desk need to call the next visitor and keep the queue moving.

## Product Purpose

A lightweight waiting room that replaces calling out names with a visible, self-service queue. Success means a visitor can join in one action, understand their position without asking, and be served in order.

## Positioning

A small, self-hostable queue manager whose position and estimated wait are visible to every visitor in real time, with a simple staff action to serve the next ticket.

## Operating Context

Used in a browser on site at the desk and on visitors' own phones. The service runs as containers with a PostgreSQL database; its readiness is exposed at `/health` for the delivery pipeline. It also serves as a student DevOps demonstration, so the running app and its endpoints must stay easy to inspect.

## Capabilities and Constraints

- Visitors join with one action and receive a ticket code, position, and estimated wait.
- The live queue and each visitor's ticket refresh automatically.
- Staff serve the oldest waiting ticket with one action.
- Tickets persist in PostgreSQL and survive container recreation.
- Terminology: ticket, code, position, waiting, served, desk.
- Constraint: keep the existing dark interface and all API routes intact.
- No user accounts, real personal data, or payments.

## Brand Commitments

Name: "Waiting Room". Voice: short and direct. Confirmed constraint: preserve the existing dark visual direction.

## Evidence on Hand

Running reference at `http://localhost:3000`; source in `src/app`; architecture and rollback notes in `docs/FICHE.md` and `README.md`. No customer research or analytics are available.

## Product Principles

- Make the next step obvious: joining or serving should take one action.
- Show position and wait openly rather than hiding queue state.
- Keep the interface calm; the queue is the content.
- Stay small, legible, and easy to operate in a demo.

## Accessibility & Inclusion

Visitors may be on small phones or in a noisy waiting area; status must be readable at a glance and not rely on color alone.
