import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, merge, Observable, of, Subject } from 'rxjs';
import { delay, distinctUntilChanged, map } from 'rxjs/operators';
import {
  CARD2TEXT,
  CardChoice,
  FirebaseBackendService,
  MemberStats,
  RoomDataSource,
} from '../../services/firebase-backend.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent {
  constructor(
    route: ActivatedRoute,
    private readonly firebaseBackend: FirebaseBackendService
  ) {
    this.roomKey$ = route.params.pipe(map(params => params.key));
    this.roomKey$.pipe(distinctUntilChanged()).subscribe(roomKey => {
      if (this.roomDataSource != null) {
        this.roomDataSource.dispose();
      }
      this.roomDataSource = this.firebaseBackend.buildRoomDataSource(roomKey);
      const goButtonBlocked$ = merge(
        of(false),
        this.goButtonBlocker.pipe(map(() => true)),
        this.goButtonBlocker.pipe(
          delay(1000),
          map(() => false)
        )
      );

      this.goButtonDisabled$ = combineLatest(
        this.roomDataSource.revealed$,
        this.roomDataSource.activeMembers$,
        goButtonBlocked$
      ).pipe(
        map(([revealed, activeMembers, blocked]) => {
          return (
            blocked ||
            revealed ||
            activeMembers.some(member => member.card_choice == null)
          );
        })
      );
      const resetButtonBlocked$ = merge(
        of(false),
        this.resetButtonBlocker.pipe(map(() => true)),
        this.resetButtonBlocker.pipe(
          delay(1000),
          map(() => false)
        )
      );

      this.resetButtonDisabled$ = combineLatest(
        this.roomDataSource.revealed$,
        resetButtonBlocked$
      ).pipe(
        map(([revealed, blocked]) => {
          return blocked || !revealed;
        })
      );
    });
  }

  readonly roomKey$: Observable<string>;
  roomDataSource: RoomDataSource;
  private goButtonBlocker = new Subject<void>();
  private resetButtonBlocker = new Subject<void>();
  goButtonDisabled$: Observable<boolean>;
  resetButtonDisabled$: Observable<boolean>;

  card2text(choice: CardChoice): string {
    return CARD2TEXT[choice];
  }

  trackMember(index: number, member: MemberStats) {
    return member.key;
  }

  onClickGoButton(event: MouseEvent) {
    this.goButtonBlocker.next();
    // TODO: set revealed to true
  }
  onClickResetButton(event: MouseEvent) {
    this.resetButtonBlocker.next();
    // TODO: reset all points and set revealed to false
  }
}
