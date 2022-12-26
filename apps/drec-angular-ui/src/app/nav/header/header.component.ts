import { Component,OnInit } from '@angular/core';
import {AuthbaseService} from '../../auth/authbase.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit{
  isLoggedIn = false;
  
  constructor( private authService: AuthbaseService, private router: Router) { }
 
  ngOnInit() {
  this.isLoggedIn = this.authService.isLoggedIn();
  console.log(this.isLoggedIn);
  }

  logout(){
  
       sessionStorage.clear();
        this.router.navigate(['/login']);
    
  }
}
