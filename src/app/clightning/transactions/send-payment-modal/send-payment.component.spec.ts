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
import { OfferInvoice } from '../../../shared/models/clModels';
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
 *  I. Page Init, Reset state
 *  II. UI Controls: For each of 3 options: Invoice, Keysend, Offer
 *  III. For each functions, test for
 *    * Negative cases
 *    * Positive cases
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

  /**
   * I. Page Init, Reset - Begin
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get cl store value on ngOnInit', () => {
    const storeSpy = spyOn(store, 'select').and.returnValue(of(mockRTLStoreState.cl.nodeSettings));
    component.ngOnInit();
    expect(component.selNode.lnImplementation).toBe('CLT');
    expect(storeSpy).toHaveBeenCalledTimes(2);
  });

  // TODO: Test only if current form is reset and values in other forms are retained
  it('should reset the component', () => {

    // TODO:
    //populateComponentFields();

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
  /** I. Page Init, Reset - End */

  /**
   * II. UI Controls - Begin
   */
  // Invoice
  it('Invoice: should show only Payment request field, when Invoice is selected', () => {
  });

  it('Invoice: should show Sats and Memo, when valid payment Request is pasted', () => {
  });

  it('Invoice: should show "Invalid bolt11: bad bech32 string", when invalid payment Request is pasted and Send Payment is clicked', () => {
  });

  it('Invoice: should show Payment request field and Amount field, when zero amount Invoice is pasted', () => {
  });

  it('Invoice: should enter only numbers in Amount field', () => {
  });

  // Keysend
  it('Keysend: should show Pubkey and field, when Keysend is selected', () => {
  });

  it('Keysend: should show error for Invalid pubkey', () => {
  });

  it('Keysend: should show error for Invalid amount', () => {
  });

  it('Keysend: shouldnt show any error for proper Pubkey and amount values', () => {
  });

  // Offers
  it('Offers: should show only Payment request field and Bookmark offers field, when Offers is selected', () => {
  });

  // lno1qgsyxjtl6luzd9t3pr62xr7eemp6awnejusgf6gw45q75vcfqqqqqqqgqv85ysq2pccnqvpsypekzapqdanxvetjzs9ycn64g3x57njtg4v3ugrapd243ehrdgukkse4c50z350vrklh9gtwnr7cwx2eqp3xht7l48cyqm0ja0kvcxxsxscmfnd8qrclal9ux0yw9n92uxsu039xp8lcd4typ26ysfh5tzrng0w4vqs32uz7c23g7shzgphaxhnerpjsau4ztulq
  it('Offers: should show Sats and Description, when valid Offer Request is pasted', () => {
  });

  // Zlno1qgsyxjtl6luzd9t3pr62xr7eemp6awnejusgf6gw45q75vcfqqqqqqqgqv85ysq2pccnqvpsypekzapqdanxvetjzs9ycn64g3x57njtg4v3ugrapd243ehrdgukkse4c50z350vrklh9gtwnr7cwx2eqp3xht7l48cyqm0ja0kvcxxsxscmfnd8qrclal9ux0yw9n92uxsu039xp8lcd4typ26ysfh5tzrng0w4vqs32uz7c23g7shzgphaxhnerpjsau4ztulq
  it('Offers: should show "Offer: unparsable offer: invalid bolt11: bad bech32 string: invalid token [offer request]", when invalid offer Request is pasted and Send Payment is clicked', () => {
  });

  // lno1qgsyxjtl6luzd9t3pr62xr7eemp6awnejusgf6gw45q75vcfqqqqqqq2pf2x2um5yp8kven9wg2q5nz024zy6n6wfdz4j83q05942k8xud4rj66rxhz3u2x3aswm7u4pd6v0mpcetyqxy6a0m75lqsrltax2ny3q2hcqv2njzz0ql56azfn928md6qkun2cplcn4ms03fqxykkz0t2tnfnwa9092f3d4s2rkklkaetxc2af8sptflyy0juu0j
  it('Offers: should show Offer request field and Amount field, when zero amount Offer is pasted', () => {
  });

  it('Offers: should enter only numbers in Amount field', () => {
  });

  it('Offers: Checking Bookmark offers checkbox, shows "Title to save" field', () => {
  });

  // Radio
  it('should reset Errors and hint texts when Payment type is changed via Direct function', () => {
    component.paymentError = 'Test Error';
    component.paymentDecodedHint = 'Test Hint';
    component.offerDecodedHint = 'Test Offer Hint';
    component.offerInvoice = {
      invoice: 'Test Invoice',
      changes: null,
    };

    component.onPaymentTypeChange();

    expect(component.paymentError).toEqual('');
    expect(component.paymentDecodedHint).toEqual('');
    expect(component.offerDecodedHint).toEqual('');
    expect(component.offerInvoice).toBe(null);
  });

  it('should reset Errors and hint texts when Payment type is changed via Template', () => {
    component.paymentError = 'Test Error';
    component.paymentDecodedHint = 'Test Hint';
    component.offerDecodedHint = 'Test Offer Hint';
    component.offerInvoice = {
      invoice: 'Test Invoice',
      changes: null,
    };

    // Select Keysend mat-radio
    fixture.debugElement.nativeElement.querySelector('rtl-cl-lightning-send-payments > div > div > mat-card-content > mat-radio-group').children[1].querySelector('input').click();
    fixture.detectChanges();

    expect(component.paymentError).toEqual('');
    expect(component.paymentDecodedHint).toEqual('');
    expect(component.offerDecodedHint).toEqual('');
    expect(component.offerInvoice).toBe(null);
  });

  // Misc
  it('should clear the current form values on tapping Clear fields', () => {
  });

  it('should close modal on tapping close button', () => {
  });

  /** II. UI Controls - End */


  /**
   * III. Function wise Test coverage - Begin
   */
  it('onAmountChange(): should set proper amount in decoded object', () => {

    let invoiceInputVal, offerInputVal;

    component.paymentType = PaymentTypes.INVOICE;
    invoiceInputVal = 123;
    component.onAmountChange({ target: { value: invoiceInputVal } });
    expect(component.paymentDecoded.msatoshi).toBe(invoiceInputVal * 1000);

    invoiceInputVal = 125;
    component.onAmountChange({ target: { value: invoiceInputVal } });
    expect(component.paymentDecoded.msatoshi).toBe(invoiceInputVal * 1000);

    component.paymentType = PaymentTypes.OFFER;
    offerInputVal = 20;
    component.onAmountChange({ target: { value: offerInputVal } });
    expect(component.offerDecoded.amount).toBe(offerInputVal * 1000);
    expect(component.offerDecoded.amount_msat).toBe((offerInputVal * 1000) + 'mast');

    offerInputVal = 28;
    component.onAmountChange({ target: { value: offerInputVal } });
    expect(component.offerDecoded.amount).toBe(offerInputVal * 1000);
    expect(component.offerDecoded.amount_msat).toBe((offerInputVal * 1000) + 'mast');

  });

  it('keysendPayment(): should dispatch proper action', () => {

    const storeSpy = spyOn(store, 'dispatch').and.callThrough();
    component.pubkey = 'pubkey';
    component.keysendAmount = 150;
    component.keysendPayment();

    const expectedkeysendPaymentPayload = {
      uiMessage: UI_MESSAGES.SEND_KEYSEND, paymentType: PaymentTypes.KEYSEND, fromDialog: true,
      pubkey: 'pubkey', amount: 150000
    };
    expect(storeSpy.calls.all()[0].args[0]).toEqual(sendPayment({ payload: expectedkeysendPaymentPayload }));
    expect(storeSpy).toHaveBeenCalledTimes(1);

  });

  // ngOnInit()
  // onSendPayment()
  // keysendAmount()
  // sendPayment()
  // onPaymentRequestEntry
  // resetOfferDetails
  // resetInvoiceDetails
  // onPaymentTypeChange
  // setOfferDecodedDetails
  // setPaymentDecodedDetails
  /** III. Function wise Test coverage - End */


  /*
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
   */

  it('should complete subscriptions on ngOnDestroy', () => {
    const spy = spyOn(component['unSubs'][1], 'complete');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function populateComponentFields() {
    component.paymentRequest = 'paymentRequest';
    component.paymentDecoded = {
      msatoshi: 1000
    };
    component.selActiveChannel = {};
    component.feeLimit = {};
    component.selFeeLimitType = FEE_LIMIT_TYPES[1];
    // TODO:
  }

});
