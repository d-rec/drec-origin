---
order: 6
---

# D-Rec PROD Postman Collection.Json

```json
{
  "info": {
    "_postman_id": "ca4678f5-8869-44e3-82ba-807fcaad5f56",
    "name": "D-Rec PROD",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "_exporter_id": "23241992"
  },
  "item": [
    {
      "name": "Register Developer",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\r\n    \"firstName\": \"UAT\",\r\n    \"lastName\": \"Testing\",\r\n    \"email\": \"uattesting_ricky@gmail.com\",\r\n    \"organizationType\": \"developer\",\r\n    \"password\": \"DEF123\",\r\n    \"confirmPassword\": \"DEF123\",\r\n    \"orgName\": \"RooftopSolar\",\r\n    \"orgAddress\": \"Hyderabad\",\r\n    \"secretKey\": \"SET007\"\r\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "https://api.drecs.org/api/user/registerWithOrganization",
          "protocol": "https",
          "host": ["api", "drecs", "org"],
          "path": ["api", "user", "registerWithOrganization"]
        }
      },
      "response": []
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\r\n    \"username\": \"ricky@powertrust.com\",\r\n    \"password\": \"!\"\r\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "https://api.drecs.org/api/auth/login",
          "protocol": "https",
          "host": ["api", "drecs", "org"],
          "path": ["api", "auth", "login"]
        }
      },
      "response": []
    },
    {
      "name": "Register Device",
      "request": {
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVhdHRlc3Rpbmdfcmlja3lAZ21haWwuY29tIiwiaWQiOjksImlhdCI6MTY2MjY0NDYwMywiZXhwIjoxNjY1MjM2NjAzfQ.eQcMOE75mtBscLaEbL69hIBdlcaLABLxvEpnT9t9FOg",
              "type": "string"
            }
          ]
        },
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\r\n    \"externalId\": \"uatDeviceId14\",\r\n    \"projectName\": \"RoofSolarTopProject1\",\r\n    \"address\": \"nexus\",\r\n    \"latitude\": \"19�20'50.97\\\"S\",\r\n    \"longitude\": \"46� 3'3.21\\\"W\",\r\n    \"countryCode\": \"IN\",\r\n    \"fuelCode\": \"fuel8\",\r\n    \"deviceTypeCode\": \"type3\",\r\n    \"capacity\": 25,\r\n    \"commissioningDate\": \"2022-08-09T19:00:00\",\r\n    \"gridInterconnection\": true,\r\n    \"offTaker\": \"School\",\r\n    \"yieldValue\": 0,\r\n    \"labels\": \"demoo\",\r\n    \"impactStory\": \"Demo impact story\",\r\n    \"data\": \"\",\r\n    \"images\": [\r\n        \"string\"\r\n    ],\r\n    \"deviceDescription\": \"Rooftop Solar\",\r\n    \"energyStorage\": true,\r\n    \"energyStorageCapacity\": 0,\r\n    \"qualityLabels\": \"quality labels\",\r\n    \"groupId\": 0,\r\n    \"SDGBenefits\": 1\r\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "https://api.drecs.org/api/device",
          "protocol": "https",
          "host": ["api", "drecs", "org"],
          "path": ["api", "device"]
        }
      },
      "response": []
    },
    {
      "name": "List Registered Devices",
      "request": {
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVhdHRlc3Rpbmdfcmlja3lAZ21haWwuY29tIiwiaWQiOjksImlhdCI6MTY2MjY0NDYwMywiZXhwIjoxNjY1MjM2NjAzfQ.eQcMOE75mtBscLaEbL69hIBdlcaLABLxvEpnT9t9FOg",
              "type": "string"
            }
          ]
        },
        "method": "GET",
        "header": [],
        "url": {
          "raw": "https://api.drecs.org/api/device/my",
          "protocol": "https",
          "host": ["api", "drecs", "org"],
          "path": ["api", "device", "my"]
        }
      },
      "response": []
    },
    {
      "name": "History Type Meter Read",
      "request": {
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVhdHRlc3Rpbmdfcmlja3lAZ21haWwuY29tIiwiaWQiOjksImlhdCI6MTY2MjY0NDYwMywiZXhwIjoxNjY1MjM2NjAzfQ.eQcMOE75mtBscLaEbL69hIBdlcaLABLxvEpnT9t9FOg",
              "type": "string"
            }
          ]
        },
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\r\n    \"type\": \"History\",\r\n    \"unit\": \"Wh\",\r\n    \"reads\": [\r\n        {\r\n            \"starttimestamp\": \"2022-09-08T13:01:00.335Z\",\r\n            \"endtimestamp\": \"2022-09-08T13:44:06.103Z\",\r\n            \"value\": 5000\r\n        }\r\n    ]\r\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "https://api.drecs.org/api/meter-reads/new/uatDeviceId12",
          "protocol": "https",
          "host": ["api", "drecs", "org"],
          "path": ["api", "meter-reads", "new", "uatDeviceId12"]
        }
      },
      "response": []
    },
    {
      "name": "Delta Type Meter Read",
      "request": {
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVhdHRlc3Rpbmdfcmlja3lAZ21haWwuY29tIiwiaWQiOjksImlhdCI6MTY2MjY0NDYwMywiZXhwIjoxNjY1MjM2NjAzfQ.eQcMOE75mtBscLaEbL69hIBdlcaLABLxvEpnT9t9FOg",
              "type": "string"
            }
          ]
        },
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\r\n    \"type\": \"Delta\",\r\n    \"unit\": \"Wh\",\r\n    \"reads\": [\r\n        {\r\n            \"starttimestamp\": \"\",\r\n            \"endtimestamp\": \"2022-09-08T13:57:47.335Z\",\r\n            \"value\": 50000\r\n        }\r\n    ]\r\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "https://api.drecs.org/api/meter-reads/new/uatDeviceId13",
          "protocol": "https",
          "host": ["api", "drecs", "org"],
          "path": ["api", "meter-reads", "new", "uatDeviceId13"]
        }
      },
      "response": []
    },
    {
      "name": "Aggregate Type Meter Read",
      "request": {
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVhdHRlc3Rpbmdfcmlja3lAZ21haWwuY29tIiwiaWQiOjksImlhdCI6MTY2MjY0NDYwMywiZXhwIjoxNjY1MjM2NjAzfQ.eQcMOE75mtBscLaEbL69hIBdlcaLABLxvEpnT9t9FOg",
              "type": "string"
            }
          ]
        },
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\r\n    \"type\": \"Aggregate\",\r\n    \"unit\": \"Wh\",\r\n    \"reads\": [\r\n        {\r\n            \"starttimestamp\": \"\",\r\n            \"endtimestamp\": \"2022-09-08T13:59:00.335Z\",\r\n            \"value\": 50000\r\n        }\r\n    ]\r\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "https://api.drecs.org/api/meter-reads/new/uatDeviceId14",
          "protocol": "https",
          "host": ["api", "drecs", "org"],
          "path": ["api", "meter-reads", "new", "uatDeviceId14"]
        }
      },
      "response": []
    },
    {
      "name": "Buyer Reservation",
      "request": {
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVuZXJneTIxMkBnbWFpbC5jb20iLCJpZCI6NzUsImlhdCI6MTY2MzkzMzQzMCwiZXhwIjoxNjc5NDg1NDMwfQ.SfVIJKgMVPJsBBJY9r7bUQHWTH9GrEPFY_Z6ripaIvU",
              "type": "string"
            }
          ]
        },
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\r\n    \"name\": \"UAT_Reservation_2\",\r\n    \"deviceIds\": [\r\n        60\r\n    ],\r\n    \"targetCapacityInMegaWattHour\": 100,\r\n    \"reservationStartDate\": \"2022-09-22T08:44:30.519Z\",\r\n    \"reservationEndDate\": \"2021-09-28T09:44:30.519Z\",\r\n    \"continueWithReservationIfOneOrMoreDevicesUnavailableForReservation\": false,\r\n    \"continueWithReservationIfTargetCapacityIsLessThanDeviceTotalCapacityBetweenDuration\": false,\r\n    \"authorityToExceed\": true,\r\n    \"frequency\": \"hourly\"\r\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "https://api.drecs.org/api/device-group",
          "protocol": "https",
          "host": ["api", "drecs", "org"],
          "path": ["api", "device-group"]
        }
      },
      "response": []
    },
    {
      "name": "List Devices For Reservation",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "https://api.drecs.org/api/device/ungrouped/buyerreservation",
          "protocol": "https",
          "host": ["api", "drecs", "org"],
          "path": ["api", "device", "ungrouped", "buyerreservation"]
        }
      },
      "response": []
    },
    {
      "name": "End Reservation",
      "request": {
        "method": "DELETE",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\r\n    \"endresavationdate\": \"\"\r\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "https://api.drecs.org/api/device-group/endresavation/{id}",
          "protocol": "https",
          "host": ["api", "drecs", "org"],
          "path": ["api", "device-group", "endresavation", "{id}"]
        }
      },
      "response": []
    },
    {
      "name": "List Meter Reads",
      "request": {
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Impvc2VwaHNAZGUuZW5lcmd5IiwiaWQiOjEwLCJpYXQiOjE2NjQ2NDY1MTMsImV4cCI6MTY4MDE5ODUxM30._u3x6qjHIepjfc3hz_GIGCcgltkpIWuEtlP2E93rsN8",
              "type": "string"
            }
          ]
        },
        "method": "GET",
        "header": [],
        "url": {
          "raw": "https://api.drecs.org/api/meter-reads/Xion Mall?start=2022-09-25T21:59:30.519Z&end=2022-09-29T21:59:30.519Z&limit=1000&offset=0",
          "protocol": "https",
          "host": ["api", "drecs", "org"],
          "path": ["api", "meter-reads", "Xion Mall"],
          "query": [
            {
              "key": "start",
              "value": "2022-09-25T21:59:30.519Z"
            },
            {
              "key": "end",
              "value": "2022-09-29T21:59:30.519Z"
            },
            {
              "key": "limit",
              "value": "1000"
            },
            {
              "key": "offset",
              "value": "0"
            }
          ]
        }
      },
      "response": []
    }
  ]
}
```
