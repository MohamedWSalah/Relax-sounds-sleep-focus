import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'moon-particles',
  imports: [CommonModule],
  template: `
    <div class="background-effects">
      <div class="wave-pattern"></div>
      <div class="floating-particles">
        @for (particle of backgroundParticles; track particle) {
        <div class="particle"></div>
        }
      </div>
    </div>
  `,
  styleUrl: './particles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Particles implements OnInit {
  backgroundParticles: number[] = [];

  ngOnInit(): void {
    this.backgroundParticles = Array.from({ length: 35 }, (_, i) => i);
  }
}
