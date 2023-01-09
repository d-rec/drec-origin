import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedemptionReportComponent } from './redemption-report.component';

describe('RedemptionReportComponent', () => {
  let component: RedemptionReportComponent;
  let fixture: ComponentFixture<RedemptionReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RedemptionReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedemptionReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
