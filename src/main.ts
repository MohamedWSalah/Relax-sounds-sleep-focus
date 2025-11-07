import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { RouteReuseStrategy } from '@angular/router';
import {
  IonicRouteStrategy,
  ModalController,
  AlertController,
  ToastController,
  LoadingController,
} from '@ionic/angular';

import { AppComponent } from './app/app.component';
import { routes } from './app/app-routing.module';
import { ChartService } from './app/services/chart.service';
import { registerIcons } from './app/config/icons.config';

// Register all Ionicons used in the application
registerIcons();

// Initialize Chart.js service early to register Chart.js components
// This ensures Chart.js is registered before any component tries to use it
new ChartService();

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideIonicAngular({
      mode: 'md',
    }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Explicitly provide Ionic controllers
    ModalController,
    AlertController,
    ToastController,
    LoadingController,
  ],
}).catch((err) => console.log(err));
