import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeterReadTableComponent } from './meter-read-table.component';

describe('MeterReadTableComponent', () => {
  let component: MeterReadTableComponent;
  let fixture: ComponentFixture<MeterReadTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MeterReadTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeterReadTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
