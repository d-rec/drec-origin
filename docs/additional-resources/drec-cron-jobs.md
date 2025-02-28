---
order: 3
---

# D-REC Cron Jobs

| Name                              | Description                                                                                   | Frequency        |
| --------------------------------- | --------------------------------------------------------------------------------------------- | ---------------- |
| `Synchronize Blockchain`          | Synchronizes blockchain data to ensure state consistency                                      | Every minute     |
| `Ongoing Certificate Issuance`    | Checks and processes the issuance of certificates                                             | Every 30 seconds |
| `Historical Certificate Issuance` | Processes and issues certificates based on historical device readings and reservation periods | Every 30 seconds |
| `OngoingLateCertificateIssuance`  | Processes overdue certificate issuances for device groups                                     | Every 8 hours    |
