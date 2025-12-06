import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OrderProfileComponent } from './order-profile.component';

describe('OrderProfileComponent', () => {
  let component: OrderProfileComponent;
  let fixture: ComponentFixture<OrderProfileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OrderProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
