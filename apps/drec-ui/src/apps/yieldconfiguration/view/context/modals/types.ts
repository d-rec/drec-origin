import { YieldvalueModalsActionsEnum } from './reducer';

export interface IYielsValueModalsStore {
    addyieldvalue: boolean;
    allyieldvalue: boolean;
}

interface IShowYieldValueAction {
    type: YieldvalueModalsActionsEnum.SHOW_Yieldvalue_Add;
    payload: boolean;
}

interface IShowAllYieldValueAction {
    type: YieldvalueModalsActionsEnum.SHOW_Yieldvalue_All;
    payload: boolean;
}

export type TYieldValueModalsAction = IShowYieldValueAction | IShowAllYieldValueAction;
