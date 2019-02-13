import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { RoomsPage } from './rooms.page';
import { DetailComponent } from './detail/detail.component';
import { FirebaseBackendService } from '../services/firebase-backend.service';

const routes: Routes = [
  {
    path: '',
    component: RoomsPage,
  },
  {
    path: ':key',
    component: DetailComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [RoomsPage, DetailComponent],
  providers: [FirebaseBackendService],
})
export class RoomsPageModule {}
