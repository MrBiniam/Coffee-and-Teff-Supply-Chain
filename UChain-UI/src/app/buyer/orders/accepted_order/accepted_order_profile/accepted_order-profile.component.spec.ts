import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptedOrderProfileComponent } from './accepted_order-profile.component';

describe('AcceptedOrderProfileComponent', () => {
  let component: AcceptedOrderProfileComponent;
  let fixture: ComponentFixture<AcceptedOrderProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AcceptedOrderProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptedOrderProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
