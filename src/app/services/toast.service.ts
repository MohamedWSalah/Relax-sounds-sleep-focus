import { Injectable, inject } from '@angular/core';
import { ToastController, ToastOptions } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class ToastControllerService {
  #toastController = inject(ToastController);

  create(options: ToastOptions): void {
    this.#toastController.getTop().then((toast) => {
      if (toast) {
        toast.dismiss();
        this.#toastController.create(options).then((toast) => {
          toast.present();
        });
      } else {
        this.#toastController.create(options).then((toast) => {
          toast.present();
        });
      }
    });
  }

  /**
   * Present a simple toast message
   * @param message The message to display
   * @param duration Duration in milliseconds (default: 2000)
   * @param position Position of the toast (default: 'bottom')
   */
  presentToast(
    message: string,
    duration: number = 2000,
    position: 'top' | 'middle' | 'bottom' = 'bottom'
  ): void {
    this.create({
      message,
      duration,
      position,
      cssClass: 'custom-toast',
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
        },
      ],
    });
  }
}
