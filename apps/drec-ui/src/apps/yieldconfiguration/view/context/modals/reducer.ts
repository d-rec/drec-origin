import { IYielsValueModalsStore, TYieldValueModalsAction } from './types';

export enum YieldvalueModalsActionsEnum {
    SHOW_Yieldvalue_Add = 'SHOW_Yieldvalue_Add',
    SHOW_Yieldvalue_All = 'SHOW_Yieldvalue_All'
}
export const yieldvalueModalsInitialState: IYielsValueModalsStore = {
    addyieldvalue: false,
    allyieldvalue: false
};

export const yieldvalueModalsReducer = (
    state = yieldvalueModalsInitialState,
    action: TYieldValueModalsAction
): IYielsValueModalsStore => {
    switch (action.type) {
        case YieldvalueModalsActionsEnum.SHOW_Yieldvalue_Add:
            return { ...state, addyieldvalue: action.payload };

        case YieldvalueModalsActionsEnum.SHOW_Yieldvalue_All:
            return { ...state, allyieldvalue: action.payload };
    }
};