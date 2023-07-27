import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllMetereadsComponent } from './all-metereads.component';

describe('AllMetereadsComponent', () => {
  let component: AllMetereadsComponent;
  let fixture: ComponentFixture<AllMetereadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllMetereadsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllMetereadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
