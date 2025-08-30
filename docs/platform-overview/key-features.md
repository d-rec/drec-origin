---
order: 2
---

# Key Features

<br/>
<YouTubeEmbed video-id="7_RHBYSVpL4" />

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

## Verification Mechanism

The D-REC Platform verifies generation data through an algorithm that calculates a theoretical maximum output based on various parameters, such as the system's nameplate size, projected performance degradation, validation time period, solar yield, and a maximum scaler value. This process ensures that the data submitted is within a plausible range, enhancing its accuracy and reliability for I-REC issuance.

The platform currently verifies generation data only. When generation data is submitted to the D-REC Platform, it is compared against a theoretical maximum output. That output right now is given by the following equation:

$$
kWh_{max} = kWp_{nameplate} \times (1 - \mu)^{(a - 1)} \times t \times \left(\frac{kWh/kWp}{\eta}\right) \times \beta
$$

Where:

| Symbol                | Description                                                                             |
| --------------------- | --------------------------------------------------------------------------------------- |
| **$kWh_{max}$**       | Theoretical maximum output (in kWh) over the validation period                          |
| **$kWp_{nameplate}$** | System's nameplate capacity (in kWp)                                                    |
| **$\mu$**             | Annual performance degradation rate (**0.5%**)                                          |
| **$a$**               | Age of the DRE device in years, based on commissioning date (defaults to **1**)         |
| **$t$**               | Validation time period in hours                                                         |
| **${kWh/kWp}$**       | Solar yield for the system's location (currently determined on a **per-country** basis) |
| **$\eta$**            | Total number of hours in a year (**8760hrs**)                                           |
| **$\beta$**           | Maximum scaler (currently set to **120%**)                                              |

## Reservations

The reservations feature is designed for corporate buyers to link their energy consumption commitments with specific devices. Buyers can reserve devices by specifying key attributes such as target power output, operational start and end dates, and update frequencies. Once reserved, devices are locked to that reservation, ensuring that energy certificates are issued only for devices that meet the buyer’s energy production targets. This structured approach helps buyers manage their energy portfolios effectively.

## D-RECs Token

This feature converts reserved energy into digital tokens that act as certificates of energy production. Tokens are generated based on the energy outputs of reserved devices and include key production details such as issuance dates and volume. The system continuously monitors the energy production to ensure tokens are issued until the set energy targets are met, providing a transparent and verifiable record of certified energy output.

## Supported Device Types

**Eligible device types**, as defined by the I-TRACK Standard Foundation, fall under two main categories: **grid-connected** (captive consumption) assets and **off-grid systems**.

### Grid-Connected (Captive Consumption) Assets

- Behind-the-meter solar PV systems with a local off-taker (e.g., residential, commercial, or industrial installations).
- Grid-connected systems with export capabilities (where explicitly allowed).
- Certified generation must currently be used primarily on-site or directly offset local consumption. It must not be traded in competitive electricity markets.
- Future exceptions—such as controlled and transparent mechanisms that prevent double counting or conflicts with other Environmental Attribute Certificates (EACs)—may be introduced, subject to approval by the I-TRACK Foundation.

### Off-Grid Systems

- Solar Home Systems (SHS)
- Mini-Grids and Micro-Grids
- Solar Irrigation Pumps
- Standalone Battery-Integrated Solar Systems
- Commercial & Industrial (C&I) Rooftop Solar (≤250 kW)
- Other emerging off-grid applications (e.g., solar-powered cooling, desalination, telecom infrastructure) may be added as the D-REC ecosystem evolves.

### Key Requirements for Eligibility

- **Capacity Limitation**: Devices must be **≤250kWh**. Larger systems require direct registration with an Issuer.
- **Metered Data Availability**: Devices must provide verifiable generation data through smart meters, inverters, charge controllers, or other monitoring systems capable of periodic reporting.
- **Grid Connection Types**: Eligible systems include off-grid, captive consumption, and grid-tied assets, provided they meet data validation requirements.
- **Standards Compliance**: Devices must satisfy the eligibility criteria established by the I-TRACK Standard Foundation. To date, demonstrated projects within the D-REC framework primarily include solar PV systems ≤250 kW.
- **Energy Source**: Solar energy is currently the only technology type approved and demonstrated within the D-REC ecosystem.
