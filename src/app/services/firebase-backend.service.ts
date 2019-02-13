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

  async ready(): Promise<void> {
    await this.serverTimeOffsetSource
      .pipe(
        filter(value => value != null),
        take(1)
      )
      .toPromise();
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
    await this.ready();
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
