import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelRebalanceInfoGraphicsComponent } from './info-graphics.component';

describe('ChannelRebalanceInfoGraphicsComponent', () => {
  let component: ChannelRebalanceInfoGraphicsComponent;
  let fixture: ComponentFixture<ChannelRebalanceInfoGraphicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelRebalanceInfoGraphicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelRebalanceInfoGraphicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
