import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptedOrderComponent } from './accepted_order.component';

describe('AcceptedOrderComponent', () => {
  let component: AcceptedOrderComponent;
  let fixture: ComponentFixture<AcceptedOrderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AcceptedOrderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptedOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
