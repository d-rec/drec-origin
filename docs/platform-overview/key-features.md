---
order: 2
---

# Key Features

This a summary of the features that are currently supported by the D-REC platform. Each feature area is described in detail, explaining the functionality and benefits offered by the platform.

## User & Organization Management

This feature enables organizations to set up and manage their teams on the platform. It supports the structured creation of organizations and facilitates the assignment of permissions and roles. This ensures that team members have the appropriate access to the tools required for managing their operations and maintaining accurate records.

## Yield Configuration

Yield configuration allows administrators to define country-specific yield values that serve as benchmarks for energy production. These values are essential for validating meter readings against device capacities, ensuring that the energy production data is accurate and aligns with expected performance standards.

## Device Management

Device management is designed for developers to register, view, and update energy generation devices on the platform. Key functionalities include:

- **Device Registration:**  
  Developers can register devices by providing detailed information such as the device name, type, location, commissioning date, and relevant technical codes. This sets the foundation for tracking energy production.

- **Bulk Device Upload:**  
  For large-scale deployments, the platform supports the bulk upload of device data via CSV files, streamlining the onboarding process.

- **Device View and Filtering:**  
  The platform offers robust viewing and filtering capabilities, allowing users to quickly locate devices based on specific attributes. This facilitates easier management and monitoring of device performance.

- **Device Editing:**  
  Devices can be updated as needed to ensure that all records remain accurate over time.

## Meter Reads

Meter reads are critical for capturing accurate energy production data. The platform supports multiple types of meter readings to suit various operational needs:

- **Historical Reads:**  
  Enable the entry of back-dated energy data over a defined period. The system validates that the data falls within acceptable timeframes relative to the device's commissioning date and capacity.

- **Aggregate Reads:**  
  Record the current cumulative energy output from a device. These readings are processed in the backend to derive the values used for generating energy certificates.

- **Delta Reads:**  
  Allow developers to enter pre-calculated energy production values. The system validates these entries to ensure consistency with the device’s capacity and the relevant operational timeframes.

These reading types ensure that energy data is collected accurately and consistently, forming the basis for reliable certification.

## Reservations

The reservations feature is designed for corporate buyers to link their energy consumption commitments with specific devices. Buyers can reserve devices by specifying key attributes such as target power output, operational start and end dates, and update frequencies. Once reserved, devices are locked to that reservation, ensuring that energy certificates are issued only for devices that meet the buyer’s energy production targets. This structured approach helps buyers manage their energy portfolios effectively.


## D-RECs Token

This feature converts reserved energy into digital tokens that act as certificates of energy production. Tokens are generated based on the energy outputs of reserved devices and include key production details such as issuance dates and volume. The system continuously monitors the energy production to ensure tokens are issued until the set energy targets are met, providing a transparent and verifiable record of certified energy output.