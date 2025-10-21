import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-premium-modal',
  templateUrl: './premium-modal.component.html',
  styleUrls: ['./premium-modal.component.scss'],
  imports: [CommonModule],
})
export class PremiumModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() upgrade = new EventEmitter<void>();

  closeModal(): void {
    this.close.emit();
  }

  upgradeToPremium(): void {
    this.upgrade.emit();
  }

  restorePurchases(): void {
    // Implement restore purchases logic
    console.log('Restore purchases clicked');
  }
}
