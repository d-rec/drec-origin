import { CodeNameDTO } from '../pods/device/dto/code-name.dto';

export const IREC_FUEL_TYPES: CodeNameDTO[] = [
  { code: 'ES100', name: 'Solar' },

  // {
  //   code: 'ES990',
  //   name: 'Co-fired with fossil: Solar thermal concentration',
  // }
];

export const IREC_DEVICE_TYPES: CodeNameDTO[] = [
  { code: 'TC110', name: 'PV Ground mounted' },
  {
    code: 'TC120',
    name: 'PV Roof Mounted (single installation)',
  },
  { code: 'TC130', name: 'PV Floating' },
  { code: 'TC140', name: 'PV Aggregated' },
  { code: 'TC150', name: 'Solar Thermal Concentration' },
];
