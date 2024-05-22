import moment from 'moment';

export const isValidUTCDateFormat = (dateInput: string) => {
  const dateFormateToCheck = new RegExp(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z/,
  );
  const dateFormat = 'YYYY-MM-DDTHH:mm:ssZ';
  const momentDateFormatToCheck = moment(dateInput).format(dateFormat);

  return (
    dateFormateToCheck.test(dateInput) &&
    moment(momentDateFormatToCheck, dateFormat, true).isValid()
  );
};
