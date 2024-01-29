import moment from 'moment';

export const isValidUTCDateFormat =(dateInput:string) =>{
    let dateFormateToCheck = new RegExp(/\d\d\d\d\-\d\d\-\d\dT\d\d:\d\d:\d\d\.\d{1,}Z/);
      ;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    const momentDateFormatToCheck = moment(dateInput).format(dateFormat);
  
    return dateFormateToCheck.test(dateInput) && moment(momentDateFormatToCheck, dateFormat, true).isValid();
}
