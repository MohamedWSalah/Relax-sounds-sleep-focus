import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { environment } from '../../environments/environment';

/**
 * Firebase Service
 * Handles core Firebase app initialization
 * Use this service to get the Firebase app instance for other Firebase services
 */
@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  #app?: FirebaseApp;
  #isInitialized = false;

  initializeApp(): FirebaseApp {
    if (!this.#isInitialized) {
      this.#app = initializeApp(environment.firebase);
      this.#isInitialized = true;
      console.log('Firebase initialized successfully');
    } else {
      console.log('Firebase already initialized');
    }
    return this.#app!;
  }

  get app(): FirebaseApp | undefined {
    return this.#app;
  }

  get isInitialized(): boolean {
    return this.#isInitialized;
  }
}
