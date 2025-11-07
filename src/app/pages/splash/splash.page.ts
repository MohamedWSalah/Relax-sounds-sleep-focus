import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  imports: [CommonModule],
})
export class SplashPage implements OnInit {
  particles: number[] = [];
  private router = inject(Router);

  ngOnInit() {
    // Generate floating particles
    this.particles = Array.from({ length: 30 }, (_, i) => i);

    // Start the splash animation sequence
    setTimeout(() => {
      this.navigateToHome();
    }, 3000);
  }

  private navigateToHome() {
    this.router.navigate(['/home'], { replaceUrl: true });
  }
}
