import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliverOrderComponent } from './deliver_order.component';

describe('DeliverOrderComponent', () => {
  let component: DeliverOrderComponent;
  let fixture: ComponentFixture<DeliverOrderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeliverOrderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliverOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
