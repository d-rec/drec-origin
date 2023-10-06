import {YieldStatus } from '../utils/enums';

export interface IYieldConfig {
    id: number;
    countryName: string;
    countryCode: string;
    yieldValue: number;
    status:YieldStatus;
    
     }