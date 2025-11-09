import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { IonInput, IonIcon, IonButton } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-save-mix-modal',
  templateUrl: './save-mix-modal.component.html',
  styleUrls: ['./save-mix-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonInput, IonIcon, IonButton, FormsModule],
})
export class SaveMixModalComponent {
  @Input() currentMixName?: string;
  mixName = '';

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    // If editing an existing mix, prefill the name
    if (this.currentMixName) {
      this.mixName = this.currentMixName;
    }
  }

  dismiss() {
    this.modalController.dismiss(null, 'cancel');
  }

  save() {
    if (this.mixName.trim()) {
      this.modalController.dismiss({ name: this.mixName.trim() }, 'save');
    }
  }
}
