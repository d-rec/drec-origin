import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddreadComponent } from './addread.component';

describe('AddreadComponent', () => {
  let component: AddreadComponent;
  let fixture: ComponentFixture<AddreadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddreadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
