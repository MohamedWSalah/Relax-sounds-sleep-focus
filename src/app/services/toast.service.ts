import { Injectable, inject } from '@angular/core';
import { ToastController, ToastOptions } from '@ionic/angular';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ToastControllerService {
  #toastController = inject(ToastController);

  dismiss(): Observable<void> {
    return from(this.#toastController.dismiss()).pipe(
      switchMap(() => of(undefined as void)),
      catchError((error) => {
        console.warn('Failed to dismiss toast:', error);
        return of(undefined as void);
      })
    );
  }

  create(options: ToastOptions): Observable<HTMLIonToastElement> {
    return from(this.#toastController.create(options)).pipe(
      switchMap((toast) =>
        from(toast.present()).pipe(
          switchMap(() => of(toast)),
          catchError((error) => {
            console.warn('Failed to present toast:', error);
            return of(toast);
          })
        )
      ),
      catchError((error) => {
        console.warn('Failed to create toast:', error);
        throw error;
      })
    );
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
    }).subscribe();
  }
}
