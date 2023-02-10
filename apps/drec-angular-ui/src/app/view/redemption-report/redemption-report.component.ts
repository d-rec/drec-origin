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
data :any=[
  {
    "id": 377,
    "deviceId": "442",
    "generationStartTime": 1664233200,
    "generationEndTime": 1664409600,
    "creationTime": 1670233440,
    "metadata": "{\"buyerReservationId\":\"a4h2f534-c48a-4b57-b6a7-63ab3972909b\",\"isStandardIssuanceRequested\":\"REC\",\"isStandardIssued\":false,\"type\":\"Carbon Credit\",\"deviceIds\":[13,44],\"groupId\":\"442\"}",
    "owners": {
      "0x410CB6672F7ebE397F866fC2CE1020cB18Ac6C5F": "0"
    },
    "claimers": {
      "0x410CB6672F7ebE397F866fC2CE1020cB18Ac6C5F": "3464000"
    },
    "claims": [
      {
        "id": 377,
        "from": "0x410CB6672F7ebE397F866fC2CE1020cB18Ac6C5F",
        "to": "0x410CB6672F7ebE397F866fC2CE1020cB18Ac6C5F",
        "topic": "1",
        "value": "3464000",
        "claimData": {
          "beneficiary": "Netflix HQ",
          "location": "Netflix california",
          "countryCode": "USD",
          "periodStartDate": "2022-09-26T23:00:00.000Z",
          "periodEndDate": "2022-09-29T00:00:00.000Z",
          "purpose": "claiming"
        }
      }
    ],
    "creationBlockHash": "0x7f71811ef0997bc8b57ed4eb9c4fb6cfd2a4522dcc2c46cc8bd7d00230aadb9d",
    "latestCommitment": null,
    "issuedPrivately": false,
    "createdAt": "2022-12-05T09:47:48.088Z",
    "updatedAt": "2022-12-05T09:55:00.194Z",
    "certificateStartDate": "2022-09-26T23:00:00.000Z",
    "certificateEndDate": "2022-09-29T00:00:00.000Z",
    "perDeviceCertificateLog": []
  }
]
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
  this.dataSource = new MatTableDataSource(this.data.claims);
  this.DisplayRedemptionList()
}
DisplayRedemptionList() {
  this.ReservationService.GetMethod().subscribe(
    (data) => {
      // display list in the console 
      console.log(data)
      this.data = data;
      // this.data.forEach(ele =>{
        

      // })
      this.dataSource = new MatTableDataSource(this.data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  )
}
}
