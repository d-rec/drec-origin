import { OrganizationService } from '../src/pods/organization/organization.service';
import { UserService } from '../src/pods/user/user.service';
import { CreateUserORGDTO } from '../src/pods/user/dto/create-user.dto';
import { Role } from '../src/utils/enums/role.enum';
import { DeviceDTO, NewDeviceDTO } from '../src/pods/device/dto';
import {
  DevicetypeCode,
  FuelCode,
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
    status: OrganizationStatus.Active,
    blockchainAccountAddress: 'blockchainAccountAddress111',
    organizationType: 'Developer',
  },
  {
    id: 11,
    name: 'Buyer',
    address: 'Stet clita kasd gubergren',
    zipCode: 'Zip code',
    city: 'City',
    country: 'null',
    status: OrganizationStatus.Active,
    blockchainAccountAddress: 'blockchainAccountAddress222',
    organizationType: 'Buyer',
  },
  {
    id: 12,
    name: 'Admin',
    address: 'Stet clita kasd gubergren',
    zipCode: 'Zip code',
    city: 'City',
    country: 'DE',
    status: OrganizationStatus.Active,
    blockchainAccountAddress: 'blockchainAccountAddress333',
    organizationType: 'Admin',
  },
  {
    id: 13,
    name: 'Device Owner 2',
    address: 'Stet clita kasd gubergren',
    zipCode: 'Zip code',
    city: 'City',
    country: 'DE',
    status: OrganizationStatus.Active,
    blockchainAccountAddress: 'blockchainAccountAddress444',
    organizationType: 'Developer',
  },
];

export const testUsers: Omit<CreateUserORGDTO, 'organizationId'>[] = [
  {
    firstName: 'Jane',
    lastName: 'Williams',
    email: 'owner2@mailinator.com',
    password: '******123',
    organizationType: 'Developer',
  },
  {
    firstName: 'John',
    lastName: 'Buyer',
    email: 'buyer2@mailinator.com',
    password: '******123',
    organizationType: 'Buyer',
  },
  {
    firstName: 'Joe',
    lastName: 'Miller2',
    email: 'admin2@mailinator.com',
    password: '******123',
    organizationType: 'ApiUser',
  },
  {
    firstName: 'Maria',
    lastName: 'Williams',
    email: 'owner3@mailinator.com',
    password: '******123',
    organizationType: 'Developer',
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
    fuelCode: FuelCode.ES100,
    deviceTypeCode: DevicetypeCode.TC110,
    capacity: 1500,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.HealthFacility,
    yieldValue: 1000,
    impactStory: '',
    images: [],
    api_user_id: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
    developerExternalId: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
    energyStorage: true,
    energyStorageCapacity: 900,
    qualityLabels: '',
    timezone: '',
  },
  {
    externalId: 'DREC03',
    projectName: 'Device 2',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    fuelCode: FuelCode.ES100,
    deviceTypeCode: DevicetypeCode.TC110,
    capacity: 1600,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.PublicSector,
    yieldValue: 1000,
    impactStory: '',
    images: [],
    api_user_id: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
    developerExternalId: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
    energyStorage: true,
    energyStorageCapacity: 900,
    qualityLabels: '',
    timezone: '',
  },
  {
    externalId: 'DREC04',
    projectName: 'Device 3',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    fuelCode: FuelCode.ES100,
    deviceTypeCode: DevicetypeCode.TC110,
    capacity: 1750,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.Commercial,
    yieldValue: 1000,
    impactStory: '',
    images: [],
    api_user_id: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
    developerExternalId: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
    energyStorage: true,
    energyStorageCapacity: 900,
    qualityLabels: '',
    timezone: '',
  },
  {
    externalId: 'DREC05',
    projectName: 'Device 5',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    fuelCode: FuelCode.ES100,
    deviceTypeCode: DevicetypeCode.TC110,
    capacity: 1750,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.Residential,
    yieldValue: 1000,
    impactStory: '',
    images: [],
    api_user_id: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
    developerExternalId: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
    energyStorage: true,
    energyStorageCapacity: 900,
    qualityLabels: '',
    timezone: '',
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
    fuelCode: FuelCode.ES100,
    deviceTypeCode: DevicetypeCode.TC110,
    capacity: 1500,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.Industrial,
    yieldValue: 1000,
    impactStory: '',
    images: [],
    energyStorage: true,
    energyStorageCapacity: 900,
    qualityLabels: '',
    version: '1.0',
  },
  {
    externalId: 'DREC32',
    projectName: 'Device 32',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    fuelCode: FuelCode.ES100,
    deviceTypeCode: DevicetypeCode.TC110,
    capacity: 1600,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.Commercial,
    yieldValue: 1000,
    impactStory: '',
    images: [],
    energyStorage: true,
    energyStorageCapacity: 900,
    qualityLabels: '',
    version: '1.0',
  },
  {
    externalId: 'DREC33',
    projectName: 'Device 33',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    fuelCode: FuelCode.ES100,
    deviceTypeCode: DevicetypeCode.TC110,
    capacity: 1750,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.Residential,
    yieldValue: 1000,
    impactStory: '',
    images: [],
    energyStorage: true,
    energyStorageCapacity: 900,
    qualityLabels: '',
    version: '1.0',
  },
  {
    externalId: 'DREC34',
    projectName: 'Device 34',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    countryCode: 'DE',
    fuelCode: FuelCode.ES100,
    deviceTypeCode: DevicetypeCode.TC110,
    capacity: 1750,
    commissioningDate: '2012-07-01',
    gridInterconnection: true,
    offTaker: OffTaker.School,
    yieldValue: 1000,
    impactStory: '',
    images: [],
    energyStorage: true,
    energyStorageCapacity: 900,
    qualityLabels: '',
    version: '1.0',
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
    user1,
    createdOrg1.id,
    Role.DeviceOwner,
    UserStatus.Active,
  );
  await userService.seed(user2, createdOrg2.id, Role.Buyer, UserStatus.Active);
  await userService.seed(user3, createdOrg3.id, Role.Admin, UserStatus.Active);
  await userService.seed(
    user4,
    createdOrg4.id,
    Role.DeviceOwner,
    UserStatus.Active,
  );

  const [device1, device2, device3, device4] = testDevices;
  const [batchdevice1, batchdevice2, batchdevice3, batchdevice4] = batchDevices;

  await deviceService.seed(createdOrg1.id, batchdevice1);
  await deviceService.seed(createdOrg1.id, batchdevice2);
  await deviceService.seed(createdOrg4.id, batchdevice3);
  await deviceService.seed(createdOrg4.id, batchdevice4);
};
