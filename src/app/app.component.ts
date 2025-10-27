import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  // Initialize theme service (will auto-load saved theme)
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private backButtonListener?: PluginListenerHandle;

  constructor() {}

  ngOnInit(): void {
    this.setupBackButtonHandler();
  }

  ngOnDestroy(): void {
    this.backButtonListener?.remove();
  }

  private setupBackButtonHandler(): void {
    // Handle Android hardware back button
    App.addListener('backButton', ({ canGoBack }) => {
      const currentUrl = this.router.url;

      // If on home page, minimize the app
      if (currentUrl === '/home' || currentUrl === '/') {
        App.minimizeApp();
      } else if (canGoBack) {
        // Otherwise, navigate back
        window.history.back();
      }
    }).then((listener) => {
      this.backButtonListener = listener;
    });
  }
}
