
import {FormBuilder} from '@angular/forms';
import {SelectionModel} from '@angular/cdk/collections';
import {MediaMatcher} from '@angular/cdk/layout';
import {ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
// import { NavItem } from './nav-item';
import {MatTableDataSource} from '@angular/material/table';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor()
  {
    
         this.connectWallet();
  }

  getWindowEthereumProperty()
  {
    //@ts-ignore
    return window.ethereum;
  }
  async connectWallet() {

    if (typeof window != "undefined" && typeof this.getWindowEthereumProperty() != "undefined") {
      try {
        /* MetaMask is installed */
        const accounts = await this.getWindowEthereumProperty().request({
          method: "eth_requestAccounts",
        });
        console.log(accounts);
      } catch (err) {

      }
    }
  }
}
