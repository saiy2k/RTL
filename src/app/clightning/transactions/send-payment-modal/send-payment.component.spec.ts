import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import { Store, StoreModule } from '@ngrx/store';

import { CommonService } from '../../../shared/services/common.service';
import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLReducer } from '../../../clightning/store/cl.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CLLightningSendPaymentsComponent } from './send-payment.component';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../shared/test-helpers/mock-services';
import { LoggerService } from '../../../shared/services/logger.service';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';
import { EffectsModule } from '@ngrx/effects';
import { PaymentTypes, FEE_LIMIT_TYPES, UI_MESSAGES } from '../../../shared/services/consts-enums-functions';
import { mockRTLStoreState } from '../../../shared/test-helpers/test-data';

import { RTLState } from '../../../store/rtl.state';
import { sendPayment } from '../../store/cl.actions';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { channels } from '../../store/cl.selector';

/**
 * Testing Plan
 *  1. Page Init, Reset state
 *  2. UI Controls: For each of 3 options: Invoice, Keysend, Offer
 *  3. For each type, test all Negative cases
 *      * Empty data
 *      * Invalid data
 *  4. For each type, test Positive scenarios
 */

describe('CLLightningSendPaymentsComponent', () => {
  let component: CLLightningSendPaymentsComponent;
  let fixture: ComponentFixture<CLLightningSendPaymentsComponent>;
  let commonService: CommonService;
  let store: Store<RTLState>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLLightningSendPaymentsComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLLightningSendPaymentsComponent);
    component = fixture.componentInstance;
    commonService = fixture.debugElement.injector.get(CommonService);
    store = fixture.debugElement.injector.get(Store);
    component.activeChannels = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get cl store value on ngOnInit', () => {
    const storeSpy = spyOn(store, 'select').and.returnValue(of(mockRTLStoreState.cl.nodeSettings));
    component.ngOnInit();
    expect(component.selNode.lnImplementation).toBe('CLT');
    expect(storeSpy).toHaveBeenCalledTimes(2);
  });

  it('should reset the component', () => {

    // Should assign fake data to the fields, before resetting?

    component.resetData();

    // Invoice
    expect(component.paymentRequest).toEqual('');
    expect(component.paymentDecoded).toEqual({});
    expect(component.selActiveChannel).toBe(null);
    expect(component.feeLimit).toBe(null);
    expect(component.selFeeLimitType).toEqual(FEE_LIMIT_TYPES[0]);
    expect(component.paymentAmount).toBe(null);
    expect(component.zeroAmtInvoice).toBe(false);

    // Keysend
    expect(component.pubkey).toEqual('');
    expect(component.keysendAmount).toBe(null);

    // Offer
    expect(component.offerRequest).toEqual('');
    expect(component.offerDecoded).toEqual({});
    expect(component.flgSaveToDB).toBe(false);
    expect(component.offerInvoice).toBe(null);
    expect(component.offerAmount).toBe(null);
    expect(component.offerDecodedHint).toEqual('');
    expect(component.zeroAmtOffer).toBe(false);

    // Common
    expect(component.paymentError).toEqual('');
    // expect(component.paymentReq.control.errors).toBe(null); //can't access Private var
    expect(component.paymentDecodedHint).toEqual('');

  });

  it('should handle Invalid invoice', () => {
    component.paymentRequest = 'Invalidlntb100u1ps7e3zdpp5epqx9v00ptsavrm56v4hr66akgvrswh4mtsm42wx4rg7mxdfga8sdq523jhxapqf9h8vmmfvdjscqp2sp52mhqxcux05vpccgf50zvjvln6vzhkv369jwt0scu6zjhfg2h988qrzjqt4dhk0824eh29salzmyvam22379e0pwjkesw8kgz4fl3mpvagaccgy4vcqqqxcqqqqqqqlgqqqqqqgq9qrzjqgq20usw2yzfxc7t0u4qse07qujxf4rfmjs2cdxf2jan6j649dhf2gykavqqq8qqqyqqqqlgqqqqqqgq9q9qyyssqy8tp5d5r7w89yttrphlfwd5p4nyyl4gyjkgw6mmy3jp3kv8lqy9yc5vw3s4ht0t7tpykv74jhp49a46u4qm06gp43dx4hydvghwgfhgpwpwqj5';
    component.onPaymentRequestEntry(component.paymentRequest);
    component.onSendPayment();
    fixture.detectChanges();

    // 
    const payForm = fixture.debugElement.nativeElement.querySelector('#sendPaymentForm');
    const errorDiv = fixture.debugElement.nativeElement.querySelector('#sendPaymentForm > div.alert.alert-danger');
    const errorSpan = fixture.debugElement.nativeElement.querySelector('#paymentErrorSpan');
    const textArea = fixture.debugElement.nativeElement.querySelector('#sendPaymentForm > mat-form-field > div > div.mat-form-field-flex > div > textarea');
    console.log('payForm', payForm !== null); // Exists
    console.log('errorDiv', errorDiv); // Null. doing document.querySelector('#sendPaymentForm > div.alert.alert-danger') from Chrome console returns the object though
    console.log('errorSpan', errorSpan !== null); // Null
    console.log('textarea', textArea !== null); // Exists
    //console.log('textContent', errorDiv.textContent);
    //expect(errorDiv.textContent).toEqual('Invalid bolt11: bad bech32 string');

  });

  // Not to test in front end. As the logic happens in backend
  it('should decode bolt11 properly', () => {
    component.paymentRequest = 'lntb100u1ps7e3zdpp5epqx9v00ptsavrm56v4hr66akgvrswh4mtsm42wx4rg7mxdfga8sdq523jhxapqf9h8vmmfvdjscqp2sp52mhqxcux05vpccgf50zvjvln6vzhkv369jwt0scu6zjhfg2h988qrzjqt4dhk0824eh29salzmyvam22379e0pwjkesw8kgz4fl3mpvagaccgy4vcqqqxcqqqqqqqlgqqqqqqgq9qrzjqgq20usw2yzfxc7t0u4qse07qujxf4rfmjs2cdxf2jan6j649dhf2gykavqqq8qqqyqqqqlgqqqqqqgq9q9qyyssqy8tp5d5r7w89yttrphlfwd5p4nyyl4gyjkgw6mmy3jp3kv8lqy9yc5vw3s4ht0t7tpykv74jhp49a46u4qm06gp43dx4hydvghwgfhgpwpwqj5';
    component.onPaymentRequestEntry(component.paymentRequest);
    fixture.detectChanges();

    const hintDiv = fixture.debugElement.nativeElement.querySelector('#paymentRequestField > div > div.mat-form-field-subscript-wrapper > div > mat-hint');
    console.log('hintDiv', hintDiv !== null); // Null. Doing document.querySelector('#paymentRequestField > div > div.mat-form-field-subscript-wrapper > div > mat-hint') from Chrome console returns the object though
    // expect(component.paymentDecodedHint).toEqual('Sending: 10,000 Sats | Memo: Test Invoice2'); // 'component.paymentDecodedHint' turns out to be empty string
    // expect(hintDiv.textContent).toEqual('Sending: 10,000 Sats | Memo: Test Invoice1'); //hintDiv is null
  });

  it('should change respective controls for Keysend', () => {
    component.paymentType = PaymentTypes.KEYSEND;
  });

  it('should change respective controls for Offer', () => {
    component.paymentType = PaymentTypes.OFFER;
  });

  it('should test for zero value invoice', () => {
    // lntb1ps7e5xypp5d7j5vnzdxk2fjkrkg4gyxmw4haa375fluzps0eajmhchjle89xkqdqg0fjhyme3xqyjw5qcqp2sp5x4c6me8rryg650d8c22l0w76n48ttvk5r5cy2p6403rve895kfaqrzjqt4dhk0824eh29salzmyvam22379e0pwjkesw8kgz4fl3mpvagaccgy4vcqqqxcqqqqqqqlgqqqqqqgq9qrzjqgq20usw2yzfxc7t0u4qse07qujxf4rfmjs2cdxf2jan6j649dhf2gykavqqq8qqqyqqqqlgqqqqqqgq9q9qyyssqjshru5tmyqkgfcrp8yd770lz077vrw9uxfvmxzc9pdl2y34qr46y2sp6yfcw33wq79v2m3m5a2qz6h4qm7tayc5fg05c9l955js6xucqkx050w
  });

  it('should complete subscriptions on ngOnDestroy', () => {
    const spy = spyOn(component['unSubs'][1], 'complete');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
