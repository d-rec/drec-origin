import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyreservationComponent } from './myreservation.component';

describe('MyreservationComponent', () => {
  let component: MyreservationComponent;
  let fixture: ComponentFixture<MyreservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyreservationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyreservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
