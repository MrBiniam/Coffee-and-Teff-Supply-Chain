import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShippedOrderProfileComponent } from './shipped_order-profile.component';

describe('ShippedOrderProfileComponent', () => {
  let component: ShippedOrderProfileComponent;
  let fixture: ComponentFixture<ShippedOrderProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShippedOrderProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShippedOrderProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
