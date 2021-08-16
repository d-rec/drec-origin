import { LightenColor } from '../utils/colors';

const $primaryColor = '#fec30b';
const $primaryColorDark = LightenColor($primaryColor, -10);
const $primaryColorDim = '#362c45';

const $textColorDefault = '#a8a8a8';
const $simpleTextColor = '#ffffff';

const $inputAutofillColor = '#434343';

const $bodyBackgroundColor = '#2d2d2d';
const $mainBackgroundColor = '#272727';
const $fieldIconColor = LightenColor('#ffffff', -30);

const $fontFamilyPrimary = 'Montserrat';
const $fontFamilySecondary = 'Montserrat';

const $fontSize = 12;

export type DrecUiThemeVariables = {
    primaryColor: string;
    primaryColorDark: string;
    primaryColorDim: string;
    textColorDefault: string;
    inputAutofillColor: string;
    simpleTextColor: string;
    bodyBackgroundColor: string;
    mainBackgroundColor: string;
    fieldIconColor: string;
    fontFamilyPrimary: string;
    fontFamilySecondary: string;
    fontSize: number;
};

export const variables: DrecUiThemeVariables = {
    primaryColor: $primaryColor,
    primaryColorDark: $primaryColorDark,
    primaryColorDim: $primaryColorDim,
    textColorDefault: $textColorDefault,
    simpleTextColor: $simpleTextColor,
    inputAutofillColor: $inputAutofillColor,
    bodyBackgroundColor: $bodyBackgroundColor,
    mainBackgroundColor: $mainBackgroundColor,
    fieldIconColor: $fieldIconColor,
    fontFamilyPrimary: $fontFamilyPrimary,
    fontFamilySecondary: $fontFamilySecondary,
    fontSize: $fontSize
};
