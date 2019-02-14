import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import {
  FirebaseBackendService,
  MemberStats,
  RoomDataSource,
} from '../../services/firebase-backend.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent implements OnInit, OnDestroy {
  constructor(
    route: ActivatedRoute,
    private readonly firebaseBackend: FirebaseBackendService
  ) {
    this.roomKey$ = route.params.pipe(map(params => params.key));
    this.roomKey$.pipe(distinctUntilChanged()).subscribe(roomKey => {
      if (this.roomDataSource != null) {
        this.roomDataSource.dispose();
      }
      this.roomDataSource = this.firebaseBackend.getRoomDataSource(roomKey);
    });
  }

  readonly roomKey$: Observable<string>;
  roomDataSource: RoomDataSource;

  ngOnInit() {
    console.log('ngOnInit');
  }

  ngOnDestroy() {
    console.log('ngOnDestroy');
  }
}
