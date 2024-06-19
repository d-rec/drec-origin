---
order: 3
---

# Release Notes

| Release ID (phaseNo, ReleaseNo) | Feature/Bug                                         | Relevant JIRA Tickets | Impact on other feature | Environment | Release Date  |
| ------------------------------- | --------------------------------------------------- | --------------------- | ----------------------- | ----------- | ------------- |
| DR 1.1                          | Developer and Organisation registration             |                       |                         | Stage       | Sept 08, 2022 |
| DR 1.1                          | User Login and Invitation                           |                       |                         | Stage       | Sept 08, 2022 |
| DR 1.1                          | Register the devices                                |                       |                         | Stage       | Sept 08, 2022 |
| DR 1.1                          | List the registered devices                         |                       |                         | Stage       | Sept 08, 2022 |
| DR 1.1                          | Certificate issuance                                |                       |                         | Stage       | Sept 08, 2022 |
| DR 1.1                          | Yield value configurations                          |                       |                         | Stage       | Sept 08, 2022 |
| DR 1.1                          | ACL Implementation                                  |                       |                         | Stage       | Sept 08, 2022 |
| DR 1.1                          | Bulk Device upload                                  |                       |                         | Stage       | Sept 08, 2022 |
| DR 1.1                          | Meter reads of type - HISTORY, DELTA, and AGGREGATE |                       |                         | Stage       | Sept 08, 2022 |

The below collection covers the functionalities of

1. Developer and Organization registration

2. Login

3. Register the devices

4. List the registered devices

5. Meter reads of type - HISTORY, DELTA and AGGREGATE

6. Buyer reservation

[D-Rec STAGE.postman_collection.json](../D-Rec%20STAGE.postman_collection.json)

[STAGE API Guide](../usage_guide/stage-api-guide.md)

[D-Rec PROD.postman_collection.json](../D-Rec%20PROD.postman_collection.json)

## Prod release notes 14-jul-23

- added an environment variable containing DREC Blockchain address and using it for Issuing certificates where Buyer address will be DREC address and remove from API to accept blockchain address.

- Certificates menu for developers now shows "other devices" that does not belong to the developers as "other devices contribution".

- Time zone drop-down is updated for meter reads based on device's country.

- Updated certificate log API to return from new updated package tables and use transactionCertificateUID to do it.

- Now Showing date and time in meter reads listing according to the time zone.

- For Developer, Added Filters to Retrieve Devices Also, Added Pagination.

- External id field in the forms is now auto complete.

- Country code fields in the forms are now auto complete.

- My reservations > list > devices > now showing reservation details on the top of the device.

- selecting multiple SDG benefits now filters multiple devices containing at least one of the SDG benefits.

- Developer’s side > Devices > My devices > added filters fields if user wants to filter the list of devices based on some specific fields.

- Added pagination for my devices in developer’s side.

- Created API for listing certified devices for developers, also added pagination and filter.

- Certificates now shows meter reads date and time according to device's time zone.

  1. time zone of different countries is included.
  2. different time zone of each device is displayed when the devices are grouped from same country which have different time zones.

- Date-time format is now implemented to be like "16 May 2023 03:20" across the application wherever date-time is displayed except for some places where time is not necessary, date is displayed like: “16 May 2023”.

- Page, filter, and pagination added for certified devices for developers.

- Added UI and API for certified devices for Buyers, also added pagination and filter.

- Added null value “--” to drop down in all the filter fields across the platform and enabled filter button even if one field is selected.

- buyer’s side > add reservation> list > added an option to view all the details of the devices in a pop-up window.

- developer’s side > devices> my devices> list > added an option to view all the details of the devices in a pop-up window.

- buyer’s side> certified devices > list> per single device contribution > added an icon, when selected will show device information's in a pop-up window.

- developer’s side> certified devices > list> per single device contribution > added an icon, when selected will show device information's in a pop-up window.

## Prod release notes 11-nov-23

- Developer side> Add meter read > add read> External id field is now auto complete i.e., when we type first letters for external id then the UI is showing suggestions in the drop-down.

- Changes in buyer's side > Add reservation >Make a reservation >use filters to select Devices.

1. “Device type code” drop-down now have check boxes option like in “SDG benefits”.

2. “Off taker” drop-down now have check boxes option like in “SDG benefits”.

3. “Capacity (Kw)” is now written like “Capacity (kW).

4. list > headings > “capacity (Kw)” changed to “Capacity (kW)”.

- Changes in developer's side:

         Devices > My devices > My all devices >

1. heading is now “My Devices” instead of “My all devices”.

2. “Device type code” drop-down now have check boxes option like in “SDG benefits”.

3. “Off taker” drop-down now have check boxes option like in “SDG benefits”.

4. “Capacity (Kw)” is now written like “Capacity (kW).

5. list > headings > “capacity (Kw)” changed to “Capacity (kW)”

- Buyer side > My Reservations > Filter menu > SDG benefits > when selecting multiple filters, the list now shows multiple devices with different sdg benefits in the list.

- UI-changes in certified devices for developers:

1. “Certificates” now moved down under “meter reads” and named “Certified meter reads”.

2. developer’s side> certified devices > list> per single device contribution > added an icon which, when selected will show device information's in a pop-up window.

- buyer’s side> certified devices > list> per single device contribution > added an icon which, when selected will show device information's in a pop-up window.

- UI-added yield configuration for super-admin.

1. added a field for super admin so that they can add yield values of different countries.

2. added new component to get the yield value of country.

3. Added update field to update yield value so that super admin can update existing yield values of countries.

- in all the filter forms, selecting date ranges can now be accessible from single input box from which user must be able to select “from” and “to” date ranges.

- API/UI-added forgot password functionality:

provided a link under login bar “forgot password?” which when clicked user will navigate to recover password page where they need to enter their email address in a text box and underneath it will be a button with text “Generate New Password”.

when the user enters an email registered in the drec system and clicks “Generate New Password” button, a link to be sent to the email address provided to rest password and a message is displayed “A link have been sent to your email to reset password”.

if the email is not registered in the drec system and user clicks “Generate New Password” button then an error message should be displayed in a dialog box with text “An error has occurred, check email”.

- UPDATE- Time zone UI/API changes> developer's side > meter reads >add meter reads:

when the user is adding meter reads for a particular device, the calendar should display time and date according to the time-zone of the device and system should store date and time accordingly in the back end.

- API/UI- super admin can view users in the drec system:

- added an option in the side menu of super admin “organizations” to view he developer and buyer organization that have registered in the drec platform.

- UI- implemented proper gap between page numbers and "next" button.

- UI- removed “select read volume" from certificates filter in both developer's and buyer's side.

- API/UI-Made the changes in device register api to make some fields mandatory as they are mandatory in the I-REC device details.

made deviceType, fuel, latitude, longitude, and address to be mandatory in D-REC as they are mandatory in the I-REC device details.

- API/UI- Delete devices.

- developers are now able to delete devices from “my devices” list.

only devices that are not part of the reservation or the devices that have never been part of the reservation are able to be deleted.

- developers> implemented inviting more users to the organization.

- Added filter field needs to include “organization” so that super admin can filter devices according to organizations.

- title changed to “all devices” instead of “my devices”.

- implemented update password functionality.

- Super admin > add devices - added bulk upload option like for developers.

- Super admin > all organization > list - added one more field “number of users” under which super admin can view number of users count in the organizations.

- Super admin > all organization > list> action - added “view users” button under “action” fields which, when pressed a window should open with all the users of that organization and their roles and email addresses.

- Super admin > all organization > list> action> In the view users window, added an option to add user and delete user for that organization.

- Super admin cannot delete the organization admin, but he should be able to assign the role of organization admin to other user and then can delete the earlier organization admin.

## Release notes 6-feb-2024

- “Create Device Api” : ApiUser implementation for client validation, created an migration file to add an apiuser column at device entity, changes in create device api for client validations.

1. Implemented ApiUser in “create device api”

2. Generated migration file for adding apiId column in device entity.

3. Need to provide an organization Id of developer under apiuser in body payload.

4. query added for apiuser with organizationId and apiUserId.

- Implementation of ApiUser in the list of all devices and device by id and enabled the api to get all devices by ApiUser.

1. ApiUser implemented in get myDevices and get deviceById

2. Qury changed with orgId and apiUserId

- API USER-modification in email sending only for direct drec user- The registration api and forget password api have changed as below.

1. The ApiUsers will be able to receive mail to confirm their email .

2. The Direct Drec Users will receive the mail to confirm their email.

3. The Users of ApiUser will not receive the mail to confirm their email.

4. ApiUser validation added in forget password api.

- Api User validations for registeration, Login and forgetPassword api's to be moved into strategy files.

1. client validations are moved into strategy files.

2. Registration Api : When organization type is ApiUser without client details in headers will be registered. When organization type is not ApiUser without client details in headers will be registered as direct user by default. when organization type is not ApiUser with client details at headers will be registered as an user under ApiUser.

3. Forget password and Login api will require client details at header for ApiUsers. If user under an ApiUser attempt to to access these api’s with / without client details at header will be unauthorized. all other direct users without client at headers will be authorized.

- showing invited users also in the user list when the super admin invites a user- in invitation process ,when admin or developer or buyer invite user, we will be showing invited user in user list with status pending
  after the login of invited user, their status changes.

- Implementation of apiuser in “create reading” api:

1. Apiuser implemented in create reads api.

2. Added organizationId in measurementdto which is optional

3. bu if sometimes direct developer/ user provided organizationId it should be same as their organization in which they belongs to.

4. If apiuser, organizationId is required and it should be under the the same apiuser.

- implemented of apiuser in “Get invitations” api:

- change in reservation form for apiuser in ui: added organization filter in form to check validation of device and organization of apiuser.

- API-Implementation of ApiUser in create reservation Api:

1. Added apiuserId column at deviceGroup entity.

2. Implementated client validation.

3. Developers are unauthorized to access this api.

4. Apiuser’s buyer will be able to reserve the direct org’s devices also.. direct buyers also will be able to reserve the apiuser’s org’s devices also.

- API-Implemented ApiUser in Get reservation by id and get all ApiUser reservations:

1. Implemented apiuser at getall reservations api.

2. In getall api, Admin can list all the reservations without any params.

3. admin can filter the reservations by apiuser by providing apiuserId param.

4. admin can fileter the reservation by organization by providing organizationId param

5. admin can also list the reservations by both apiuserId and organization with all params.

6. ApiUser will get the list of all reservations under him.

7. ApiUser can list the reservations by organization.

8. All above listings are paginated and sort by reservation date in descending order.

9. Implemented apiuser in Get reservation by id api.

10. In Get api Admin can read anyone’s reservation by id.

11. Direct developer or developer in apiuser can view only the reservations of his organization’s device.

12. Buyer or buyer in apiuser can view only the reservations of his organization.

13. The param organizationId is only for ApiUser.

14. if the buyer’s organizationId provided, will be considered as apiuser’s buyer’s request.

15. if the developer’s organizationId provided, will be considered as apiuser’s developer’s request.

- super admin will be able to change module permission of a api user: added the edit action in apiuser permission list in which admin can update permission request of apiuser.

- ApiUser is implemented in all api’s listed below.

1. User/me

2. User/id

3. User/register

4. User/profile

5. User/password

6. User/reset/password(token)

7. User/confirm-email/:token

8. User/resend-confirm-email

9. User/forget-password

- UI- added “get the meter read” functionality of device in apiuser:

1. added the organization input filed in get meter read ui form

2. added header in post api service for apiuser

- implemented ApiUser in Invite user api.

- API-Get listing of issuer certificate log for api user:

1. Implemented apiuser in Get certificate-log/issuer/certifiedlogOfdevices

2. Pagination added.

3. The organizationId in query params is the Buyer’s organization of apiuser

- Implemented ApiUser at Get listings of ungrouped devices for reservation at buyer end (ungrouped/buyerreservation). The query parameter organizationId is for apiuser’s buyer.

- UI-get reservation list for apiuser in myreservation : showing apiuser’s all reservation list and added filter by organization of apiuser bases.

- UI-change in certificate log ui for apiuser: added filter option to select developer and buyer, to show all certificates

- implemented apiuser in GET reading by external id api

1. Apiuser requesting without organization Id by passing the device Id(Number) as url param

2. Apiuser can request with buyer’s organization Id by passing the device Id(Number) as url param

3. Apiuser can request with developer’s organization Id by passing the external Id as url param

4. Admin can request by passing the device Id(Number) as url param

5. Buyer can request by passing the device Id(Number) as url param

6. Developer can request by passing the external Id as url param

- UI-added meter read adding functionality in devices of apiuser: added the client in header for apiuser to add mead of device which is apiuser organization devices.

- API-implemented apiuser in device bulk upload api which creates multiple devices by uploading csv file.

- Implemented ApiUser in bulk upload job status.

- optimized certificate page as certificate api and loading was taking time.

- Api-added new field expiry date in reservation api:

1. Reservation end date will be able to be in the past from present date in drec.

2. In Drec reservation if the ‘end date’ is in the future, then we won’t use ‘expiry date’

3. if we give end date in the past from present date then, we will have “expiry date” also and it will be optional field and if it is not filled then the end date will be expiry date.

4. Expiry date only will apply for historical issuance only, so there won’t be any impact for ongoing. It is valid only if the end date of the reservation < current time

- API-export csv file of per device log which is reserved in reservation:

1. The dynamic csv file of device log is exported from backend.

2. The apiusers and buyers will be able to download the csv file locally in the name of reservation name and the date of export.

3. Request URL : [https://dev-api.drecs.org/api/certificate-log/expoert_perdevice/:GroupId](https://dev-api.drecs.org/api/certificate-log/expoert_perdevice/:GroupId)

- UI-added export action option to download csv file of perdevice log from reservation list: added new action button in reservation list to get the perdevcie log of certified devcie in reservation

- update- apiuser will be able to see only the devices that are added by that specific apiuser only:

1. An Buyer of an apiuser can list the ungrouped devices of his own apiuser only

2. An direct buyer can list the ungrouped devices of direct developer’s / device owner’s… can’t view the devices of any apiuser’s ungrouped devices.

- added Show/Hide button in login screen password box

- When a user is not logged in DREC, going to an unauthorized URL will redirect to login page.

- the UI will auto-populate default time frame for selecting meter reads, default time will be from whenever the meter reads start first in the calendar and will be for 1 month.
