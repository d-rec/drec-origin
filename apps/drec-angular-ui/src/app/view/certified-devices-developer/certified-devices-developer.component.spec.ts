import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertifiedDevicesDeveloperComponent } from './certified-devices-developer.component';

describe('CertifiedDevicesDeveloperComponent', () => {
  let component: CertifiedDevicesDeveloperComponent;
  let fixture: ComponentFixture<CertifiedDevicesDeveloperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CertifiedDevicesDeveloperComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertifiedDevicesDeveloperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
