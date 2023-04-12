import { Component, OnInit,ViewChild } from '@angular/core';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ReservationService } from '../../auth//services/reservation.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-redemption-report',
  templateUrl: './redemption-report.component.html',
  styleUrls: ['./redemption-report.component.scss']
})
export class RedemptionReportComponent implements OnInit {
data :any=[];
displayedColumns = [
  'certificateId',
  'redemptionDate',
  'certifiedEnergy',
  'compliance',
  'country',
  'fuelCode', 
  // 'commissioningDateRange',
  "beneficiary",
  "beneficiary_address",
  "claimCoiuntryCode",
  'capacityRange',
  "purpose",
  'offTakers',
  // 'sectors',
  // 'standardCompliance',
  // 'installations'
 
];
pageSize:number = 20;
@ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<any>;
constructor(private ReservationService: ReservationService, private router: Router,){

}
ngOnInit(): void {
 
  this.DisplayRedemptionList()
}
DisplayRedemptionList() {
  this.ReservationService.GetMethod().subscribe(
    (data) => {
      // display list in the console 
      console.log(data)
      this.data = data;
        //@ts-ignore
      this.data.forEach(ele => {
        //@ts-ignore
        ele['fuelname'] = this.fuellist.find((fuelType) => fuelType.code === ele.fuelCode,)?.name;
        //@ts-ignore
        ele['devicetypename'] = this.devicetypelist.find(devicetype => devicetype.code == ele.deviceTypeCode)?.name;
        //@ts-ignore
        ele['countryname'] = this.countrylist.find(countrycode => countrycode.alpha3 == ele.countryCode)?.country;
       //@ts-ignore
        ele['claimCoiuntryCode'] = this.countrylist.find(countrycode => countrycode.alpha3 == ele.claimCoiuntryCode)?.country;
      })
      this.dataSource = new MatTableDataSource(this.data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  )
}
}
