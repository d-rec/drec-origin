export interface ISdgBenefit {
    id: number;
    SdgbenefitName: string;
    sdgbenefitdescription: string;

    sdgbenefitBitposition: number;

}

export const SDGBenefits = [

    { name: "GOAL1", value: "No Poverty" },
    { name: "GOAL2", value: "Zero Hunger" },
    { name: "GOAL3", value: "Good Health and Well-being" },
    { name: "GOAL4", value: "Quality Education" },
    { name: "GOAL5", value: "Gender Equality" },
    { name: "GOAL6", value: "Clean Water and Sanitation" },
    { name: "GOAL7", value: "Affordable and Clean Energy" },
    { name: "GOAL8", value: "Decent Work and Economic Growth" },
    { name: "GOAL9", value: "Industry, Innovation and Infrastructure" },
    { name: "GOAL10", value: "Reduced Inequality" },
    { name: "GOAL11", value: "Sustainable Cities and Communities" },
    { name: "GOAL12", value: "Responsible Consumption and Production" },
    { name: "GOAL13", value: "Climate Action" },
    { name: "GOAL14", value: "Life Below Water" },
    { name: "GOAL15", value: "Life on Land" },
    { name: "GOAL16", value: "Peace and Justice Strong Institutions" },
    { name: "GOAL17", value: "Partnerships to achieve the Goal" }
]