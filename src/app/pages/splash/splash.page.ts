import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  imports: [CommonModule, IonicModule],
})
export class SplashPage implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // Start the splash animation sequence
    setTimeout(() => {
      this.navigateToHome();
    }, 1500);
  }

  private navigateToHome() {
    this.router.navigate(['/home']);
  }
}
