import { OrganizationService } from '../src/pods/organization';
import { UserService } from '../src/pods/user/user.service';
import { CreateUserDTO } from '../src/pods/user/dto/create-user.dto';
import { Role } from '../src/utils/eums/role.enum';
import { DeviceDTO } from '../src/pods/device/dto';
import { Installation, OffTaker, Sector } from '../src/utils/eums';
import { DeviceService } from '../src/pods/device/device.service';

export const testOrgs = [
  {
    code: 'D0012',
    name: 'Device Owner',
    address: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr',
    primaryContact: 'Jane Williams',
    telephone: '81-3-6889-2713',
    email: 'owner2@mailinator.com',
    regNumber: '123456789',
    vatNumber: '123456789',
    regAddress: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr',
    country: 'DE',
    blockchainAccountAddress: 'blockchainAccountAddress111',
    role: Role.DeviceOwner,
  },
  {
    code: 'B0012',
    name: 'Buyer',
    address: 'no sea takimata sanctus est Lorem ipsum dolor sit amet',
    primaryContact: 'John Smith',
    telephone: '11111',
    email: 'buyer2@mailinator.com',
    regNumber: '1234562789',
    vatNumber: '1234562789',
    regAddress: 'no sea takimata sanctus est Lorem ipsum dolor sit amet',
    country: 'DE',
    blockchainAccountAddress: 'blockchainAccountAddress222',
    role: Role.Buyer,
  },
  {
    code: 'A0012',
    name: 'Admin',
    address: 'Stet clita kasd gubergren',
    primaryContact: 'Jane Doe',
    telephone: '11111',
    email: 'admin2@mailinator.com',
    regNumber: '987654321',
    vatNumber: '987654321',
    regAddress: 'Stet clita kasd gubergren',
    country: 'DE',
    blockchainAccountAddress: 'blockchainAccountAddress333',
    role: Role.Admin,
  },
];

export const testUsers: CreateUserDTO[] = [
  {
    username: 'JaneWilliams',
    email: 'owner2@mailinator.com',
    password: 'test',
    organizationId: 'D0012',
  },
  {
    username: 'JohnlastName',
    email: 'buyer2@mailinator.com',
    password: 'test',
    organizationId: 'B0012',
  },
  {
    username: 'JoeMiller2',
    email: 'admin2@mailinator.com',
    password: 'test',
    organizationId: 'A0012',
  },
];

const testDevices: Omit<DeviceDTO, 'status'>[] = [
  {
    id: 2,
    registrant_organisation_code: 'D0012',
    project_name: 'Device 1',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    fuel_code: 'ES100',
    device_type_code: 'TC110',
    installation_configuration: Installation.StandAlone,
    capacity: '1500',
    commissioning_date: '2012-07-01',
    grid_interconnection: true,
    off_taker: OffTaker.Commercial,
    sector: Sector.Agriculture,
    standard_compliance: '',
    generators_ids: [],
    labels: '',
    impact_story: '',
    data: '',
    images: [],
  },
  {
    id: 3,
    registrant_organisation_code: 'D0012',
    project_name: 'Device 2',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    fuel_code: 'ES100',
    device_type_code: 'TC110',
    installation_configuration: Installation.StandAlone,
    capacity: '1600',
    commissioning_date: '2012-07-01',
    grid_interconnection: true,
    off_taker: OffTaker.Commercial,
    sector: Sector.Agriculture,
    standard_compliance: '',
    generators_ids: [],
    labels: '',
    impact_story: '',
    data: '',
    images: [],
  },
  {
    id: 4,
    registrant_organisation_code: 'D0012',
    project_name: 'Device 3',
    address: 'Somewhere far away',
    latitude: '34.921213',
    longitude: '135.717309',
    fuel_code: 'ES100',
    device_type_code: 'TC110',
    installation_configuration: Installation.StandAlone,
    capacity: '1750',
    commissioning_date: '2012-07-01',
    grid_interconnection: true,
    off_taker: OffTaker.Commercial,
    sector: Sector.Agriculture,
    standard_compliance: '',
    generators_ids: [],
    labels: '',
    impact_story: '',
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
}: Services) => {
  const [user1, user2, user3] = testUsers;

  await userService.seed(user1);
  await userService.seed(user2);
  await userService.seed(user3);

  const [org1, org2, org3] = testOrgs;

  await organizationService.seed(org1);
  await organizationService.seed(org2);
  await organizationService.seed(org3);

  const [device1, device2, device3] = testDevices;

  await deviceService.seed(device1);
  await deviceService.seed(device2);
  await deviceService.seed(device3);
};
