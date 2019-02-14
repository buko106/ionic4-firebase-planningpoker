import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/database';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';

const FIREBASE_OPTIONS = {
  apiKey: 'AIzaSyA1PFaN-K0s8zgKP4rDL0E5_hvmKvXC5ME\n',
  databaseURL: 'https://buko106-planningpoker.firebaseio.com',
};

const ROOM_INACTIVITY_THRESHOLD_MILLISECOND = 1000 * 60 * 10; // 10 min.
const MEMBER_INACTIVITY_THRESHOLD_MILLISECOND = 1000 * 60 * 10; // 10 min.

export interface RoomStats {
  name: string;
  key: string;
  activeMemberCount: number;
}

export const CARD2TEXT = {
  zero: '0',
  half: '1/2',
  one: '1',
  two: '2',
  three: '3',
  five: '5',
  eight: '8',
  question_mark: '?',
};

export type CardChoice = keyof typeof CARD2TEXT;

export interface MemberStats {
  display_name: string;
  key: string;
  card_choice: CardChoice | null;
}

export interface RoomDataSource {
  readonly activeMembers$: Observable<MemberStats[]>;
  readonly displayName: string;
  dispose(): void;
}

class RoomDataSourceImpl implements RoomDataSource {
  constructor(
    private readonly firebaseBackend: FirebaseBackendService,
    private readonly roomRef: firebase.database.Reference
  ) {
    this.initializeRoomStats();
    this.subscribeMemberStatsChange();
  }
  private activeMembersSource = new Subject<MemberStats[]>();
  readonly activeMembers$ = this.activeMembersSource.asObservable();
  displayName = '';

  private async initializeRoomStats() {
    this.displayName = (await this.roomRef.child('name').once('value')).val();
  }

  private async subscribeMemberStatsChange() {
    await this.firebaseBackend.serverTimeOffsetReady();
    this.roomRef
      .child('members')
      .orderByChild('joined_at')
      .on('value', snapshot => {
        console.log('snapshot of the room', snapshot);
        if (snapshot == null) {
          this.activeMembersSource.next(null);
          return;
        }

        const memberStats: MemberStats[] = [];
        snapshot.forEach(memberSnapshot => {
          // TODO: filter out inactive members
          memberStats.push({
            key: memberSnapshot.key,
            display_name: memberSnapshot.child('display_name').val(),
            card_choice: memberSnapshot.child('card_choice').val() || null,
          });
        });
        console.log('member stats', memberStats);
        this.activeMembersSource.next(memberStats);
      });
  }

  dispose() {
    console.log('disposing...');
    this.roomRef.off();
  }
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseBackendService {
  constructor() {
    firebase.initializeApp(FIREBASE_OPTIONS);
    this.database = firebase.database();
    this.roomsRef = this.database.ref('/rooms');
    this.initAsync();
  }

  private database: firebase.database.Database;
  private roomsRef: firebase.database.Reference;
  private serverTimeOffsetSource = new BehaviorSubject<number>(null);
  private activeRoomsSource = new Subject<RoomStats[]>();

  private async initAsync() {
    this.startSyncingServerTimeOffset();
    this.subscribeRoomStatsChange();
  }

  async serverTimeOffsetReady(): Promise<void> {
    await this.serverTimeOffsetSource
      .pipe(
        filter(value => value != null),
        take(1)
      )
      .toPromise();
  }

  get serverTimeOffset(): number {
    return this.serverTimeOffsetSource.value;
  }

  getRoomDataSource(roomKey: string) {
    return new RoomDataSourceImpl(this, this.roomsRef.child(roomKey));
  }

  private startSyncingServerTimeOffset() {
    this.database
      .ref('.info/serverTimeOffset')
      .on('value', serverTimeOffset => {
        if (serverTimeOffset != null) {
          this.serverTimeOffsetSource.next(serverTimeOffset.val());
        }
      });
  }

  private async subscribeRoomStatsChange() {
    await this.serverTimeOffsetReady();
    this.roomsRef
      .startAt(
        new Date().getTime() +
          this.serverTimeOffsetSource.value -
          ROOM_INACTIVITY_THRESHOLD_MILLISECOND
      )
      .orderByChild('last_seen_at')
      .on('value', snapshot => {
        if (snapshot == null) {
          this.activeRoomsSource.next(null);
          return;
        }

        const roomStats: RoomStats[] = [];
        snapshot.forEach(roomSnapshot => {
          const activeMemberCount = roomSnapshot.child('members').numChildren(); // FIXME: consider last_seen_at of each user
          roomStats.push({
            key: roomSnapshot.key,
            name: roomSnapshot.child('name').val(),
            activeMemberCount,
          });
        });
        this.activeRoomsSource.next(roomStats);
      });
  }

  get activeRooms$(): Observable<RoomStats[]> {
    return this.activeRoomsSource.asObservable();
  }
}
