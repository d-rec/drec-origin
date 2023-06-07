import { Pipe, PipeTransform } from '@angular/core';
//import { formatDate } from '@angular/common';
import * as momentTimeZone from 'moment-timezone';
@Pipe({
  name: 'timezone'
})
export class TimezonePipe implements PipeTransform {
  transform(value: any, timezone: string, format: string = 'medium'): any {

    const date = new Date(value);
    console.log(date)
    console.log(timezone)
    const formattedDate = momentTimeZone.tz(date, timezone).format(format);
    return formattedDate;
  }
}