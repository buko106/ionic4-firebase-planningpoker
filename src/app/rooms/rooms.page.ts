import { Component, OnInit } from '@angular/core';
import {
  FirebaseBackendService,
  RoomStats,
} from '../services/firebase-backend.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.page.html',
  styleUrls: ['./rooms.page.scss'],
})
export class RoomsPage implements OnInit {
  activeRooms$: Observable<RoomStats[]>;

  constructor(private readonly firebaseBackend: FirebaseBackendService) {}

  ngOnInit() {
    this.activeRooms$ = this.firebaseBackend.activeRooms$;
  }

  trackRoom(index: number, room: RoomStats) {
    return room.key;
  }
}
