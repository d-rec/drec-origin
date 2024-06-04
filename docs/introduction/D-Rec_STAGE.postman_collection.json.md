---
order: 6
---

# D-Rec STAGE Postman Collection.Json

```json

{
	"info": {
		"_postman_id": "bee1ff3f-ef8a-4417-a26f-9e1565cb607d",
		"name": "D-Rec STAGE",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"_exporter_id": "23241992"
	},
	"item": [
		{
			"name": "Developer APIs",
			"item": [
				{
					"name": "Register Developer",
					"request": {
						"method": "POST",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "{\r\n  \"firstName\": \"energy\",\r\n  \"lastName\": \"dev\",\r\n  \"email\": \"UAT_STAGE_DEVELOPER1_231122@gmail.com\",\r\n  \"organizationType\": \"Developer\",\r\n  \"password\": \"MNO133\",\r\n  \"confirmPassword\": \"MNO133\",\r\n  \"orgName\": \"Drec4\",\r\n  \"orgAddress\": \"Hyderabad\",\r\n  \"secretKey\": \"MNLA70\"\r\n}\r\n",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "https://stage-api.drecs.org/api/user/registerWithOrganization",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"user",
								"registerWithOrganization"
							]
						}
					},
					"response": []
				},
				{
					"name": "Developer Login",
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im11bHRpZGV2QGdtYWlsLmNvbSIsImlkIjoxODMsImlhdCI6MTY2Nzc0MTc5MCwiZXhwIjoxNjgzMjkzNzkwfQ.2PdxEXDstUmMxZOoG_NBTSRZRoYtrK-z2Ek1oAez_OU",
									"type": "string"
								}
							]
						},
						"method": "POST",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "{\r\n  \"username\": \"UAT_STAGE_DEVELOPER1_231122@gmail.com\",\r\n  \"password\": \"MNO133\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "https://stage-api.drecs.org/api/auth/login",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"auth",
								"login"
							]
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
									"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVhdF9zdGFnZV9kZXZlbG9wZXIxXzIzMTEyMkBnbWFpbC5jb20iLCJpZCI6MTc4LCJpYXQiOjE2NjkxOTkzMzksImV4cCI6MTY4NDc1MTMzOX0.Vc1a_OQ4PwcHNksRyI9fLNSefswBNcOSjGdihYwrQCc",
									"type": "string"
								}
							]
						},
						"method": "POST",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "{\r\n  \"externalId\": \"UAT_STAGE_Drec4\",\r\n  \"projectName\": \"UAT_STAGE_Drec4_energy1\",\r\n  \"address\": \"donno\",\r\n  \"latitude\": \"45.67\",\r\n  \"longitude\": \"78.990\",\r\n  \"countryCode\": \"IND\",\r\n  \"fuelCode\": \"ES430\",\r\n  \"deviceTypeCode\": \"TC120\",\r\n  \"capacity\": 200,\r\n  \"commissioningDate\": \"2021-01-02T11:35:27.740Z\",\r\n  \"gridInterconnection\": true,\r\n  \"offTaker\": \"Residential\",\r\n  \"impactStory\": \"DemoimpactStory\",\r\n  \"data\": \"\",\r\n  \"images\": [\r\n    \"string\"\r\n  ],\r\n  \"deviceDescription\": \"Rooftop Solar\",\r\n  \"energyStorage\": true,\r\n  \"energyStorageCapacity\": 90,\r\n  \"qualityLabels\": \"qualityLabels\",\r\n  \"SDGBenefits\": 0,\r\n  \"version\": \"1.0\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "https://stage-api.drecs.org/api/device",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"device"
							]
						}
					},
					"response": []
				},
				{
					"name": "List Registered Devices",
					"protocolProfileBehavior": {
						"disableBodyPruning": true
					},
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVuZXJneWRldjVAZ21haWwuY29tIiwiaWQiOjE2MywiaWF0IjoxNjY4NTk4NTE0LCJleHAiOjE2ODQxNTA1MTR9.waYrxU3DKBRn7XFsaJP0c3HkPUmvEnG7wIeoTuDHo8Y",
									"type": "string"
								}
							]
						},
						"method": "GET",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "https://stage-api.drecs.org/api/device/my",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"device",
								"my"
							]
						}
					},
					"response": []
				},
				{
					"name": "History Reads",
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVhdF9zdGFnZV9kZXZlbG9wZXIxXzIzMTEyMkBnbWFpbC5jb20iLCJpZCI6MTc4LCJpYXQiOjE2NjkxOTkzMzksImV4cCI6MTY4NDc1MTMzOX0.Vc1a_OQ4PwcHNksRyI9fLNSefswBNcOSjGdihYwrQCc",
									"type": "string"
								}
							]
						},
						"method": "POST",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "{\r\n  \"type\": \"History\",\r\n  \"unit\": \"Wh\",\r\n  \"reads\": [\r\n    {\r\n      \"starttimestamp\": \"2022-07-23T10:36:02.209Z\",\r\n      \"endtimestamp\": \"2022-11-23T10:00:02.209Z\",\r\n      \"value\": 10000\r\n    }\r\n  ]\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "https://stage-api.drecs.org/api/meter-reads/new/UAT_STAGE_Drec4",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"meter-reads",
								"new",
								"UAT_STAGE_Drec4"
							]
						}
					},
					"response": []
				},
				{
					"name": "Delta Reads - Ongoing",
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVuZXJneWRldjVAZ21haWwuY29tIiwiaWQiOjE2MywiaWF0IjoxNjY4NTk4NTE0LCJleHAiOjE2ODQxNTA1MTR9.waYrxU3DKBRn7XFsaJP0c3HkPUmvEnG7wIeoTuDHo8Y",
									"type": "string"
								}
							]
						},
						"method": "POST",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "{\r\n  \"type\": \"Delta\",\r\n  \"unit\": \"Wh\",\r\n  \"reads\": [\r\n    {\r\n      \"starttimestamp\": \" \",\r\n      \"endtimestamp\": \"2022-11-16T11:40:13.444Z\",\r\n      \"value\": 1200\r\n    }\r\n  ]\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "https://stage-api.drecs.org/api/meter-reads/new/EnergyT",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"meter-reads",
								"new",
								"EnergyT"
							]
						}
					},
					"response": []
				},
				{
					"name": "Aggregate Reads - Ongoing",
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVuZXJneWRldjVAZ21haWwuY29tIiwiaWQiOjE2MywiaWF0IjoxNjY4NTk4NTE0LCJleHAiOjE2ODQxNTA1MTR9.waYrxU3DKBRn7XFsaJP0c3HkPUmvEnG7wIeoTuDHo8Y",
									"type": "string"
								}
							]
						},
						"method": "POST",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "{\r\n  \"type\": \"Aggregate\",\r\n  \"unit\": \"Wh\",\r\n  \"reads\": [\r\n    {\r\n      \"starttimestamp\": \" \",\r\n      \"endtimestamp\": \"2022-11-16T11:37:13.444Z\",\r\n      \"value\": 1200\r\n    }\r\n  ]\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "https://stage-api.drecs.org/api/meter-reads/new/EnergyT1",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"meter-reads",
								"new",
								"EnergyT1"
							]
						}
					},
					"response": []
				}
			]
		},
		{
			"name": "Buyer APIs",
			"item": [
				{
					"name": "Register Buyer",
					"request": {
						"method": "POST",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "{\r\n  \"firstName\": \"Buyer\",\r\n  \"lastName\": \"Swag\",\r\n  \"email\": \"buyerswag@gmail.com\",\r\n  \"organizationType\": \"Buyer\",\r\n  \"password\": \"MNO133\",\r\n  \"confirmPassword\": \"MNO133\",\r\n  \"orgName\": \"swi979\",\r\n  \"orgAddress\": \"Hyderabad\",\r\n  \"secretKey\": \"NPO170\"\r\n}\r\n",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "https://stage-api.drecs.org/api/user/registerWithOrganization",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"user",
								"registerWithOrganization"
							]
						}
					},
					"response": []
				},
				{
					"name": "Buyer Login",
					"request": {
						"method": "POST",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "{\r\n  \"username\": \"energy212@gmail.com\",\r\n  \"password\": \"DEF123\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "https://stage-api.drecs.org/api/auth/login",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"auth",
								"login"
							]
						}
					},
					"response": []
				},
				{
					"name": "Create Reservation",
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVuZXJneTIxMkBnbWFpbC5jb20iLCJpZCI6MTc3LCJpYXQiOjE2NjkyMDAzOTcsImV4cCI6MTY4NDc1MjM5N30.O_sB4TFQUhZ7bGixqDekScEc194J81_bnBnlEj64-38",
									"type": "string"
								}
							]
						},
						"method": "POST",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "{\r\n  \"name\": \"UAT-STAGE-231122-RES1\",\r\n  \"deviceIds\": [\r\n    4\r\n  ],\r\n  \"targetCapacityInMegaWattHour\": 20,\r\n  \"reservationStartDate\": \"2022-11-23T10:00:02.209Z\",\r\n  \"reservationEndDate\": \"2022-11-23T11:30:02.209Z\",\r\n  \"continueWithReservationIfOneOrMoreDevicesUnavailableForReservation\": true,\r\n  \"continueWithReservationIfTargetCapacityIsLessThanDeviceTotalCapacityBetweenDuration\": true,\r\n  \"authorityToExceed\": true,\r\n  \"frequency\": \"hourly\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "https://stage-api.drecs.org/api/device-group",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"device-group"
							]
						}
					},
					"response": []
				},
				{
					"name": "Devices Available For Reservation",
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVuZXJneTIxMkBnbWFpbC5jb20iLCJpZCI6MTc3LCJpYXQiOjE2NjkxOTc3OTksImV4cCI6MTY4NDc0OTc5OX0.C2ZE3Ps-LVZj7cJDGeyznQnk2Ma0kPZSBAeoR5auXbQ",
									"type": "string"
								}
							]
						},
						"method": "GET",
						"header": [],
						"url": {
							"raw": "https://stage-api.drecs.org/api/device/ungrouped/buyerreservation",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"device",
								"ungrouped",
								"buyerreservation"
							]
						}
					},
					"response": []
				},
				{
					"name": "List Devices - Part Of Reservation",
					"protocolProfileBehavior": {
						"disableBodyPruning": true
					},
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVuZXJneTIxMkBnbWFpbC5jb20iLCJpZCI6MTc3LCJpYXQiOjE2NjkxOTc3OTksImV4cCI6MTY4NDc0OTc5OX0.C2ZE3Ps-LVZj7cJDGeyznQnk2Ma0kPZSBAeoR5auXbQ",
									"type": "string"
								}
							]
						},
						"method": "GET",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "https://stage-api.drecs.org/api/certificate-log/issuer/certified/89c400e2-c222-42ac-98ee-74d588cb2dfb",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"certificate-log",
								"issuer",
								"certified",
								"89c400e2-c222-42ac-98ee-74d588cb2dfb"
							]
						}
					},
					"response": []
				},
				{
					"name": "Get certificate",
					"protocolProfileBehavior": {
						"disableBodyPruning": true
					},
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVuZXJneTIxMkBnbWFpbC5jb20iLCJpZCI6MTc3LCJpYXQiOjE2NjkyMDAzOTcsImV4cCI6MTY4NDc1MjM5N30.O_sB4TFQUhZ7bGixqDekScEc194J81_bnBnlEj64-38",
									"type": "string"
								}
							]
						},
						"method": "GET",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "https://stage-api.drecs.org/api/certificate-log/by-reservation-groupId?groupId=4",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"certificate-log",
								"by-reservation-groupId"
							],
							"query": [
								{
									"key": "groupId",
									"value": "4"
								}
							]
						}
					},
					"response": []
				},
				{
					"name": "Devices Reserved For Me",
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVuZXJneTIxMkBnbWFpbC5jb20iLCJpZCI6MTc3LCJpYXQiOjE2NjkyMDAzOTcsImV4cCI6MTY4NDc1MjM5N30.O_sB4TFQUhZ7bGixqDekScEc194J81_bnBnlEj64-38",
									"type": "string"
								}
							]
						},
						"method": "GET",
						"header": [],
						"url": {
							"raw": "https://stage-api.drecs.org/api/device-group/my",
							"protocol": "https",
							"host": [
								"stage-api",
								"drecs",
								"org"
							],
							"path": [
								"api",
								"device-group",
								"my"
							]
						}
					},
					"response": []
				}
			]
		}
	]
}

```
