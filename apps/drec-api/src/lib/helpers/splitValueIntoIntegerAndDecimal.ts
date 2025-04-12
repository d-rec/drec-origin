

/**
   * Rounds a decimal number to a fixed precision (2 decimal places)
   * 
   * @param num - The decimal value to round
   * @returns The rounded decimal value
   */
export const roundDecimalToFixedPrecision = (num: number): number => {
    
    // Return early for zero
    if (num === 0) {
      return 0;
    }
    
    // Fixed precision of 2 decimal places
    const PRECISION = 2;
    const MULTIPLIER = 10 ** PRECISION;
    
    // Round to specified precision
    return Math.round(num * MULTIPLIER) / MULTIPLIER;
  }

  
/**
 * Separates a number into its integer and decimal components
 * 
 * @param num - The number to separate
 * @returns Object containing integer and decimal parts
 */
export const splitValueIntoIntegerAndDecimal = (num: number): {
    integralVal: number;
    decimalVal: number;
  } => {

    // Handle zero or falsy values
    if (num === 0 || !num) {
      return { integralVal: 0, decimalVal: 0 };
    }
    
    // Extract integral part
    const integralVal = Math.floor(num);
    
    // Extract and round decimal part
    const decimalVal = roundDecimalToFixedPrecision(num - integralVal);
    
    return { integralVal, decimalVal };
  }