---
order: 4
---

# API User Manual

## DREC API User Manual - UI

### Step 1. Admin create

The super admin will be created by default when the migrations running in our api end.

### Step 2. After Admin login, admin can create or use existing ACLModule name with crdul permission

**1. Migration update:**

The ACL Module names also will be create by default during migration running in our api end.

**2. Migration update with UI:**

The ACL Module name can created through our UI as shown below.

![Create ACL Module Form](44d58bc0-1fa8-4e23-810a-cd5cf1b6bc32.png)

Here, In our below page we can also view the listing of created/existing ACL Modules.

![Listing of ACL Module Name Form](2e83fd44-806d-437e-8ec4-4f3d66cea6aa.png)

After adding acl module crudl name, admin can also manage Role (OrganizationAdmin, DeviceOwner, Buyer, SubBuyer, User) base permission.

![Add Permission Form](6cd57511-1971-45ae-a856-c66f69ff3dc6.png)

Here, We can have listing of user role permissions.

![alt text](840cfea4-290e-4e4a-8c6c-92c6d7d7ba15.png)

### Step 3. User registration process (user can add be two type)

Direct Drec User- User can register directly by using role as Developer or Buyer,

![User Registration Form](c525fd51-2774-46d3-9e5f-43a6343ea361.png)

If User register for ApiUser role then after registration done ApiUser will get private key file downloaded.

![fie download notification](image.png)

Below is the pem private key using which we will authorize the request from apiuser's application.This pem key file is the one time downloadable file which is very confidential. Apiuser was instructed to keep the private key file as confidential.

![Private key pem file](image-1.png)

After successful registration of apiuser, will be redirected to permission request form.

![Permission request form](image-2.png)

In this for apiuser need to make a request to be able to use all module apis (like some apiuser only use Developer module or some apiuser will use Buyer module or else some will use both module).
After submiting, apiuser will get status of permission in permission list ui.

![Listing of requested permission](image-3.png)

After apiuser sends permission request, they have to wait for “approve” status of permission. admin can approve apiuser permissions.
admin will check apiuser permission status form all apiuser list.

![All Api Users](b163d33b-4aad-4e80-bb65-6520c9ec2b78.png)

After clicking permission status admin will move apiuser permission in ui as “inactive” and “active”.

![Listing of permission requests of apiuser at admin](a3e97c72-fedf-42c2-828f-02ad0d64d992.png)

and from the ”update status” button, admin can change status.

![Update permission status form](5de091f9-5101-4677-b050-16bad6a36903.png)

After admin change status, apiuser will get changed status in own side then after, they will be able to use drec functionality according to permission aprroved.

![Listing of permissions](a90acbf5-bdaf-4154-a2b2-d05edd750b51.png)

### Step4. ApiUser workflow

#### Organization

Create User Organization (Developer and Buyer)
from ui apiuser can create organization for developer and buyer from add organization form.

![Add Organization Form1](d0acfedb-10d7-4a31-872f-b694f49f42e9.png)

![Add Organization Form2](3f3521bc-33c3-4073-9686-5b9e4f0aaa00.png)

and submit form and redirect to list view.

After adding user apiuser will get all user of own org and can view in “all users” page.

![All Users Form](eb1e687d-176f-4c2d-80df-a1fac6d944fc.png)

Api users can see all added organization list from “All organization” menu item in the left hand navigation..

![All Organization](a4cd388b-b86b-42fe-93da-4ba933603b32.png)

They can also see org by using filter by organization name.

#### Device

##### Device working process

Apiuser can devices, they first need to select organization name, then after fill all required device related information.

![Add Device Form](88774ce7-a63e-4413-a445-15442470ea56.png)

after submitting device form, they will be redirect Device list view.

To see all Device of all org which belongs to apiuser.

![Device Listing](6eedb79d-11ab-416f-9719-084c8f946f6d.png)

Apiuser can also add devices in bulk form using bulk upload.

![Device Bulk Upload Form](4f2f8862-e2ec-41c9-bd5f-002ce57ebfed.png)

And see the job of bulk upload process

![Listing of Bulk Upload Job](2932d6ee-eb0e-4a3e-9cc7-e4668cfed395.png)

#### Read

##### Apiuser Meter read working process

To add meter read, they First need to select organization

![Add Reads Form1](e7195c7d-b401-47af-a240-0a9e610b0c13.png)

After selecting organization, the UI will show all required field for read

![Add Reads Form2](e7467689-f299-4b90-a267-d48ad4b6b1a8.png)

Apiuser also gets meter read list of all org devices which belong their platform.

![Listing of Meter Read](d3e18c24-c673-498c-8182-815db95d12bd.png)

#### Permission

##### apiuser can view update permission from permission menu

If apiuser after getting “approved” permission from admin side in a module and they want to again update some permission in the same module, so they will be able to update by using “edit form”.

![Permission Update Form](cfa7f055-9c50-4047-abae-7253d3a4dd6d.png)

but status will be ’inactive” which can be made active by super admin.

![listing of permission request form](3074d878-d244-4ffb-a2d8-31b19227d2ba.png)

#### AddReaservaion

Apiuser can make reservation from “add reservation” menu,

To make a reservation apiuser needs to first select an organization and then after he fills in all required fields in the form and can select devices from ungrouped devices list which are not a part of any other reservation.

![Add Reservation Form](ba1b13d7-5fc0-4a1e-a254-3a62a89b5c1f.png)

After clicking submit button, an popup will appear to choose “yes” or “no” and after clicking “continue”, the reservation will be done.

![Confirm form at Add reservation](a7a17b21-130f-47c6-8c65-6edee3f1988a.png)

then after they will be redirected to “ my reservation list”.

![My Reservation listing](b00cfa11-16a9-4bbe-b640-b60696e4d9be.png)

From the “action button” apiuser will be able to check all certificates of the particular reservation.

![All Certificate listing of an reservation](037de940-9eb3-45a8-8b79-12ef56d18b0c.png)

#### Certificate

Apiuser can check all certificates by the reservation base and device base by selecting type of organization (developer or buyer).

![Certificate Listing](881a5152-ebab-4c25-a7e7-5965b947b857.png)

## DREC API User Manual - API

### 1. User Module

#### 1.1 Register Api

**Request Type:** POST

**Request URL:** [http://localhost:3040/api/user/register](http://localhost:3040/api/user/register)

**Authorization:** Not Required

**ACL Module Name:** USER_MANAGEMENT_CRUDL

##### 1.1.1 Organization Type - ApiUser

**Permission:** Not Required (It’s true by default).

**Headers:** Not Required

![Register ApiUser Payload](c94f0713-8644-4cf0-a482-d11bbef3f7f3.png)

![Register ApiUser Response](905cb8de-0715-437a-b040-ece23f1fd279.png)

##### 1.1.2. Organization Type - Developer/Buyer under an ApiUser

**Permission:** Write permission required. (Need to login (Ref: 2.1) and Request permission for this ACL module Name (Ref: 3.1))

**Headers:** Not Required

**Request Body:** We have to pass the ‘api_user_id' of ApiUser under whom registering the Developer/ Buyer’s organization.

![Register ApiUser Payload](52e90ad6-1924-4832-a665-5a412227502f.png)

**Response:**

![Register ApiUser Response](008dcc14-f44d-4d04-bace-727a7a8d57da.png)

#### 1.2. FORGET-PASSWORD API

**Request Type:** POST

**Request URL:** [http://localhost:3040/api/user/forget-password](http://localhost:3040/api/user/forget-password)

**ACL Module Name:** PASSWORD_MANAGEMENT_CRUDL

**Permission:** Write permission required

**Headers:** Not Required

**Authorization:** Not required

**Request Body:**

![Forget Password Form](5827cfcf-d489-4dfe-bf27-64bc801cfe93.png)

**Response:**

![Forget Password Response Form](3c00cc49-9d84-4105-9432-34202bc31679.png)

Developer or Buyer under an apiuser is unauthorized to access this api.

![Dev or Buyer Forget Password payload](35a1eaed-651e-40bb-b834-8d2aeca23804.png)

![Dev or Buyer Forget Password Response](7720e0d6-af72-4e76-ae67-27efd09078dd.png)

#### 1.3. ME API

**Request Type:** GET

**Request URL:** [http://localhost:3040/api/user/me](http://localhost:3040/api/user/me)

**ACL Module Name:** Not Required

**Authorization:** Required

![Bearer Authorization Form](a1fd55b4-70d8-4d2a-888c-01c18f886caa.png)

**Permission:** Not Required

**Headers:** Not Required

**Request Body:** No body payload required

**Response:**

![User/me Response Form](5217f30f-3adb-4c40-8789-dabadf34c3b5.png)

#### 1.4. RESEND CONFIRM MAIL API

**Request Type:** PUT

**Request URL:** [http://localhost:3040/api/user/resend-confirm-email](http://localhost:3040/api/user/resend-confirm-email)

**ACL Module Name:** Required. USER_MANAGEMENT_CRUDL

**Permission:** Write permission required
Headers: Not Required

**Authorization:** Required

**Request Body:** Not required

**Response:**

![Resend Confirm mail Response](b17f14fe-f975-4115-a445-dee98356b894.png)

#### 1.5. CONFIRM-EMAIL API

**Request Type:** PUT

**Request URL:** [http://localhost:3040/api/user/confirm-email/a3a7b310f3fecb245a16ce4643d4600a965d637156c17a84a1360223173079f41401ad5689213dd41f8036b671d7c8386aec7af29f8aab3a076008f3c2b962f3](http://localhost:3040/api/user/confirm-email/a3a7b310f3fecb245a16ce4643d4600a965d637156c17a84a1360223173079f41401ad5689213dd41f8036b671d7c8386aec7af29f8aab3a076008f3c2b962f3)

**ACL Module Name:** Required. USER_MANAGEMENT_CRUDL

**Permission:** Write permission required
Headers: Not Required

**Authorization:** Not Required

**URL params:** token is the string that we receive through mail

**Request Body:** Not required

**Response:**

![Resend Confirm mail Response](c7c97a90-37e3-4c88-b8d1-a998e58c79cd.png)

#### 1.6. RESET PASSWORD API

**Request Type:** PUT

**Request URL:** [http://localhost:3040/api/user/confirm-email/a3a7b310f3fecb245a16ce4643d4600a965d637156c17a84a1360223173079f41401ad5689213dd41f8036b671d7c8386aec7af29f8aab3a076008f3c2b962f3](http://localhost:3040/api/user/reset/password/c1c7dc38d5de4e6f4f5747f3cc06fb858172079129528f3fcbb5f8809ac5cc1e6c1ac8bcd94f73cc2cf48cffd0da035e4f92c67aa3185f7d6e1607650a2a2d0e)

**ACL Module Name:** Required. USER_MANAGEMENT_CRUDL

**Permission:** Write permission required
Headers: Not Required

**Authorization:** Not Required

**URL params:** token is the string that we receive through mail

**Request Body:** Required.

![Reset Password Payload](54f5ab13-2c6c-4daf-b4f2-165e8f50f8f6.png)

**Response:**

![Reset Password Response](32707094-1b66-4881-a16d-7f28f4fd15ee.png)

### 2. Auth Module

#### 2.1. LOGIN API

**Request Type:** POST

**Request URL:** [http://localhost:3040/api/auth/login](http://localhost:3040/api/auth/login)

**ACL Module Name:** Not Required

**Permission:** Not Required

**Headers:** Not Required

**Request Body:**

![Login Api Payload](b0a8e790-55a1-4f89-a294-c59bbf1758a5.png)

**Response:**

![Login Api Response](91bc9d22-9964-4feb-b7b2-cec285ffa1c3.png)

Developer and Buyer of an apiuser is unauthorized to aceess this api.

![Login Api Payload for Dev or Buyer](7c0774bd-7c7f-4a57-8523-f11fcb5b9c3a.png)

![Login Api Response for Dev or Buyer](b663ca92-c978-4f51-86d6-f1ef61311b47.png)

### 3. Permission Module

#### 3.1. REQUEST PERMISSION API

**Request Type:** POST

**Request URL:** [http://localhost:3040/api/permission/module/apiuser/request](http://localhost:3040/api/permission/module/apiuser/request)

**ACL Module Name:** Not Required

**Permission:** Not Required

**Headers:** Not Required

**Authorization:** Required

**Request Body:**

![ApiUser Permission Request Form](48e1c9e2-1970-4b5e-b82c-88d3bafb9c8b.png)

**Response:**

![Permission Request Response](<16dfd755-7467-4acf-bc42-8bad99ac713d (1).png>)

### 4. Device Module

#### 4.1 REGISTER DEVICE API

**Request Type:** POST

**Request URL:** [http://localhost:3040/api/device](http://localhost:3040/api/device)

**ACL Module Name:** Required. DEVICE_MANAGEMENT_CRUDL

**Permission:** Write permission required

**Headers:** Not Required

**Authorization:** Required

**Request Body:**

The organizationID in this payload is applicable only for ApiUser. This organizationId value should be Developer’s organization Id who wants to register a device in our application.

![Device Register Payload](f6652813-5ad2-47af-97c5-a4e0627cfc06.png)

**Response:**

![Device Register Response](2ca96dfa-2b51-4573-b3b0-106e7097be14.png)

It will throw unauthorized exception when give buyer’s organizationId in payload.

![Device Register Payload with Buyer's OrgId](296acb9c-1cad-4e0e-a084-24913862333e.png)

![Device Register Response for with Buyer's OrgId](e2fa432c-2859-4157-aa8e-dfe1547b21d1.png)

#### 4.2 GET DEVICE BY ID API

**Request Type:** GET

**Request URL:** [http://localhost:3040/api/device/10?organizationId=10&apiUserId=958c05ec-feac-48b7-ba10-6fcd76d9b122](http://localhost:3040/api/device/10?organizationId=10&apiUserId=958c05ec-feac-48b7-ba10-6fcd76d9b122)

**ACL Module Name:** Required. DEVICE_MANAGEMENT_CRUDL

**Permission:** Read permission required

**Headers:** Not Required

**Authorization:** Required

**Query Params:**
This organization Id and apiUserId in query params should be same as the device’s apiuserId and organizationId.

![Get Device By Id Payload](b53a14f0-b08f-4a78-be3b-7aec38d51f42.png)

**Request Body:** Not required

**Response:**

![Get Device By Id Response](8f6c0fea-bd17-46dd-8eb5-a4a3a773d1ad.png)

#### 4.3 GET MY DEVICES API

**Request Type:** GET

**Request URL:** [http://localhost:3040/api/device/my?organizationId=25&pagenumber=1](http://localhost:3040/api/device/my?organizationId=25&pagenumber=1)

**ACL Module Name:** Required. DEVICE_MANAGEMENT_CRUDL

**Permission:** Read permission required

**Headers:** Not Required

**Authorization:** Required

**Query Params:**
This organization Id in query params is applicable for ApiUser and It is optional. When the organizationId is not provided, it will get response of all devices of developers of this apiuser. When the organizationId is given, it will get the response of all devices of organization and developers of this apiuser.

If buyer’s organizationId provided will receive the unauthorized exception.

PageNumber in query param is mandatory for apiuser.

![Query Params Get My Devices Payload1](6ce015c0-cc81-4c37-a2d3-9c55bbcad24f.png)

![Query Params Get My Devices Payload2](5649417b-4bd9-4d9d-ab2a-60045bd9f3b1.png)

**Request Body:** Not required

**Response:** Response when given the page number only. Returns the array of devices with pagination.

![Get My Device Response1](1d166a1e-c419-4e18-8524-ff8142a71f14.png)

Response when given the page number and organizationId . Returns the array of devices with pagination.

![Get My Device Response2](3dda9ad3-6609-477d-9138-ebd9282d73b8.png)

Response when buyer’s organizationId given.

![Get My Device Response for Buyers](02695c52-4f8c-48bb-a2b8-c63744976874.png)

#### 4.4 CREATE DEVICES BY BULK UPLOAD API

**Request Type:** POST

**Request URL:** [http://localhost:3040/api/device/addByAdmin/process-creation-bulk-devices-csv/21](http://localhost:3040/api/device/addByAdmin/process-creation-bulk-devices-csv/21)

**ACL Module Name:** Required. DEVICE_BULK_MANAGEMENT_CRUDL

**Permission:** Write permission required

**Headers:** Not Required

**Authorization:** Required

![Bearer Authorization Form](f23d2133-204d-4f15-8056-b4241a8f5e4c.png)

**URLarams:**
This organization Id in url params should be the developer’s organizationId.

**Request Body:** Required

![Add Device Bulk Upload Payload](2481a4ee-1ade-4b3d-a96d-64aaecd3c791.png)

**Response:**

If developer’s organizationId given

![Bulk Upload Dev Response1](953b127f-878d-4d9c-a476-5e2c9ca8fdc8.png)

If buyer’s organizationId given

![Bulk Upload Buyer Response2](940f70e3-f0f1-4c82-a018-fc3f360c6669.png)

#### 4.5. GET UNGROUPED DEVICES API

**Request Type:** GET

**Request URL:** [http://localhost:3040/api/device/ungrouped/buyerreservation?pagenumber=1&organizationId=26](http://localhost:3040/api/device/ungrouped/buyerreservation?pagenumber=1&organizationId=26)

**ACL Module Name:** Required. DEVICE_MANAGEMENT_CRUDL

**Permission:** Read permission required

**Headers:** Not Required

**Authorization:** Required

![Bearer Authorization Form](82e119c1-6824-4ca2-9141-367e2e01426a.png)

**Query Params:**

OrganizationId in query param is given buyer’s organization.

Page Number in query param is given to retrieve the page you want to view.

**Request Body:** Not Required.

**Response:**

![Get UnGrouped Devices Response](687890a6-abcb-44f5-a280-efe42f534d46.png)

### 5. Reads Module

#### 5.1 ADD METER READS API

**Request Type:** POST

**Request URL:** [http://localhost:3040/api/meter-reads/new/Ext1](http://localhost:3040/api/meter-reads/new/Ext1)

**ACL Module Name:** Required. READS_MANAGEMENT_CRUDL

**Permission:** Read permission required

**Headers:** Not Required

**Authorization:** Required

![Bearer Authorization Token](1b8c68b0-6973-4808-9172-566960b329ca.png)

**URL Params:**
The id in URL params is the developer external id of the device for which we want to add meter read.

![Add Reads URL Params](5bf4dd48-e2bc-4f49-b7e6-99f2bc4a0b70.png)

**Request Body:** Required

![Add Meter Reads Payload](5b2af89a-8129-4d30-9ef5-29258705c3e9.png)

**Response:** No response. Read will be added in db when the developer’s organizationId given in the body payload.

If the buyer’s organizationId in body payload is given, the unauthorized exception will be thrown.

#### 5.2 GET METER READS BY EXTERNAL ID API

**Request Type:** GET

**Request URL:** [http://localhost:3040/api/meter-reads/new/Ext1?readType=meterReads&start=2023-01-01T00:00:00Z&end=2023-11-26T07:32:59Z&pagenumber=2&organizationId=15](http://localhost:3040/api/meter-reads/new/Ext1?readType=meterReads&start=2023-01-01T00:00:00Z&end=2023-11-26T07:32:59Z&pagenumber=2&organizationId=15)

**ACL Module Name:** Required. READS_MANAGEMENT_CRUDL

**Permission:** Read permission required

**Headers:** Not Required

**Authorization:** Required

**Query Params:**
The organizationId in query params can be given both developer’s and buyer’s.

**URL Params:**
If the developers organizationId given in query params, the id in URL params is the developer external id of the device for which we want to get meter read.

![Get Meter Reads URL Param1](72bacd52-0adb-4161-a8f9-0f0e733d6ecb.png)

If the buyer’s organizationId given in query params, the id in URL params is the device id of which we want to get meter read.

![Get Meter Reads URL Param2](000832be-defb-45f5-9607-6b5f7637428f.png)

**Request Body:** Not required.

**Response:**
If the buyer’s organizationId

![Get Meter Reads Response1](b07f8f44-859f-4605-8c79-37104a5ab63e.png)

![Get Meter Reads Response1.1](0146b5eb-ab40-45dd-8b7c-ebda6d08d034.png)

If the developer’s organizationId is given

![Get Meter Reads Response2](94986a74-7e0f-4877-ab03-2deeda3574da-1.png)

![Get Meter Reads Response2.2](a24be8f3-96d0-439b-8321-34b3a3c9a085.png)

### 6. INVITATION MODULE

#### 6.1 INVITE API

**Request Type:** POST

**Request URL:** [http://localhost:3040/api/invitation?organizationId=3](http://localhost:3040/api/invitation?organizationId=3)

**ACL Module Name:** Required. INVITATION_MANAGEMENT_CRUDL

**Permission:** Write permission required

**Headers:** Not Required

**Authorization:** Required

![Bearer Authorization Form](6db1f75a-acf3-4ee6-b4d6-47dcbfe5e384.png)

**Query Params:**

The organizationId in query params can be given both developer’s and buyer’s.

**Request Body:** Required.

![Invite api payload](af31a333-e8b8-4b56-9366-418a52665548.png)

**Response:**

If the buyer’s and developer’s organizationId

![Invite api Response](aa379133-e55e-4f88-8930-40a8b42c75d2.png)

#### 6.2 GET INVITATION API

**Request Type:** GET

**Request URL:** [http://localhost:3040/api/invitation?organizationId&pageNumber&limit](http://localhost:3040/api/invitation?organizationId&pageNumber&limit)

**ACL Module Name:** Required. INVITATION_MANAGEMENT_CRUDL

**Permission:** Read permission required

**Headers:** Not Required

**Authorization:** Required

![Bearer Authorization Form](fa9e5570-595e-43fd-9a2e-67ec7d52fa33.png)

**Query Params:**

The organizationId in query params can be given to both developer’s and buyers.

The Page Number and limit to be provided for pagination.

**Request Body:** Not Required.

**Response:**

If there is no organizationId given,

![Get Invitation Response1](65360105-d6a3-4a6c-9d07-2f40722bb7f1.png)

If the Developer’s organizationId given

![Get Invitation Response2](b83482f1-ab87-4e30-8661-2ad3c904651f.png)

If the buyer’s organizationId is given

![Get Invitation Response3](3619f406-1575-4c07-8d3d-87e19f3240d2.png)

### 7. BUYER-RESERVATION MODULE

#### 7.1 RESERVATION API

**Request Type:** POST

**Request URL:** [http://localhost:3040/api/buyer-reservation?orgId=26](http://localhost:3040/api/buyer-reservation?orgId=26)

**ACL Module Name:** Required. BUYER_RESERVATION_MANAGEMENT_CRUDL

**Permission:** Write permission required

**Headers:** Not Required

**Authorization:** Required

![Bearer Authorization Form](f8cdbc54-f122-4ab9-8e4b-bee278a53f10.png)

**Query Params:**

The buyer’s organizationId in query params can be given.

**Request Body:** Required.

![Create reservation Payload](f1a5d9cf-4ba6-4363-8899-6e7ac72d2e5c.png)

**Response:**

If the Developer’s organizationId given, will throw unauthorized error.

If the buyer’s organizationId is given

![Create Reservation Response](a2cd27ac-5014-4a0a-92d7-fc0aa8e3f27f.png)

#### 7.2 GET RESERVATION API

**Request Type:** GET

**Request URL:** [http://localhost:3040/api/buyer-reservation?apiuserId=37110d08-e1af-4909-88c9-3f57025a7965&organizationId=26&pageNumber=1&limit=3](http://localhost:3040/api/buyer-reservation?apiuserId=37110d08-e1af-4909-88c9-3f57025a7965&organizationId=26&pageNumber=1&limit=3)

**ACL Module Name:** Required. BUYER_RESERVATION_MANAGEMENT_CRUDL

**Permission:** Read permission required

**Headers:** Not Required

**Authorization:** Required

![Bearer Authorization Form](a4c12d2e-4222-49b0-98a3-74b188d0a844.png)

**Query Params:**

The apiuserId in query param is for admin to view the reservations by apiuser. If apiuser provides the apiuser , it should be same as his own apiuserId.

OrganizationId in query param is given reservations can be filtered by organization of the same apiuser.

Page number in query param is 1 by default.

Limit in query param is to provide the number items to be viewed per page.

**Request Body:** Not Required.

**Response:**

If apiuserId only given will get the response of array of reservations by apiuserId.

![Get Reservation Response1](33363a7c-4b01-4622-96d2-5b33573c38c0.png)

If apiuserId and organizationId given, It also filter the response by organization.

![Get Reservation Response2](ae6a57eb-3372-480e-b53e-c5a2b4ef9cc0.png)

#### 7.3 GET RESERVATION BY ID API

**Request Type:** GET

**Request URL:** [http://localhost:3040/api/buyer-reservation/41?organizationId=26](http://localhost:3040/api/buyer-reservation/41?organizationId=26)

**ACL Module Name:** Required. BUYER_RESERVATION_MANAGEMENT_CRUDL

**Permission:** Read permission required

**Headers:** Not Required

**Authorization:** Required

![Bearer Authorization Form](03ae63ce-bb5d-44f5-9a03-a4ff0764ce4d.png)

**Query Params:**

OrganizationId in query param is given organization of reservation.

**URL Param:**

The url param id is the reservationId that you want to retrieve.

**Request Body:** Not Required.

**Response:**

![Get Reservation By Id Response](40b56370-e723-4fe3-b316-be4c5fe3ccc6.png)

#### 7.4. BULK UPLOAD JOBS API

**Request Type:** GET

**Request URL:** [http://localhost:3040/api/buyer-reservation/bulk-upload/get-all-csv-jobs-of-organization?orgId=25&pageNumber=1&limit=1](http://localhost:3040/api/buyer-reservation/bulk-upload/get-all-csv-jobs-of-organization?orgId=25&pageNumber=1&limit=1)

**ACL Module Name:** Required. DEVICE_BULK_MANAGEMENT_CRUDL

**Permission:** Read permission required

**Headers:** Not Required

**Authorization:** Required

![Bearer Authorization Form](47cb0ed3-9303-4e35-a852-b529fd8af733.png)

**Query Params:**

OrganizationId in query param is given organization of developer.

Page number in query param is to request which page we want to view, and its default value is 1.

Limit is the number of items to be viewed per page.

**Request Body:** Not Required.

**Response:**

![Get Bulk Upload Response](df4a9538-8356-4671-be12-7f3acc6563f3.png)

#### 7.5. GET BULK UPLOAD STATUS API

**Request Type:** GET

**Request URL:** [http://localhost:3040/api/buyer-reservation/bulk-upload-status/48?orgId=25](http://localhost:3040/api/buyer-reservation/bulk-upload-status/48?orgId=25)

**ACL Module Name:** Required. DEVICE_BULK_MANAGEMENT_CRUDL

**Permission:** Read permission required

**Headers:** Not Required

**Authorization:** Required

![Bearer Authorization](83521dbf-4476-415d-b881-c17e9e035795.png)

**Query Params:**

OrganizationId in query param is given organization of developer.

**Request Body:** Not Required.

**Response:**

![Get Bulk Upload Api](bfab2776-30a1-47b6-b6c2-e6939e4e5783.png)

### 8. CERTIFICATE LOG MODULE

#### 8.1. CERTIFICATE LOG API

**Request Type:** GET

**Request URL:** [http://localhost:3040/api/certificate-log/issuer/certifiedlogOfdevices?pageNumber=1&organizationId=26](http://localhost:3040/api/certificate-log/issuer/certifiedlogOfdevices?pageNumber=1&organizationId=26)

**ACL Module Name:** Required. CERTIFICATE_LOG_MANAGEMENT_CRUDL

**Permission:** Read permission required

**Headers:** Not Required

**Authorization:** Required

![Bearer Authorization Form](07633c11-7300-43af-bcfb-984153026919.png)

**Query Params:**

OrganizationId in query param is given organization of reservation.

Page number in query param is to request which page we want to view.

**Request Body:** Not Required.

**Response:**

![Get Certificate Log Response1](21c1dadd-5f63-46a1-bf57-26a83d900844.png)

#### 8.2. ISSUER CERTIFIED API

**Request Type:** GET

**Request URL:** [http://localhost:3040/api/certificate-log/issuer/certified/new/3ea3d485-6920-4632-9c7f-a6ac8566b1bd?pageNumber=1](http://localhost:3040/api/certificate-log/issuer/certified/new/3ea3d485-6920-4632-9c7f-a6ac8566b1bd?pageNumber=1)

**ACL Module Name:** Required. CERTIFICATE_LOG_MANAGEMENT_CRUDL

**Permission:** Read permission required

**Headers:** Not Required

**Authorization:** Required

![Bearer Authorization](4e80d952-67d5-4a33-9a62-9fd08fa0173a.png)

**Query Params:**

Page number in query param is to request which page we want to view.

**Request Body:** Not Required.

**Response:**

![Get Issuer/certified Response](2ad51611-bedc-44bf-afd6-774775ed26ab.png)
