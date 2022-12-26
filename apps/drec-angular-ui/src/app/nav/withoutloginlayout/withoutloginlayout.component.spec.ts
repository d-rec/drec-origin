import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithoutloginlayoutComponent } from './withoutloginlayout.component';

describe('WithoutloginlayoutComponent', () => {
  let component: WithoutloginlayoutComponent;
  let fixture: ComponentFixture<WithoutloginlayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WithoutloginlayoutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WithoutloginlayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
