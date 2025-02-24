import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveredOrderComponent } from './delivered_order.component';

describe('DeliveredOrderComponent', () => {
  let component: DeliveredOrderComponent;
  let fixture: ComponentFixture<DeliveredOrderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeliveredOrderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveredOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
