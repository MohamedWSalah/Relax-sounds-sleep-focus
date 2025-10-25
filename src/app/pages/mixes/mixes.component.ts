import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-mixes',
  templateUrl: './mixes.component.html',
  styleUrls: ['./mixes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon],
})
export class MixesComponent {
  constructor(private router: Router) {}

  onStartCreating(): void {
    // Navigate to sounds tab to start creating a mix
    // You can implement mix creation logic here
    console.log('Start creating mix clicked');

    // For now, this will switch to the sounds tab
    // You might want to emit an event or use a service to handle this
  }
}
