import { CodeNameDTO } from '../pods/device/dto/code-name.dto';

export const IREC_FUEL_TYPES: CodeNameDTO[] = [

  { code: 'ES100', name: 'Solar' },

  {
    code: 'ES990',
    name: 'Co-fired with fossil: Solar thermal concentration',
  }
  
];

export const IREC_DEVICE_TYPES: CodeNameDTO[] = [
  { code: 'TC150', name: 'Solar Thermal Concentration' }
 
];
