import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShippedOrderComponent } from './shipped_order.component';

describe('ShippedOrderComponent', () => {
  let component: ShippedOrderComponent;
  let fixture: ComponentFixture<ShippedOrderComponent>;

  beforeEach(async(() => {
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
