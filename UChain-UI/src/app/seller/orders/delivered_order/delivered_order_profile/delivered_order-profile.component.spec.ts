import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DeliveredOrderProfileComponent } from './delivered_order-profile.component';

describe('DeliveredOrderProfileComponent', () => {
  let component: DeliveredOrderProfileComponent;
  let fixture: ComponentFixture<DeliveredOrderProfileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DeliveredOrderProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveredOrderProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
