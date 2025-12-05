import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShippedOrderComponent } from './shipped_order.component';

describe('ShippedOrderComponent', () => {
  let component: ShippedOrderComponent;
  let fixture: ComponentFixture<ShippedOrderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ShippedOrderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShippedOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
