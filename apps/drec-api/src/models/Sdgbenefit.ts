export interface ISdgBenefit {
    id: number;
    SdgbenefitName: string;
    sdgbenefitdescription: string;

    sdgbenefitBitposition: number;

}

export const SDGBenefits = [

    { name: "SDG1", value: "No Poverty" },
    { name: "SDG2", value: "Zero Hunger" },
    { name: "SDG3", value: "Good Health and Well-being" },
    { name: "SDG4", value: "Quality Education" },
    { name: "SDG5", value: "Gender Equality" },
    { name: "SDG6", value: "Clean Water and Sanitation" },
    { name: "SDG7", value: "Affordable and Clean Energy" },
    { name: "SDG8", value: "Decent Work and Economic Growth" },
    { name: "SDG9", value: "Industry, Innovation and Infrastructure" },
    { name: "SDG10", value: "Reduced Inequality" },
    { name: "SDG11", value: "Sustainable Cities and Communities" },
    { name: "SDG12", value: "Responsible Consumption and Production" },
    { name: "SDG13", value: "Climate Action" },
    { name: "SDG14", value: "Life Below Water" },
    { name: "SDG15", value: "Life on Land" },
    { name: "SDG16", value: "Peace and Justice Strong Institutions" },
    { name: "SDG17", value: "Partnerships to achieve the SDG" }
]