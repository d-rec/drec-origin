import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlldevicesComponent } from './alldevices.component';

describe('AlldevicesComponent', () => {
  let component: AlldevicesComponent;
  let fixture: ComponentFixture<AlldevicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlldevicesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlldevicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
