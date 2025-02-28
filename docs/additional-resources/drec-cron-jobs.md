---
order: 3
---

# D-REC Cron Jobs

| Name                                | Description                                                                                                      | Frequency        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------- |
| `Synchronize Blockchain`            | Ensures blockchain data is up-to-date and consistent across the system                                           | Every minute     |
| `Ongoing Certificate Issuance`      | Continuously checks and processes the issuance of certificates for active reservations                           | Every 30 seconds |
| `Historical Certificate Issuance`   | Issues certificates based on past device readings and reservation periods                                        | Every 30 seconds |
| `Ongoing Late Certificate Issuance` | Identifies and processes overdue certificate issuances for active device groups, ensuring no missed transactions | Every 8 hours    |
