import { LightenColor } from '../utils/colors';

const $primaryColor = '#fec30b';
const $primaryColorDark = LightenColor($primaryColor, -10);
const $primaryColorDim = '#ab8200';

const $textColorDefault = '#2D1155';
const $simpleTextColor = '#000000';

const $inputAutofillColor = '#cecece';

const $bodyBackgroundColor = '#F6F3F9';
const $mainBackgroundColor = '#ffffff';
const $fieldIconColor = LightenColor('#000000', -30);

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
