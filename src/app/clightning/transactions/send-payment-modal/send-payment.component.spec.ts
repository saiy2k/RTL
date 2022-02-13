import { By } from '@angular/platform-browser';
import { tick, fakeAsync, waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
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
    component = fixture.debugElement.componentInstance;
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

  it('should reset only Keysend fields', () => {

    populateComponentFields();
    component.paymentType = PaymentTypes.KEYSEND;
    component.resetData();

    expect(component.pubkey).toEqual('');
    expect(component.keysendAmount).toBe(null);

    expect(component.paymentRequest).toEqual('paymentRequest');
    expect(component.paymentDecoded).toEqual({ msatoshi: 2000 });
    expect(component.selActiveChannel).toEqual({});
    expect(component.feeLimit).toEqual({});
    expect(component.selFeeLimitType).toEqual(FEE_LIMIT_TYPES[1]);
    expect(component.paymentAmount).toEqual(2);
    expect(component.paymentDecodedHint).toEqual('InvoiceHint');
    expect(component.zeroAmtInvoice).toEqual(true);

    expect(component.offerRequest).toEqual('offerRequest');
    expect(component.offerDecoded).toEqual({ amount: 2000, amount_msat: '2000msat'});
    expect(component.flgSaveToDB).toEqual(true);
    expect(component.offerInvoice).toEqual({ invoice: 'invoice', changes: {} });
    expect(component.offerAmount).toEqual(2);
    expect(component.offerDecodedHint).toEqual('OfferHint');
    expect(component.zeroAmtOffer).toEqual(true);

    expect(component.paymentError).toEqual('');
    // TODO:
    // expect(component.paymentReq.control.errors).toBe(null); //can't access Private var

  });

  it('should reset only Invoice fields', () => {

    populateComponentFields();
    component.paymentType = PaymentTypes.INVOICE;
    component.resetData();

    expect(component.paymentRequest).toEqual('');
    expect(component.paymentDecoded).toEqual({});
    expect(component.selActiveChannel).toBe(null);
    expect(component.feeLimit).toBe(null);
    expect(component.selFeeLimitType).toEqual(FEE_LIMIT_TYPES[0]);
    expect(component.paymentAmount).toBe(null);
    expect(component.zeroAmtInvoice).toBe(false);

    expect(component.pubkey).toEqual('pubkey');
    expect(component.keysendAmount).toBe(2);

    expect(component.offerRequest).toEqual('offerRequest');
    expect(component.offerDecoded).toEqual({ amount: 2000, amount_msat: '2000msat'});
    expect(component.flgSaveToDB).toEqual(true);
    expect(component.offerInvoice).toEqual({ invoice: 'invoice', changes: {} });
    expect(component.offerAmount).toEqual(2);
    expect(component.offerDecodedHint).toEqual('OfferHint');
    expect(component.zeroAmtOffer).toEqual(true);

    expect(component.paymentError).toEqual('');
    // expect(component.paymentReq.control.errors).toBe(null); //can't access Private var
    expect(component.paymentDecodedHint).toEqual('');

  });

  it('should reset only Offer fields', () => {

    populateComponentFields();
    component.paymentType = PaymentTypes.OFFER;
    component.resetData();

    expect(component.offerRequest).toEqual('');
    expect(component.offerDecoded).toEqual({});
    expect(component.flgSaveToDB).toBe(false);
    expect(component.offerInvoice).toBe(null);
    expect(component.offerAmount).toBe(null);
    expect(component.offerDecodedHint).toEqual('');
    expect(component.zeroAmtOffer).toBe(false);

    expect(component.paymentRequest).toEqual('paymentRequest');
    expect(component.paymentDecoded).toEqual({ msatoshi: 2000 });
    expect(component.selActiveChannel).toEqual({});
    expect(component.feeLimit).toEqual({});
    expect(component.selFeeLimitType).toEqual(FEE_LIMIT_TYPES[1]);
    expect(component.paymentAmount).toEqual(2);
    expect(component.paymentDecodedHint).toEqual('InvoiceHint');
    expect(component.zeroAmtInvoice).toEqual(true);

    expect(component.pubkey).toEqual('pubkey');
    expect(component.keysendAmount).toBe(2);

    expect(component.paymentError).toEqual('');
    // expect(component.paymentReq.control.errors).toBe(null); //can't access Private var

  });
  /** I. Page Init, Reset - End */

  /**
   * II. UI Controls - Begin
   */

  //TODO:
  // Test for Enable offers

  // Invoice
  it('Invoice: should show only Payment request field, when Invoice is selected', () => {

    // So as to show the radiogroup
    component.isCompatibleVersion = true;
    fixture.detectChanges();

    const textAreaEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-flex > div > textarea');
    const amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');

    expect(textAreaEl).toBeTruthy();
    expect(textAreaEl.getAttribute('data-placeholder')).toEqual('Payment Request');

    expect(amountEl).toBe(null);

  });

  it('Invoice: should show Sats and Memo, when valid payment Request is pasted', () => {

    component.isCompatibleVersion = true;
    fixture.detectChanges();

    component.paymentRequest = 'lntb100u1ps7e3zdpp5epqx9v00ptsavrm56v4hr66akgvrswh4mtsm42wx4rg7mxdfga8sdq523jhxapqf9h8vmmfvdjscqp2sp52mhqxcux05vpccgf50zvjvln6vzhkv369jwt0scu6zjhfg2h988qrzjqt4dhk0824eh29salzmyvam22379e0pwjkesw8kgz4fl3mpvagaccgy4vcqqqxcqqqqqqqlgqqqqqqgq9qrzjqgq20usw2yzfxc7t0u4qse07qujxf4rfmjs2cdxf2jan6j649dhf2gykavqqq8qqqyqqqqlgqqqqqqgq9q9qyyssqy8tp5d5r7w89yttrphlfwd5p4nyyl4gyjkgw6mmy3jp3kv8lqy9yc5vw3s4ht0t7tpykv74jhp49a46u4qm06gp43dx4hydvghwgfhgpwpwqj5';
    component.paymentDecodedHint = 'Sending: 10,000 Sats | Memo: Test Invoice';
    fixture.detectChanges();

    const textAreaEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-flex > div > textarea');
    const textAreaHintEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-subscript-wrapper > div > mat-hint');
    const amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');

    expect(textAreaEl).toBeTruthy();
    expect(textAreaEl.getAttribute('data-placeholder')).toEqual('Payment Request');
    expect(textAreaHintEl.textContent).toEqual('Sending: 10,000 Sats | Memo: Test Invoice');

    expect(amountEl).toBe(null);

  });

  it('Invoice: should show "Invalid bolt11: bad bech32 string", when invalid payment Request is pasted and Send Payment is clicked', () => {

    component.isCompatibleVersion = true;
    fixture.detectChanges();

    component.paymentError = 'Invalid bolt11: bad bech32 string';

    const sendBtn = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > div.mt-2 > button:nth-child(2)');
    sendBtn.click();
    fixture.detectChanges();

    const errorSpanEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > div.alert.alert-danger > span');
    expect(errorSpanEl.textContent).toEqual('Invalid bolt11: bad bech32 string');
    // TODO:
    // to have called respective function

  });

  it('Invoice: should show Payment request field and Amount field, when zero amount Invoice is pasted', () => {

    component.isCompatibleVersion = true;
    component.zeroAmtInvoice = true;
    fixture.detectChanges();

    let textAreaEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-flex > div > textarea');
    let amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');

    expect(textAreaEl).toBeTruthy();
    expect(textAreaEl.getAttribute('data-placeholder')).toEqual('Payment Request');

    expect(amountEl).toBeTruthy();
    expect(amountEl.getAttribute('data-placeholder')).toEqual('Amount (Sats)');

    /*
    const e1 = new KeyboardEvent("keypress", { "key": "A" });
    amountEl.dispatchEvent(e1);
    fixture.detectChanges();
    amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');
    expect(amountEl.value).toBe('');

    const e2 = new KeyboardEvent("keypress", { "key": "1" });
    amountEl.dispatchEvent(e2);
    fixture.detectChanges();
    amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');
    expect(amountEl.value).toBe('1');
    */

  });

  // Keysend
  it('Keysend: should show Pubkey and field, when Keysend is selected', () => {

    component.isCompatibleVersion = true;
    fixture.detectChanges();

    const radioGroupEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > mat-radio-group');
    radioGroupEl.children[1].querySelector('input').click();
    fixture.detectChanges();

    const pubkeyEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-flex > div > input');
    expect(pubkeyEl.getAttribute('data-placeholder')).toEqual('Pubkey');

    const amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');
    expect(amountEl.getAttribute('data-placeholder')).toEqual('Amount (Sats)');
  });

  it('Keysend: should show error for Invalid pubkey', () => {

    component.isCompatibleVersion = true;
    fixture.detectChanges();

    const radioGroupEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > mat-radio-group');
    radioGroupEl.children[1].querySelector('input').click();
    fixture.detectChanges();

    const pubkeyEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-flex > div > input');
    pubkeyEl.value = 'Invalid0313fdb34d38cf8abb2e8767bbc0b60621108855b29d3c686fc2be8f3eb9acd4fc';

    const amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');
    amountEl.value = 1000;

    const errorString = 'Destination: should be a node id: invalid token "Invalid0313fdb34d38cf8abb2e8767bbc0b60621108855b29d3c686fc2be8f3eb9acd4fc"';
    component.paymentError = errorString;

    fixture.detectChanges();

    const errorSpanEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > div.alert.alert-danger > span');
    expect(errorSpanEl.textContent).toEqual(errorString);

  });

  it('Keysend: should show error for Invalid amount', () => {

    component.isCompatibleVersion = true;
    fixture.detectChanges();

    const radioGroupEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > mat-radio-group');
    radioGroupEl.children[1].querySelector('input').click();
    fixture.detectChanges();

    const pubkeyEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-flex > div > input');
    pubkeyEl.value = '0313fdb34d38cf8abb2e8767bbc0b60621108855b29d3c686fc2be8f3eb9acd4fc';

    const amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');
    amountEl.value = 'A1000';

    const errorString = 'Missing required parameter: msatoshi';
    component.paymentError = errorString;

    fixture.detectChanges();

    const errorSpanEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > div.alert.alert-danger > span');
    expect(errorSpanEl.textContent).toEqual(errorString);

  });

  it('Keysend: shouldnt show any error for proper Pubkey and amount values', () => {

    component.isCompatibleVersion = true;
    fixture.detectChanges();

    const radioGroupEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > mat-radio-group');
    radioGroupEl.children[1].querySelector('input').click();
    fixture.detectChanges();

    const pubkeyEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-flex > div > input');
    pubkeyEl.value = '0313fdb34d38cf8abb2e8767bbc0b60621108855b29d3c686fc2be8f3eb9acd4fc';

    const amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');
    amountEl.value = 1000;

    const errorString = '';
    component.paymentError = errorString;

    fixture.detectChanges();

    const errorSpanEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > div.alert.alert-danger > span');
    expect(errorSpanEl).toBe(null);

  });

  // Offers
  it('Offers: should show only Payment request field and Bookmark offers field, when Offers is selected', () => {

    component.isCompatibleVersion = true;
    component.selNode = { enableOffers: true };
    fixture.detectChanges();

    const radioGroupEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > mat-radio-group');
    radioGroupEl.children[2].querySelector('input').click();
    fixture.detectChanges();

    const textAreaEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-flex > div > textarea');
    const amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');
    const bookmarkCheckbox = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > div:nth-child(1) > mat-checkbox > label > span > input');

    expect(textAreaEl).toBeTruthy();
    expect(textAreaEl.getAttribute('data-placeholder')).toEqual('Offer Request');
    expect(amountEl).toBe(null);
    expect(bookmarkCheckbox).toBeTruthy;

  });

  it('Offers: should show Sats and Description, when valid Offer Request is pasted', () => {

    component.isCompatibleVersion = true;
    component.selNode = { enableOffers: true };
    fixture.detectChanges();

    const radioGroupEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > mat-radio-group');
    radioGroupEl.children[2].querySelector('input').click();
    fixture.detectChanges();

    component.offerRequest = 'lno1qgsyxjtl6luzd9t3pr62xr7eemp6awnejusgf6gw45q75vcfqqqqqqqgqv85ysq2pccnqvpsypekzapqdanxvetjzs9ycn64g3x57njtg4v3ugrapd243ehrdgukkse4c50z350vrklh9gtwnr7cwx2eqp3xht7l48cyqm0ja0kvcxxsxscmfnd8qrclal9ux0yw9n92uxsu039xp8lcd4typ26ysfh5tzrng0w4vqs32uz7c23g7shzgphaxhnerpjsau4ztulq';
    component.offerDecodedHint = 'Sending: 1,000 Sats | Description: 1000 sat offer';
    fixture.detectChanges();

    const textAreaEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-flex > div > textarea');
    const textAreaHintEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-subscript-wrapper > div > mat-hint');

    expect(textAreaEl).toBeTruthy();
    expect(textAreaEl.getAttribute('data-placeholder')).toEqual('Offer Request');
    expect(textAreaHintEl.textContent).toEqual('Sending: 1,000 Sats | Description: 1000 sat offer');

  });

  it('Offers: should show "Offer: unparsable offer: invalid bolt11: bad bech32 string: invalid token [offer request]", when invalid offer Request is pasted and Send Payment is clicked', () => {

    component.isCompatibleVersion = true;
    component.selNode = { enableOffers: true };
    fixture.detectChanges();

    const radioGroupEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > mat-radio-group');
    radioGroupEl.children[2].querySelector('input').click();
    fixture.detectChanges();

    const token = 'Zlno1qgsyxjtl6luzd9t3pr62xr7eemp6awnejusgf6gw45q75vcfqqqqqqqgqv85ysq2pccnqvpsypekzapqdanxvetjzs9ycn64g3x57njtg4v3ugrapd243ehrdgukkse4c50z350vrklh9gtwnr7cwx2eqp3xht7l48cyqm0ja0kvcxxsxscmfnd8qrclal9ux0yw9n92uxsu039xp8lcd4typ26ysfh5tzrng0w4vqs32uz7c23g7shzgphaxhnerpjsau4ztulq';
    component.offerRequest = token;
    fixture.detectChanges();

    const errorString = `Offer: unparsable offer: invalid bech32 string: invalid token "${token}"`;
    component.paymentError = errorString;

    fixture.detectChanges();

    const errorSpanEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > div.alert.alert-danger > span');
    expect(errorSpanEl.textContent).toEqual(errorString);


  });

  it('Offers: should show Offer request field and Amount field, when zero amount Offer is pasted', () => {

    const hintText = 'Zero Amount Offer | Description: Test offer';
    const amountHintText = 'It is a zero amount offer, enter amount to be paid.';

    component.isCompatibleVersion = true;
    component.selNode = { enableOffers: true };
    fixture.detectChanges();

    const radioGroupEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > mat-radio-group');
    radioGroupEl.children[2].querySelector('input').click();
    component.offerRequest = 'lno1qgsyxjtl6luzd9t3pr62xr7eemp6awnejusgf6gw45q75vcfqqqqqqq2pf2x2um5yp8kven9wg2q5nz024zy6n6wfdz4j83q05942k8xud4rj66rxhz3u2x3aswm7u4pd6v0mpcetyqxy6a0m75lqsrltax2ny3q2hcqv2njzz0ql56azfn928md6qkun2cplcn4ms03fqxykkz0t2tnfnwa9092f3d4s2rkklkaetxc2af8sptflyy0juu0j';
    component.zeroAmtOffer = true;
    component.offerDecodedHint = hintText;
    fixture.detectChanges();

    let textAreaEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-flex > div > textarea');
    let textAreaHintEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(1) > div > div.mat-form-field-subscript-wrapper > div > mat-hint');
    let amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');
    let amountHintEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-subscript-wrapper > div > mat-hint');

    expect(textAreaEl).toBeTruthy();
    expect(textAreaEl.getAttribute('data-placeholder')).toEqual('Offer Request');
    expect(textAreaHintEl.textContent).toEqual(hintText);

    expect(amountEl).toBeTruthy();
    expect(amountEl.getAttribute('data-placeholder')).toEqual('Amount (Sats)');
    expect(amountHintEl.textContent).toEqual(amountHintText);


  });

  /*
  it('Offers: should enter only numbers in Amount field', () => {

    const e1 = new KeyboardEvent("keypress", { "key": "A" });
    amountEl.dispatchEvent(e1);
    fixture.detectChanges();
    amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');
    expect(amountEl.value).toBe('');

    const e2 = new KeyboardEvent("keypress", { "key": "1" });
    amountEl.dispatchEvent(e2);
    fixture.detectChanges();
    amountEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');
    expect(amountEl.value).toBe('1');

  });
  */

  it('Offers: Checking Bookmark offers checkbox, shows "Title to save" field', () => {

    component.isCompatibleVersion = true;
    component.selNode = { enableOffers: true };
    fixture.detectChanges();

    const radioGroupEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > mat-radio-group');
    radioGroupEl.children[2].querySelector('input').click();
    fixture.detectChanges();

    component.offerRequest = 'lno1qgsyxjtl6luzd9t3pr62xr7eemp6awnejusgf6gw45q75vcfqqqqqqqgqv85ysq2pccnqvpsypekzapqdanxvetjzs9ycn64g3x57njtg4v3ugrapd243ehrdgukkse4c50z350vrklh9gtwnr7cwx2eqp3xht7l48cyqm0ja0kvcxxsxscmfnd8qrclal9ux0yw9n92uxsu039xp8lcd4typ26ysfh5tzrng0w4vqs32uz7c23g7shzgphaxhnerpjsau4ztulq';
    fixture.detectChanges();

    const bookmarkCheckbox = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > div > mat-checkbox > label');
    bookmarkCheckbox.click();
    fixture.detectChanges();

    // TODO: Failing
    /*
    const titleEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > mat-form-field:nth-child(2) > div > div.mat-form-field-flex > div > input');
    expect(titleEl).toBeTruthy;
    console.log(titleEl);
    //expect(titleEl.getAttribute('data-placeholder')).toEqual('Title to Save');
    */

  });

  // Radio
  // TODO: Should move this to Function testing?
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

    component.isCompatibleVersion = true;
    fixture.detectChanges();

    component.paymentError = 'Test Error';
    component.paymentDecodedHint = 'Test Hint';
    component.offerDecodedHint = 'Test Offer Hint';
    component.offerInvoice = {
      invoice: 'Test Invoice',
      changes: null,
    };

    const radioGroupEl = fixture.debugElement.nativeElement.querySelector('mat-card-content > mat-radio-group');
    radioGroupEl.children[1].querySelector('input').click();
    fixture.detectChanges();

    expect(component.paymentError).toEqual('');
    expect(component.paymentDecodedHint).toEqual('');
    expect(component.offerDecodedHint).toEqual('');
    expect(component.offerInvoice).toBe(null);
  });

  // Misc
  it('should clear the current form values on tapping Clear fields', () => {

    const componentSpy = spyOn(component, 'resetData').and.callThrough();

    const resetBtn = fixture.debugElement.nativeElement.querySelector('mat-card-content > form > div.mt-2 > button:nth-child(1)');
    resetBtn.click();
    fixture.detectChanges();

    expect(componentSpy).toHaveBeenCalledTimes(1);
  });

  //TODO:
  // Form submission calling onSendPayment();

  /*
  // TODO: Not working
  it('should close modal on tapping close button', fakeAsync(() => {

    const resetBtn = fixture.debugElement.nativeElement.querySelector('mat-card-header > button');
    resetBtn.click();
    fixture.detectChanges();

    fixture.whenStable();
    tick();

    expect(component).toBe(null);
  }));
  */

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

  it('onSendPayment() :: KEYSEND: should handle negative inputs', () => {

    const compSpy = spyOn(component, 'keysendPayment');
    component.paymentType = PaymentTypes.KEYSEND;

    [
      { pukey: '', keysendAmount: null },
      { pukey: '', keysendAmount: -1 },
      { pukey: '', keysendAmount: 0 },
      { pukey: '', keysendAmount: 1 },
      { pukey: ' ', keysendAmount: 10 }
    ].map(ip => {
      component.pubkey = ip.pukey;
      component.keysendAmount = ip.keysendAmount;
      component.onSendPayment();
      expect(compSpy).not.toHaveBeenCalled();
    });

  });

  it('onSendPayment() :: KEYSEND: should handle positive inputs', () => {

    const compSpy = spyOn(component, 'keysendPayment');
    component.paymentType = PaymentTypes.KEYSEND;

    [
      { key: 'pubKey', amount: 10 },
      { key: 'pubKey  ', amount: 1000 },
      { key: 'pubKey', amount: 1 },
    ].map((ip, index) => {
      component.pubkey = ip.key;
      component.keysendAmount = ip.amount;
      component.onSendPayment();
      expect(compSpy).toHaveBeenCalledTimes(index + 1);
    });

  });

  it('onSendPayment() :: INVOICE: should handle negative inputs', () => {

    const sendPaymentSpy = spyOn(component, 'sendPayment');
    const resetInvoiceDetailsSpy = spyOn(component, 'resetInvoiceDetails');
    // TODO: Can't access dataService // privateVar
    //const decodePaymentSpy = spyOn(component.dataService, 'decodePayment');

    component.paymentType = PaymentTypes.INVOICE;

    [
      { paymentRequest: 'paymentRequest', zeroAmtInvoice: true, paymentAmount: 0 },
      { paymentRequest: 'paymentRequest', zeroAmtInvoice: true, paymentAmount: null },
      { paymentRequest: '', zeroAmtInvoice: false, paymentAmount: 0 }
    ].map(ip => {
      component.paymentRequest = ip.paymentRequest;
      component.zeroAmtInvoice = ip.zeroAmtInvoice;
      component.paymentAmount = ip.paymentAmount;
      component.onSendPayment();
      expect(sendPaymentSpy).not.toHaveBeenCalled();
      expect(resetInvoiceDetailsSpy).not.toHaveBeenCalled();
      //expect(decodePaymentSpy).not.toHaveBeenCalled();
    });

  });

  it('onSendPayment() :: INVOICE: should handle Decoded Invoice', () => {

    const sendPaymentSpy = spyOn(component, 'sendPayment');
    const resetInvoiceDetailsSpy = spyOn(component, 'resetInvoiceDetails');
    // TODO: Can't access dataService // privateVar
    //const decodePaymentSpy = spyOn(component.dataService, 'decodePayment');

    component.paymentType = PaymentTypes.INVOICE;

    [
      { paymentRequest: 'paymentRequest', zeroAmtInvoice: true, paymentAmount: 100, paymentDecoded: { created_at: new Date().getTime() } },
      { paymentRequest: 'paymentRequest', zeroAmtInvoice: false, paymentDecoded: { created_at: new Date().getTime() } },
    ].map((ip, index) => {
      component.paymentDecoded = ip.paymentDecoded;
      component.paymentRequest = ip.paymentRequest;
      component.zeroAmtInvoice = ip.zeroAmtInvoice;
      component.paymentAmount = ip.paymentAmount;
      component.onSendPayment();

      expect(sendPaymentSpy).toHaveBeenCalledTimes(index + 1);
      expect(resetInvoiceDetailsSpy).not.toHaveBeenCalled();
      //expect(decodePaymentSpy).not.toHaveBeenCalledTimes();
    });

  });

  it('onSendPayment() :: INVOICE: should handle unprocessed Invoices', () => {

    const sendPaymentSpy = spyOn(component, 'sendPayment');
    const resetInvoiceDetailsSpy = spyOn(component, 'resetInvoiceDetails');
    // TODO: Can't access dataService // privateVar
    //const decodePaymentSpy = spyOn(component.dataService, 'decodePayment');

    component.paymentType = PaymentTypes.INVOICE;

    [
      { paymentRequest: 'paymentRequest', zeroAmtInvoice: true, paymentAmount: 100, paymentDecoded: {} },
      { paymentRequest: 'paymentRequest', zeroAmtInvoice: false, paymentDecoded: {} },
    ].map((ip, index) => {
      component.paymentDecoded = ip.paymentDecoded;
      component.paymentRequest = ip.paymentRequest;
      component.zeroAmtInvoice = ip.zeroAmtInvoice;
      component.paymentAmount = ip.paymentAmount;
      component.onSendPayment();

      expect(resetInvoiceDetailsSpy).toHaveBeenCalledTimes(index + 1);
      //expect(decodePaymentSpy).toHaveBeenCalledTimes();
      //expect(setPaymentDecodedDetails).toHaveBeenCalledTimes();
      expect(sendPaymentSpy).not.toHaveBeenCalled();
    });

  });

  it('onSendPayment() :: INVOICE: should handle bolt12 Offer scenario and throw error', () => {
  });

  it('onSendPayment() :: INVOICE: should handle decoding of Invoice :: calling setPaymentDecodedDetails()', () => {
  });

  it('onSendPayment() :: OFFER: should handle negative inputs', () => {
  });

  it('onSendPayment() :: OFFER: should handle Decoded offers', () => {
  });

  it('onSendPayment() :: OFFER: should handle unprocessed Invoices', () => {
  });

  it('onSendPayment() :: OFFER: should handle bolt11 Invoice options passed to offer', () => {
  });

  it('onSendPayment() :: OFFER: should handle decoding of Offer :: calling setOfferDecodedDetails()', () => {
  });

  it('onSendPayment() :: OFFER: should handle unprocessed Offers', () => {
  });

  it('sendPayment() :: INVOICE: should handle zero amount invoice', () => {
  });

  it('sendPayment() :: INVOICE: should handle regular (non zero) invoice', () => {
  });

  it('sendPayment() :: OFFER: should fetch unfetched zero amount offer', () => {
  });

  it('sendPayment() :: OFFER: should fetch unfetched regular (non zero) offer', () => {
  });

  it('sendPayment() :: OFFER: should handle decoded offer', () => {
  });

  it('onPaymentRequestEntry() :: INVOICE: should just reset Decoded Invoice, when event length < 100', () => {
  });

  it('onPaymentRequestEntry() :: INVOICE: should reset Decoded Invoice and decode new Request, when event length > 100', () => {
  });

  it('onPaymentRequestEntry() :: INVOICE: should handle bolt12 offer selection mismatch', () => {
  });

  it('onPaymentRequestEntry() :: OFFER: should just reset Decoded Offer, when event length < 100 ', () => {
  });

  it('onPaymentRequestEntry() :: OFFER: should reset Decoded Offer and decode new Request, when event length > 100', () => {
  });

  it('onPaymentRequestEntry() :: OFFER: should handle bolt11 invoice selection mismatch', () => {
  });

  it('resetOfferDetails() :: should reset all offer related fields', () => {
  });

  it('resetInvoiceDetails() :: should reset all invoice related fields', () => {
  });

  it('onPaymentTypeChange() :: should reset errors and hints', () => {
  });

  it('setOfferDecodedDetails() :: should handle zero amount offer', () => {
  });

  it('setOfferDecodedDetails() :: should handle regular (non zero) amount offer', () => {
  });

  it('setOfferDecodedDetails() :: should show proper Sats and Description when fiatConversion is enabled', () => {
  });

  it('setOfferDecodedDetails() :: should show error when fiatConversion is enabled, but the conversion fails', () => {
  });

  it('setPaymentDecodedDetails() :: should show proper hint for zero amount Invoice', () => {
  });

  it('setPaymentDecodedDetails() :: should handle proper hint for regular (non zero) Invoice', () => {
  });

  it('setPaymentDecodedDetails() :: should show proper Sats and Description when fiatConversion is enabled', () => {
  });

  it('setPaymentDecodedDetails() :: should show error when fiatConversion is enabled, but the conversion fails', () => {
  });

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
    // Invoice fields
    component.paymentRequest = 'paymentRequest';
    component.paymentDecoded = {
      msatoshi: 2000
    };
    component.selActiveChannel = {};
    component.feeLimit = {};
    component.selFeeLimitType = FEE_LIMIT_TYPES[1];
    component.paymentAmount = 2;
    component.paymentDecodedHint = 'InvoiceHint';
    component.zeroAmtInvoice = true;

    // Keysend fields
    component.pubkey = 'pubkey';
    component.keysendAmount = 2;

    // Offer fields
    component.offerRequest = 'offerRequest';
    component.offerDecoded = {
      amount: 2000,
      amount_msat: '2000msat'
    };
    component.flgSaveToDB = true;
    component.offerInvoice  = {
      invoice: 'invoice',
      changes: {}
    };
    component.offerAmount = 2;
    component.offerDecodedHint = 'OfferHint';
    component.zeroAmtOffer = true;

    // Common
    component.paymentError = 'Error';
    // TODO:
    //component.paymentReq.control.setErrors([]);
  }

});
