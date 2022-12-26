import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-sidemenu',
  templateUrl: './sidemenu.component.html',
  styleUrls: ['./sidemenu.component.scss']
})
export class SidemenuComponent {
  constructor(  private router: Router) { }
  logout(){
  
    sessionStorage.clear();
     this.router.navigate(['/login']);
 
}
}
