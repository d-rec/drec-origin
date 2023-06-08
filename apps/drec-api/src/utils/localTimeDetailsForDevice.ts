import * as mapBoxTimeSpace from '@mapbox/timespace';
import * as momentTimeZone from 'moment-timezone';
import { countryCodesList } from '../models/country-code';
import { CountryCodeNameDTO } from '../pods/countrycode/dto'



export const getLocalTime = (startDate, device) => {
  let point = [parseFloat(device.longitude), parseFloat(device.latitude)];
  console.log("latitude is::::" + device.latitude);
  console.log("longitue is:::" + device.longitude);
  console.log("point is:::" + point);
  let timestamp = new Date(startDate);
  let localTime = mapBoxTimeSpace.getFuzzyLocalTimeFromPoint(timestamp, point).startOf('day');
  console.log("localTime Time: " + localTime.utc().format());
  return localTime;

}



export const getLocalTimeZoneFromDevice = (localTime, device) => {
  if (device.timezone) {
    console.log("timezone is there")
    console.log("DEVICE TIMEZONE BEING RETURNED:" + device.timezone);
    return device.timezone;
  }
  else if (device.longitude && device.latitude && localTime) {
    try {
      console.log("lat and long are there");
      var timestamp = new Date(localTime);
      const point = [parseFloat(device.longitude), parseFloat(device.latitude)];
      let time = mapBoxTimeSpace.getFuzzyLocalTimeFromPoint(timestamp, point);
      console.log("TIME:::::::::::::::::" + time);
      const actualTimeZone = momentTimeZone.tz.names().find((timezone) => {
        if (momentTimeZone.tz(timezone).zoneAbbr() == time.zoneAbbr()) {
          console.log("TIMEZONE THAT's BEING RETURNED:::" + timezone);
          return timezone;
        }
      });
      return actualTimeZone;
    }
    catch {

      const countryCodeFound: CountryCodeNameDTO = countryCodesList.find(entry => entry.countryCode === device.countryCode);
      console.log("counrtycode obj keys that were found:::::::::::" + Object.keys(countryCodeFound.timezones[0]));

      console.log("countrycode obj found:::::" + JSON.stringify(countryCodeFound.timezones[0]));
      console.log("countrycode obj to be returned::::;" + countryCodeFound.timezones[0].name)
      return countryCodeFound.timezones[0].name;
    }
  }
  else {
    console.log("only country code")
    const countryCodeFound: CountryCodeNameDTO = countryCodesList.find(entry => entry.countryCode === device.countryCode);
    console.log("counrtycode obj keys that were found:::::::::::" + Object.keys(countryCodeFound.timezones[0]));
    console.log("countrycode obj found:::::" + JSON.stringify(countryCodeFound.timezones[0]));
    console.log("countrycode obj to be returned::::;" + countryCodeFound.timezones[0].name)
    return countryCodeFound.timezones[0].name;
  }
}

export const getOffsetFromTimeZoneName = (givenTimeZone) => {
  console.log("given timezone::::::::;;" + givenTimeZone);
  let matchingTimezone;
  for (let i = 0; i < countryCodesList.length; i++) {
    const elementTimeZone = countryCodesList[i].timezones;
    for (let j = 0; j < elementTimeZone.length; j++) {
      if (elementTimeZone[j].name === givenTimeZone) {
        console.log("FOUND A MATCHING TIMEZONE IN THE LOOPS::::" + elementTimeZone[j].name)
        matchingTimezone = elementTimeZone[j];
        break;
      }
      else {
        continue;
      }
    }
  }

  console.log("matching timezone object::::::;" + matchingTimezone);
  console.log("matching timezone name:::::::" + matchingTimezone.name);
  const offset = matchingTimezone.offset
  console.log("matching OFFSET:::::::" + offset);
  return offset;

}





export const getFormattedOffSetFromOffsetAsJson = (givenOffSet) => {

  console.log("given offset:::" + givenOffSet);

  let hours = Math.floor((Math.abs(givenOffSet)) / 60);

  let minutes = Math.abs(givenOffSet % 60);

  if (givenOffSet < 0) {

    hours = -1 * hours;

  }

  console.log("OFFSET hours FROM UTILS FUNCTOIN" + hours);

  console.log("OFFSET hours FROM UTILS FUNCTOIN" + minutes);


  const formattedJson = {

    "hours": hours,

    "minutes": minutes

  };

  return formattedJson;

}

