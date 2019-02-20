import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
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

  constructor(private readonly firebaseBackend: FirebaseBackendService,
              private readonly actionSheetController: ActionSheetController) {
  }

  ngOnInit() {
    this.activeRooms$ = this.firebaseBackend.activeRooms$;
  }

  trackRoom(index: number, room: RoomStats) {
    return room.key;
  }

  async shouldShowMenu() {
    // TODO: add action handler
    const actionSheet = await this.actionSheetController.create({
      header: 'メニュー',
      buttons: [
        {
          text: '部屋を作成する',
          icon: 'add',
          role: 'create room',
          handler: () => {},
        },
        {
          text: 'ニックネームをつける',
          icon: 'person',
          role: 'edit name',
          handler: () => {},
        },
        {
          text: 'キャンセル',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

}
