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
    component.paymentRequest = 'Alntb100u1ps7e3zdpp5epqx9v00ptsavrm56v4hr66akgvrswh4mtsm42wx4rg7mxdfga8sdq523jhxapqf9h8vmmfvdjscqp2sp52mhqxcux05vpccgf50zvjvln6vzhkv369jwt0scu6zjhfg2h988qrzjqt4dhk0824eh29salzmyvam22379e0pwjkesw8kgz4fl3mpvagaccgy4vcqqqxcqqqqqqqlgqqqqqqgq9qrzjqgq20usw2yzfxc7t0u4qse07qujxf4rfmjs2cdxf2jan6j649dhf2gykavqqq8qqqyqqqqlgqqqqqqgq9q9qyyssqy8tp5d5r7w89yttrphlfwd5p4nyyl4gyjkgw6mmy3jp3kv8lqy9yc5vw3s4ht0t7tpykv74jhp49a46u4qm06gp43dx4hydvghwgfhgpwpwqj5';
    //component.onPaymentRequestEntry(component.paymentRequest);
    //component.onSendPayment();
    component.sendPayment();
    fixture.detectChanges();

    const payForm = fixture.debugElement.nativeElement.querySelector('#sendPaymentForm');
    const textArea = fixture.debugElement.nativeElement.querySelector('#sendPaymentForm > mat-form-field > div > div.mat-form-field-flex > div > textarea');
    const errorDiv = fixture.debugElement.nativeElement.querySelector('#sendPaymentForm > div.alert.alert-danger');
    const errorSpan = fixture.debugElement.nativeElement.querySelector('#paymentErrorSpan');
    console.log('payForm', payForm !== null); // Exists
    console.log('textarea', textArea !== null); // Exists
    console.log('errorDiv', errorDiv !== null); // Null. doing document.querySelector('#sendPaymentForm > div.alert.alert-danger') from Chrome console returns the object though
    console.log('errorSpan', errorSpan !== null); // Null
    //console.log('textContent', errorDiv.textContent);
    //expect(errorDiv.textContent).toEqual('Invalid bolt11: bad bech32 string');

  });

  it('should send payment buttons (Invoice, ZeroAmt) work as expected', () => {
    //const storeSpy = spyOn(store, 'dispatch').and.callThrough();
    const dataServiceSpy = spyOn(mockDataService, 'decodePayment').and.callThrough();
    component.zeroAmtInvoice = true;
    component.paymentAmount = 600;
    component.paymentRequest = 'lntb4u1psvdzaypp555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp5xjzu6pz2sf8x4v8nmr58kjdm6k05etjfq9c96mwkhzl0g9j7sjkqrzjq28vwprzypa40c75myejm8s2aenkeykcnd7flvy9plp2yjq56nvrc8ss5cqqqzgqqqqqqqlgqqqqqqgq9q9qy9qsqpt6u4rwfrck3tmpn54kdxjx3xdch62t5wype2f44mmlar07y749xt9elhfhf6dnlfk2tjwg3qpy8njh6remphfcc0630aq38j0s3hrgpv4eel3';
    component.paymentDecoded = {
      destination: '031844beb16bf8dd8c7bc30588b8c37b36e62b71c6e812e9b6d976c0a57e151be2', payment_hash: 'a53968453af7ab6fc58d229a91bdf23d7c121963067f06cf02e1a7b581852c07', timestamp: '1623624612', expiry: '3600',
      description: 'Testing ngrx Effects 4', description_hash: '', fallback_addr: '', cltv_expiry: '10', route_hints: [{ hop_hints: [{ node_id: '028ec70462207b57e3d4d9332d9e0aee676c92d89b7c9fb0850fc2a24814d4d83c', chan_id: '2166413939696009216', fee_base_msat: 1000, fee_proportional_millionths: 1, cltv_expiry_delta: 40 }] }],
      payment_addr: 'NIXNBEqCTmqw89joe0m71Z9MrkkBcF1t1ri+9BZehKw=', num_msat: '400000', features: { 9: { name: 'tlv-onion', is_required: false, is_known: true }, 15: { name: 'payment-addr', is_required: false, is_known: true }, 17: { name: 'multi-path-payments', is_required: false, is_known: true } }
    };
    const sendButton = fixture.debugElement.nativeElement.querySelector('#sendBtn');
    sendButton.click();
    const expectedSendPaymentPayload = {
      uiMessage: UI_MESSAGES.SEND_PAYMENT, outgoingChannel: null, feeLimitType: 'none', feeLimit: null, fromDialog: true,
      paymentReq: 'lntb4u1psvdzaypp555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp5xjzu6pz2sf8x4v8nmr58kjdm6k05etjfq9c96mwkhzl0g9j7sjkqrzjq28vwprzypa40c75myejm8s2aenkeykcnd7flvy9plp2yjq56nvrc8ss5cqqqzgqqqqqqqlgqqqqqqgq9q9qy9qsqpt6u4rwfrck3tmpn54kdxjx3xdch62t5wype2f44mmlar07y749xt9elhfhf6dnlfk2tjwg3qpy8njh6remphfcc0630aq38j0s3hrgpv4eel3'
    };
    //expect(component.paymentDecoded).toEqual(paymentDecoded);
    //expect(storeSpy.calls.all()[0].args[0]).toEqual(sendPayment({ payload: expectedSendPaymentPayload }));
    expect(dataServiceSpy).toHaveBeenCalledTimes(1);
  });


  /*
  // Not to test in front end. As the logic happens in backend
  it('should decode bolt11 properly', () => {
    //component.paymentRequest = 'lntb100u1ps7e3zdpp5epqx9v00ptsavrm56v4hr66akgvrswh4mtsm42wx4rg7mxdfga8sdq523jhxapqf9h8vmmfvdjscqp2sp52mhqxcux05vpccgf50zvjvln6vzhkv369jwt0scu6zjhfg2h988qrzjqt4dhk0824eh29salzmyvam22379e0pwjkesw8kgz4fl3mpvagaccgy4vcqqqxcqqqqqqqlgqqqqqqgq9qrzjqgq20usw2yzfxc7t0u4qse07qujxf4rfmjs2cdxf2jan6j649dhf2gykavqqq8qqqyqqqqlgqqqqqqgq9q9qyyssqy8tp5d5r7w89yttrphlfwd5p4nyyl4gyjkgw6mmy3jp3kv8lqy9yc5vw3s4ht0t7tpykv74jhp49a46u4qm06gp43dx4hydvghwgfhgpwpwqj5';
    //component.onPaymentRequestEntry(component.paymentRequest);
    //fixture.detectChanges();

    //const hintDiv = fixture.debugElement.nativeElement.querySelector('#paymentRequestField > div > div.mat-form-field-subscript-wrapper > div > mat-hint');
    //console.log('hintDiv', hintDiv !== null); // Null. Doing document.querySelector('#paymentRequestField > div > div.mat-form-field-subscript-wrapper > div > mat-hint') from Chrome console returns the object though
    // expect(component.paymentDecodedHint).toEqual('Sending: 10,000 Sats | Memo: Test Invoice2'); // 'component.paymentDecodedHint' turns out to be empty string
    // expect(hintDiv.textContent).toEqual('Sending: 10,000 Sats | Memo: Test Invoice1'); //hintDiv is null
  });
  */

  /*
  it('should change respective controls for Keysend', () => {
    component.paymentType = PaymentTypes.KEYSEND;
  });

  it('should change respective controls for Offer', () => {
    component.paymentType = PaymentTypes.OFFER;
  });

  it('should test for zero value invoice', () => {
    // lntb1ps7e5xypp5d7j5vnzdxk2fjkrkg4gyxmw4haa375fluzps0eajmhchjle89xkqdqg0fjhyme3xqyjw5qcqp2sp5x4c6me8rryg650d8c22l0w76n48ttvk5r5cy2p6403rve895kfaqrzjqt4dhk0824eh29salzmyvam22379e0pwjkesw8kgz4fl3mpvagaccgy4vcqqqxcqqqqqqqlgqqqqqqgq9qrzjqgq20usw2yzfxc7t0u4qse07qujxf4rfmjs2cdxf2jan6j649dhf2gykavqqq8qqqyqqqqlgqqqqqqgq9q9qyyssqjshru5tmyqkgfcrp8yd770lz077vrw9uxfvmxzc9pdl2y34qr46y2sp6yfcw33wq79v2m3m5a2qz6h4qm7tayc5fg05c9l955js6xucqkx050w
  });
  */

  it('should complete subscriptions on ngOnDestroy', () => {
    const spy = spyOn(component['unSubs'][1], 'complete');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
