import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'splash',
    loadComponent: () =>
      import('./pages/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'sleep-timer',
    loadComponent: () =>
      import('./pages/sleep-timer/sleep-timer.page').then(
        (m) => m.SleepTimerPage
      ),
  },
  {
    path: '',
    redirectTo: '/splash',
    pathMatch: 'full',
  },
];
