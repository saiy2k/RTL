import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DataService } from '../../../shared/services/data.service';
import { LoggerService } from '../../../shared/services/logger.service';

@Component({
  selector: 'rtl-sign',
  templateUrl: './sign.component.html',
  styleUrls: ['./sign.component.scss']
})
export class SignComponent implements OnDestroy {

  public message = '';
  public signedMessage = '';
  public signature = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private dataService: DataService, private snackBar: MatSnackBar, private logger: LoggerService) {}

  onSign(): boolean|void {
    if (!this.message || this.message === '') {
      return true;
    }
    this.dataService.signMessage(this.message).pipe(takeUntil(this.unSubs[0])).subscribe((res) => {
      this.signedMessage = this.message;
      this.signature = res.signature;
    });
  }

  onMessageChange() {
    if (this.signedMessage !== this.message) {
      this.signature = '';
    }
  }

  onCopyField(payload: string) {
    this.snackBar.open('Signature copied.');
    this.logger.info('Copied Text: ' + payload);
  }

  resetData() {
    this.message = '';
    this.signature = '';
    this.signedMessage = '';
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
