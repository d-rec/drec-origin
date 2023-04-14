import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ReservationService } from '../../auth//services/reservation.service';
import { Router } from '@angular/router';
import { AuthbaseService } from '../../auth/authbase.service';
@Component({
  selector: 'app-redemption-report',
  templateUrl: './redemption-report.component.html',
  styleUrls: ['./redemption-report.component.scss']
})
export class RedemptionReportComponent implements OnInit {
  data: any = [];
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
  pageSize: number = 20;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<any>;

  countrylist: any;
  fuellist: any;

  offtaker = ['School', 'HealthFacility', 'Residential', 'Commercial', 'Industrial', 'PublicSector', 'Agriculture']

  constructor(private authService: AuthbaseService, private ReservationService: ReservationService, private router: Router,) {

  }
  ngOnInit(): void {
    this.DisplayfuelList();
    this.DisplaycountryList();
    this.DisplayRedemptionList()
  }
  DisplayfuelList() {

    this.authService.GetMethod('device/fuel-type').subscribe(
      (data) => {
        // display list in the console 

        this.fuellist = data;

      }
    )
  }
  DisplaycountryList() {

    this.authService.GetMethod('countrycode/list').subscribe(
      (data) => {
        // display list in the console 
        // console.log(data)
        this.countrylist = data;

      }
    )
  }
  DisplayRedemptionList() {
    this.ReservationService.GetMethod().subscribe(
      (data) => {
        // display list in the console 
        console.log(data)
        this.data = data;
        //@ts-ignore
        this.data.forEach(ele => {
          console.log(ele.fuelCode);
          if (ele.fuelCode != '') {
            let fuelname: any = [];
            //@ts-ignore
            let f = ele.fuelCode.filter((str) => str !== ' ');
            //@ts-ignore
            f.map((aele) =>
              //@ts-ignore
              fuelname.push(this.fuellist.find((fuelType) => fuelType.code === aele.trim())?.name)
            )
            ele['fuelname'] = [...new Set(fuelname)].toString();

            //  fuelname.filter((item,index) => fuelname.indexOf(item) === index);;

          } else {
            ele['fuelname'] = '';
          }
          // @ts-ignore
          ele.country.filter((str) => str !== '');
          if (ele.country != '') {

            // @ts-ignore
            ele['countryname'] = [... new Set(ele.country.map((bele) => (this.countrylist.find(countrycode => countrycode.alpha3 === bele.trim())?.country)))].toString();

          } else {
            ele['countryname'] = '';
          }

          //@ts-ignore
          ele['claimCoiuntryCode'] = this.countrylist.find(countrycode => countrycode.alpha3 === ele.claimCoiuntryCode)?.country;
          //@ts-ignore
          // ele.offTakers.filter((str) => str !== ' ');
          //@ts-ignore
          let o = ele.offTakers.filter((str) => str !== ' ');

          console.log("result");
          console.log(o);
          //@ts-ignore
          ele['offTakername'] = [...new Set(o.map((e) => e.trim()))].toString()
          //[... new Set(ele.offTakers)].toString();

        })
        console.log(this.data);
        this.dataSource = new MatTableDataSource(this.data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    )
  }
}
