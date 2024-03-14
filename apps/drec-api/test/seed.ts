import { OrganizationService } from '../src/pods/organization/organization.service';
import { UserService } from '../src/pods/user/user.service';
// @ts-ignore ts(2305)
import { CreateUserDTO } from '../src/pods/user/dto/create-user.dto';
import { Role } from '../src/utils/enums/role.enum';
import { DeviceDTO, NewDeviceDTO } from '../src/pods/device/dto';
import {
  Installation,
  OffTaker,
  OrganizationStatus,
  Sector,
  StandardCompliance,
  UserStatus,
} from '../src/utils/enums';
import { DeviceService } from '../src/pods/device/device.service';
import { OrganizationDTO } from '../src/pods/organization/dto';

export const testOrgs: OrganizationDTO[] = [
  {
    id: 10,
    name: 'Device Owner',
    address: 'Stet clita kasd gubergren',
    zipCode: 'Zip code',
    city: 'City',
    country: 'DE',
    // @ts-ignore ts(2353)
    businessType: 'Issuer',
    tradeRegistryCompanyNumber: '987654321',
    vatNumber: 'DE1000',
    status: OrganizationStatus.Active,
    blockchainAccountAddress: 'blockchainAccountAddress111',
    signatoryFullName: 'Jane Williams',
    signatoryAddress: 'Address',
    signatoryZipCode: 'Zip Code',
    signatoryCity: 'City',
    signatoryCountry: 'DE',
    signatoryEmail: 'owner2@mailinator.com',
    signatoryPhoneNumber: 'Phone number',
  },
  {
    id: 11,
    name: 'Buyer',
    address: 'Stet clita kasd gubergren',
    zipCode: 'Zip code',
    city: 'City',
    country: 'null',
    // @ts-ignore ts(2353)
    businessType: 'Issuer',
    tradeRegistryCompanyNumber: '987654321',
    vatNumber: 'DE1000',
    status: OrganizationStatus.Active,
    blockchainAccountAddress: 'blockchainAccountAddress222',
    signatoryFullName: 'John Smith',
    signatoryAddress: 'Address',
    signatoryZipCode: 'Zip Code',
    signatoryCity: 'City',
    signatoryCountry: 'DE',
    signatoryEmail: 'buyer2@mailinator.com',
    signatoryPhoneNumber: 'Phone number',
  },
  {
    id: 12,
    name: 'Admin',
    address: 'Stet clita kasd gubergren',
    zipCode: 'Zip code',
    city: 'City',
    country: 'DE',
    // @ts-ignore ts(2353)
    businessType: 'Issuer',
    tradeRegistryCompanyNumber: '987654321',
    vatNumber: 'DE1000',
    status: OrganizationStatus.Active,
    blockchainAccountAddress: 'blockchainAccountAddress333',
    signatoryFullName: 'Jane Doe',
    signatoryAddress: 'Address',
    signatoryZipCode: 'Zip Code',
    signatoryCity: 'City',
    signatoryCountry: 'DE',
    signatoryEmail: 'admin2@mailinator.com',
    signatoryPhoneNumber: 'Phone number',
  },
  {
    id: 13,
    name: 'Device Owner 2',
    address: 'Stet clita kasd gubergren',
    zipCode: 'Zip code',
    city: 'City',
    country: 'DE',
    // @ts-ignore ts(2353)
    businessType: 'Issuer',
    tradeRegistryCompanyNumber: '987654321',
    vatNumber: 'DE1000',
    status: OrganizationStatus.Active,
    blockchainAccountAddress: 'blockchainAccountAddress444',
    signatoryFullName: 'Maria Robbins',
    signatoryAddress: 'Address',
    signatoryZipCode: 'Zip Code',
    signatoryCity: 'City',
    signatoryCountry: 'DE',
    signatoryEmail: 'owner3@mailinator.com',
    signatoryPhoneNumber: 'Phone number',
  },
];

export const testUsers: Omit<CreateUserDTO, 'organizationId'>[] = [
  {
    title: 'Mrs',
    firstName: 'Jane',
    lastName: 'Williams',
    email: 'owner2@mailinator.com',
    telephone: 'telephone',
    password: '******123',
  },
  {
    title: 'Mr',
    firstName: 'John',
    lastName: 'Buyer',
    email: 'buyer2@mailinator.com',
    telephone: 'telephone',
    password: '******123',
  },
  {
    title: 'Mr',
    firstName: 'Joe',
    lastName: 'Miller2',
    email: 'admin2@mailinator.com',
    telephone: 'telephone',
    password: '******123',
  },
  {
    title: 'Mrs',
    firstName: 'Maria',
    lastName: 'Williams',
    email: 'owner3@mailinator.com',
    telephone: 'telephone',
    password: '******123',
  },
];

const testDevices: Omit<DeviceDTO, 'id' | 'status' | 'organizationId'>[] = [
  {
    externalId: 'DREC02',
    projectName: 'Device 1',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    zipCode: '111111',
    // @ts-ignore ts(2322)
    fuelCode: 'ES200',
    // @ts-ignore ts(2322)
    deviceTypeCode: 'T020001',
    installationConfiguration: Installation.StandAlone,
    capacity: 1500,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.HealthFacility,
    sector: Sector.Agriculture,
    standardCompliance: StandardCompliance.REC,
    yieldValue: 1000,
    generatorsIds: [],
    labels: '',
    impactStory: '',
    data: '',
    images: [],
  },
  {
    externalId: 'DREC03',
    projectName: 'Device 2',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    zipCode: '111111',
    // @ts-ignore ts(2322)
    fuelCode: 'ES200',
    // @ts-ignore ts(2322)
    deviceTypeCode: 'TC110',
    installationConfiguration: Installation.StandAlone,
    capacity: 1600,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.PublicSector,
    sector: Sector.Education,
    standardCompliance: StandardCompliance.REC,
    yieldValue: 1000,
    generatorsIds: [],
    labels: '',
    impactStory: '',
    data: '',
    images: [],
  },
  {
    externalId: 'DREC04',
    projectName: 'Device 3',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    zipCode: '111111',
    // @ts-ignore ts(2322)
    fuelCode: 'ES200',
    // @ts-ignore ts(2322)
    deviceTypeCode: 'TC110',
    installationConfiguration: Installation.StandAlone,
    capacity: 1750,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.Commercial,
    sector: Sector.PublicServices,
    standardCompliance: StandardCompliance.REC,
    yieldValue: 1000,
    generatorsIds: [],
    labels: '',
    impactStory: '',
    data: '',
    images: [],
  },
  {
    externalId: 'DREC05',
    projectName: 'Device 5',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    zipCode: '111111',
    // @ts-ignore ts(2322)
    fuelCode: 'ES200',
    // @ts-ignore ts(2322)
    deviceTypeCode: 'TC110',
    installationConfiguration: Installation.StandAlone,
    capacity: 1750,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.Residential,
    sector: Sector.Health,
    standardCompliance: StandardCompliance.REC,
    yieldValue: 1000,
    generatorsIds: [],
    labels: '',
    impactStory: '',
    data: '',
    images: [],
  },
];

export const batchDevices: NewDeviceDTO[] = [
  {
    externalId: 'DREC31',
    projectName: 'Device 31',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    zipCode: '111111',
    // @ts-ignore ts(2322)
    fuelCode: 'ES200',
    // @ts-ignore ts(2322)
    deviceTypeCode: 'T020001',
    installationConfiguration: Installation.StandAlone,
    capacity: 1500,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.Industrial,
    sector: Sector.Agriculture,
    standardCompliance: StandardCompliance.REC,
    yieldValue: 1000,
    generatorsIds: [],
    labels: '',
    impactStory: '',
    data: '',
    images: [],
  },
  {
    externalId: 'DREC32',
    projectName: 'Device 32',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    zipCode: '111111',
    // @ts-ignore ts(2322)
    fuelCode: 'ES200',
    // @ts-ignore ts(2322)
    deviceTypeCode: 'TC110',
    installationConfiguration: Installation.StandAlone,
    capacity: 1600,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.Commercial,
    sector: Sector.Manufacturing,
    standardCompliance: StandardCompliance.REC,
    yieldValue: 1000,
    generatorsIds: [],
    labels: '',
    impactStory: '',
    data: '',
    images: [],
  },
  {
    externalId: 'DREC33',
    projectName: 'Device 33',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    zipCode: '111111',
    // @ts-ignore ts(2322)
    fuelCode: 'ES200',
    // @ts-ignore ts(2322)
    deviceTypeCode: 'TC110',
    installationConfiguration: Installation.StandAlone,
    capacity: 1750,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.Residential,
    sector: Sector.Financial,
    standardCompliance: StandardCompliance.REC,
    yieldValue: 1000,
    generatorsIds: [],
    labels: '',
    impactStory: '',
    data: '',
    images: [],
  },
  {
    externalId: 'DREC34',
    projectName: 'Device 34',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    zipCode: '111111',
    // @ts-ignore ts(2322)
    fuelCode: 'ES200',
    // @ts-ignore ts(2322)
    deviceTypeCode: 'TC110',
    installationConfiguration: Installation.StandAlone,
    capacity: 1750,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.School,
    sector: Sector.Education,
    standardCompliance: StandardCompliance.REC,
    yieldValue: 1000,
    generatorsIds: [],
    labels: '',
    impactStory: '',
    data: '',
    images: [],
  },
];

export type Services = {
  userService: UserService;
  organizationService: OrganizationService;
  deviceService: DeviceService;
};

export const seed = async ({
  userService,
  organizationService,
  deviceService,
}: Services): Promise<void> => {
  const [org1, org2, org3, org4] = testOrgs;

  const createdOrg1 = await organizationService.seed(org1);
  const createdOrg2 = await organizationService.seed(org2);
  const createdOrg3 = await organizationService.seed(org3);
  const createdOrg4 = await organizationService.seed(org4);

  const [user1, user2, user3, user4] = testUsers;

  await userService.seed(
    // @ts-ignore ts(2345)
    user1,
    createdOrg1.id,
    Role.DeviceOwner,
    UserStatus.Active,
  );
  await userService.seed(
    // @ts-ignore ts(2345)
    user2,
    createdOrg2.id,
    Role.Buyer,
    UserStatus.Active,
  );
  await userService.seed(
    // @ts-ignore ts(2345)
    user3,
    createdOrg3.id,
    Role.Admin,
    UserStatus.Active,
  );
  await userService.seed(
    // @ts-ignore ts(2345)
    user4,
    createdOrg4.id,
    Role.DeviceOwner,
    UserStatus.Active,
  );

  const [device1, device2, device3, device4] = testDevices;

  // @ts-ignore ts(2345)
  await deviceService.seed(createdOrg1.id, device1);
  // @ts-ignore ts(2345)
  await deviceService.seed(createdOrg1.id, device3);
  // @ts-ignore ts(2345)
  await deviceService.seed(createdOrg4.id, device2);
  // @ts-ignore ts(2345)
  await deviceService.seed(createdOrg4.id, device4);
};
