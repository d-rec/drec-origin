import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBulkDeviceComponent } from './add-bulk-device.component';

describe('AddBulkDeviceComponent', () => {
  let component: AddBulkDeviceComponent;
  let fixture: ComponentFixture<AddBulkDeviceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddBulkDeviceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddBulkDeviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
