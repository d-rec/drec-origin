---
order: 3
---

# D-REC Cron Jobs Overview

This document details the scheduled cron jobs within the D-REC system. Each job is designed to maintain data consistency, ensure timely certificate issuance, and uphold the overall system's reliability.

## Scheduled Tasks

| **Job Name**                          | **Description**                                                                                                                             | **Frequency**    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **Synchronize Blockchain**            | Triggers the issuance of certificates on the blockchain for those that have been processed and are pending issuance.                        | Every minute     |
| **Ongoing Certificate Issuance**      | Monitors and processes certificate issuance for active reservations based on Delta and aggregate meter readings.                            | Every 30 seconds |
| **Historical Certificate Issuance**   | Processes certificate issuance for historical meter readings associated with active reservations.                                           | Every 30 seconds |
| **Ongoing Late Certificate Issuance** | Identifies and processes overdue certificate issuances for active reservations with historical data added after the reservation's creation. | Every 8 hours    |
