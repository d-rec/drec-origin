---
order: 2
---

# Key Features

This a summary of the features that are currently supported by the D-REC platform. Each feature area is described in detail, explaining the functionality and benefits offered by the platform.

## User & Organization Management

The platform enables organizations to register themselves and manage their users. Organizations can register by providing essential details such as the organization type, name, and address. In addition, organization administrators can invite new users to join their organization. Invited users receive an email invitation that guides them through the registration process.

Administrators are also empowered to assign and manage user permissions within the organization, ensuring that each user has appropriate access to platform functionalities. Users can verify their email addresses through links sent in verification emails, and they can reset or change their passwords using the “forgot password” feature available on the landing page. This integrated user management system ensures that all participants have a secure and controlled experience on the platform.

## Device Management

Device management features provide developers with the tools needed to register, view, and update device information. Developers can register individual devices by entering detailed information such as the device name, type, country, address, GPS coordinates, commissioning date, role, fuel code, and even associated SDG benefits. For large-scale deployments, the platform also supports the bulk upload of device data through CSV files, streamlining the registration process.

Once devices are registered, the platform offers comprehensive viewing and filtering capabilities. Users can easily search for devices based on attributes such as country code, device type, or off-taker, ensuring quick access to specific information. Additionally, device information is fully editable, allowing developers to update device details as needed to maintain accurate records over time.

## Meter Reads

Accurate recording of energy production is critical, and the platform supports multiple types of meter reads to suit different data collection needs. Developers can add meter reads for their devices by supplying the external device ID, selecting the type of reading (History, Delta, or Aggregate), specifying the unit of measurement (Wh, kWh, MWh, or GWh), and providing the actual meter reading values.

- **Historical Reads:** For historical readings, the platform requires both a start and an end datetime. Historical data is validated to ensure:
  - The data does not predate the device’s commissioning date.
  - The power readings do not exceed the device’s capacity.
  - Only data within a three-year window is accepted for certification.
  - Meter read values must be non-negative.

- **Aggregate Reads:** Aggregate readings represent the current cumulative energy values from a device. These readings are processed in the backend to derive Delta readings used for certificate generation. Developers can submit aggregate readings on a daily, weekly, or monthly basis.  
  > **Note:** The initial reading type (aggregate) is fixed and cannot be switched to another type.

- **Delta Reads:** Delta readings are pre-calculated values provided by the developer for certification purposes. The system validates these readings against device capacity and ensures that the end timestamp is appropriate. Once a reading is entered as Delta, it remains fixed as that type.


## Reservations

For corporate buyers, the platform provides robust reservation features to link energy consumption requirements with specific devices. Buyers can reserve devices by associating reservations with device external IDs, and multiple devices can be reserved simultaneously to meet purchase needs. Each reservation includes detailed attributes such as the target power output, start and end dates, expiration date, and the frequency of reservation updates.

Once a device is reserved, it is locked to that reservation and remains unavailable for additional reservations until the current one expires. This mechanism ensures that energy certificates are issued only for devices that are actively reserved by a buyer. Furthermore, buyers can view and filter their reservations based on various criteria, such as reservation name or status, enabling easy tracking and management of their energy purchase commitments.

## D-RECs Token

The token management features of the platform allow corporate buyers to convert their reserved energy into tokens, which serve as digital certificates of energy production. Tokens are generated based on the buyer reservations and include key details such as issuance dates and the volume of energy produced. The system continuously monitors the power output of reserved devices, issuing tokens at regular intervals until the energy production target is met.

Users can view the tokens, which appear as certificates containing all relevant production details. Although advanced filtering for tokens is under development, the current token view offers a comprehensive snapshot of the certified energy production, ensuring transparency and traceability in the certification process.


