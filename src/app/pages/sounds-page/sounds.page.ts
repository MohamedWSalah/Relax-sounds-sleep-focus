import {
  Component,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
  computed,
  signal,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { switchMap, tap } from 'rxjs/operators';
import { IonRange, IonIcon } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { SoundsService } from 'src/app/services/sounds.service';
import type { Sound, Category, Subcategory } from 'src/app/types';
import { ToastControllerService } from 'src/app/services/toast.service';
import { MixesService } from 'src/app/services/mixes.service';
import { InAppPurchaseService } from 'src/app/services/in-app-purchase.service';
import { SaveMixModalComponent } from 'src/app/components/save-mix-modal/save-mix-modal.component';
import { PremiumUpsellModalComponent } from 'src/app/components/premium-upsell-modal/premium-upsell-modal.component';

@Component({
  selector: 'app-sounds',
  imports: [CommonModule, IonRange, IonIcon],
  providers: [ModalController],
  templateUrl: './sounds.page.html',
  styleUrl: './sounds.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoundsPage implements OnInit, AfterViewInit {
  #soundsService = inject(SoundsService);
  #toastController = inject(ToastControllerService);
  #destroyRef = inject(DestroyRef);
  #modalController = inject(ModalController);
  #mixesService = inject(MixesService);
  #inAppPurchaseService = inject(InAppPurchaseService);

  @ViewChild('categoriesRow', { read: ElementRef })
  categoriesRow?: ElementRef<HTMLDivElement>;

  selectedCategory = this.#soundsService.selectedCategory;
  selectedSubcategory = this.#soundsService.selectedSubcategory;
  categories = this.#soundsService.categories;
  filteredSounds = this.#soundsService.filteredSounds;

  // Get subcategories for the currently selected category
  currentSubcategories = computed(() => {
    const categoryId = this.selectedCategory();
    const categories = this.categories();

    if (categoryId === 'active' || categoryId === 'favorites') {
      return null;
    }

    const category = categories.find((cat) => cat.id === categoryId);
    return category?.subcategories || null;
  });

  // Check if there are any playing sounds
  hasPlayingSounds = computed(
    () => this.#soundsService.playingSounds().length > 0
  );

  // Check if we should show empty state for Active category
  showActiveEmptyState = computed(() => {
    return (
      this.selectedCategory() === 'active' && this.filteredSounds().length === 0
    );
  });

  // Check if we should show empty state for Favorites category
  showFavoritesEmptyState = computed(() => {
    return (
      this.selectedCategory() === 'favorites' &&
      this.filteredSounds().length === 0
    );
  });

  // Gesture handling
  private touchStartX = 0;
  private touchStartY = 0;
  private touchTarget: EventTarget | null = null;
  private readonly SWIPE_THRESHOLD = 50; // Minimum distance for swipe
  private readonly EDGE_THRESHOLD = 80; // Distance from edge to trigger swipe
  private readonly GESTURE_HINTS_KEY = 'soundsPageGestureHintsSeen';

  // Show gesture hints signal
  showGestureHints = signal(false);

  // Swipe feedback signals
  isSwipingLeft = signal(false);
  isSwipingRight = signal(false);
  swipeProgress = signal(0); // 0 to 1 representing swipe progress
  swipeStarted = signal(false);

  ngOnInit(): void {
    this.#checkAndShowGestureHints();
  }

  ngAfterViewInit(): void {
    // Component is ready, can now scroll categories
  }

  /**
   * Check if gesture hints should be shown and handle the animation
   */
  #checkAndShowGestureHints(): void {
    const hintsSeen = localStorage.getItem(this.GESTURE_HINTS_KEY);

    if (!hintsSeen) {
      // Show hints
      this.showGestureHints.set(true);

      // Hide after 2 flashes (4 seconds total - 2s per flash cycle)
      setTimeout(() => {
        this.showGestureHints.set(false);
        localStorage.setItem(this.GESTURE_HINTS_KEY, 'true');
      }, 4000);
    }
  }

  /**
   * Check if touch target is within a volume slider or interactive element
   */
  #isTouchOnInteractiveElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof Element)) {
      return false;
    }

    const element = target as HTMLElement;

    // Check if touch is on volume slider or sound bar
    const isVolumeSlider =
      element.closest('.volume-slider') !== null ||
      element.closest('.sound-bar') !== null ||
      element.closest('.sound-bar-container') !== null ||
      element.classList.contains('volume-slider') ||
      element.classList.contains('sound-bar') ||
      element.classList.contains('sound-bar-container');

    // Check if touch is on category or subcategory tabs
    const isCategoryTab =
      element.closest('.category-container') !== null ||
      element.closest('.category-bar') !== null ||
      element.closest('.category-btn') !== null ||
      element.closest('.subcategory-bar') !== null ||
      element.closest('.subcategory-btn') !== null ||
      element.closest('.subcategory-container') !== null ||
      element.closest('.category-tabs') !== null ||
      element.closest('.tab') !== null ||
      element.classList.contains('tab') ||
      element.classList.contains('category-btn') ||
      element.classList.contains('subcategory-btn');

    // Check if touch is on favorite heart
    const isFavoriteButton =
      element.closest('.favorite-heart') !== null ||
      element.classList.contains('favorite-heart');

    return isVolumeSlider || isCategoryTab || isFavoriteButton;
  }

  /**
   * Handle touch start event
   */
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchTarget = event.target;
    this.swipeStarted.set(false);
    this.isSwipingLeft.set(false);
    this.isSwipingRight.set(false);
    this.swipeProgress.set(0);
  }

  /**
   * Handle touch move event and provide visual feedback
   */
  onTouchMove(event: TouchEvent): void {
    // Ignore if touch started on interactive elements
    if (this.#isTouchOnInteractiveElement(this.touchTarget)) {
      return;
    }

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;

    const deltaX = currentX - this.touchStartX;
    const deltaY = currentY - this.touchStartY;

    // Only show swipe feedback if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      this.swipeStarted.set(true);

      // Determine swipe direction
      if (deltaX > 0) {
        // Swiping right (previous category)
        const currentIndex = this.categories().findIndex(
          (cat) => cat.id === this.selectedCategory()
        );
        if (currentIndex > 0) {
          this.isSwipingRight.set(true);
          this.isSwipingLeft.set(false);
          // Calculate progress (max 150px for full visual feedback)
          this.swipeProgress.set(Math.min(deltaX / 150, 1));
        }
      } else {
        // Swiping left (next category)
        const currentIndex = this.categories().findIndex(
          (cat) => cat.id === this.selectedCategory()
        );
        if (currentIndex < this.categories().length - 1) {
          this.isSwipingLeft.set(true);
          this.isSwipingRight.set(false);
          // Calculate progress (max 150px for full visual feedback)
          this.swipeProgress.set(Math.min(Math.abs(deltaX) / 150, 1));
        }
      }
    }
  }

  /**
   * Handle touch end event and detect swipe
   */
  onTouchEnd(event: TouchEvent): void {
    // Ignore if touch started on interactive elements
    if (this.#isTouchOnInteractiveElement(this.touchTarget)) {
      this.swipeStarted.set(false);
      this.isSwipingLeft.set(false);
      this.isSwipingRight.set(false);
      this.swipeProgress.set(0);
      this.touchTarget = null;
      return;
    }

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;

    // Reset swipe feedback
    this.swipeStarted.set(false);
    this.isSwipingLeft.set(false);
    this.isSwipingRight.set(false);
    this.swipeProgress.set(0);
    this.touchTarget = null;

    // Check if this was just a tap (minimal movement)
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (totalMovement < 10) {
      return; // This was a tap, not a swipe
    }

    // Check if vertical swipe is minimal (to avoid triggering on scroll)
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return; // Vertical swipe, ignore
    }

    // Check if swipe started from edge (anywhere vertically on left/right edge) or is long enough
    // Only check X position, not Y - so it works from top to bottom
    const isFromLeftEdge = this.touchStartX < this.EDGE_THRESHOLD;
    const isFromRightEdge =
      this.touchStartX > window.innerWidth - this.EDGE_THRESHOLD;
    const isLongSwipe = Math.abs(deltaX) > this.SWIPE_THRESHOLD;

    if (!isLongSwipe && !isFromLeftEdge && !isFromRightEdge) {
      return; // Not a valid swipe
    }

    // Swipe right (previous category)
    if (deltaX > 0) {
      this.#navigateToPreviousCategory();
    }
    // Swipe left (next category)
    else if (deltaX < 0) {
      this.#navigateToNextCategory();
    }
  }

  /**
   * Navigate to previous category
   */
  #navigateToPreviousCategory(): void {
    const currentIndex = this.categories().findIndex(
      (cat) => cat.id === this.selectedCategory()
    );

    if (currentIndex > 0) {
      const prevCategory = this.categories()[currentIndex - 1];
      this.selectCategory(prevCategory.id);
    }
  }

  /**
   * Navigate to next category
   */
  #navigateToNextCategory(): void {
    const currentIndex = this.categories().findIndex(
      (cat) => cat.id === this.selectedCategory()
    );

    if (currentIndex < this.categories().length - 1) {
      const nextCategory = this.categories()[currentIndex + 1];
      this.selectCategory(nextCategory.id);
    }
  }

  selectCategory(categoryId: string): void {
    this.#soundsService.selectCategory(categoryId);
    // Scroll the selected category to center after a brief delay to ensure DOM is updated
    setTimeout(() => this.#scrollCategoryToCenter(), 0);
  }

  /**
   * Scroll the selected category button to the center of the categories row
   */
  #scrollCategoryToCenter(): void {
    if (!this.categoriesRow?.nativeElement) {
      return;
    }

    const selectedCategoryId = this.selectedCategory();
    const categoryButton = this.categoriesRow.nativeElement.querySelector(
      `[data-category-id="${selectedCategoryId}"]`
    ) as HTMLElement;

    if (categoryButton) {
      // Use scrollIntoView with center option for better centering
      categoryButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }

  selectSubcategory(subcategoryId: string | null): void {
    this.#soundsService.selectSubcategory(subcategoryId);
  }

  toggleSound(selectedSound: Sound): void {
    // Check if sound is locked
    if (this.isSoundLocked(selectedSound)) {
      this.#showPremiumUpsellModal(selectedSound);
      return;
    }

    this.#soundsService.toggleSound(selectedSound);
  }

  /**
   * Show premium upsell modal
   */
  async #showPremiumUpsellModal(sound: Sound): Promise<void> {
    try {
      console.log('🔴 1. Starting modal creation', this.#modalController);

      const { PremiumUpsellModalComponent } = await import(
        '../../components/premium-upsell-modal/premium-upsell-modal.component'
      );

      const modal = await this.#modalController.create({
        component: PremiumUpsellModalComponent,
        componentProps: {
          sound: sound,
        },
        cssClass: 'premium-upsell-modal',
        backdropDismiss: true,
        showBackdrop: true,
        breakpoints: [0, 0.93, 0.95],
        initialBreakpoint: 0.95,
      });
      console.log('🔴 2. Modal created, about to present');

      await modal.present();
      console.log('🔴 3. Modal presented successfully');

      const { data, role } = await modal.onWillDismiss();

      // If purchase was successful, activate the sound
      if (role === 'purchased' && data?.success && data?.sound) {
        // Small delay to ensure premium status is fully updated
        setTimeout(() => {
          this.#soundsService.toggleSound(data.sound);
        }, 100);
      }
    } catch (error) {
      console.error('Failed to open premium upsell modal:', error);
      // Fallback to toast if modal fails
      this.#showPremiumToast();
    }
  }

  /**
   * Fallback premium prompt (toast) - only used if modal fails
   */
  #showPremiumToast(): void {
    this.#toastController.create({
      message: '🔒 Unlock premium to access all sounds',
      duration: 2000,
      position: 'bottom',
      cssClass: 'premium-toast',
      buttons: [
        {
          text: '🔓 Go Premium',
          role: 'cancel',
          handler: () => {
            // Trigger the premium purchase flow
            this.#inAppPurchaseService.purchasePremium();
          },
        },
        {
          text: '❌',
          role: 'cancel',
        },
      ],
    });
  }

  setVolume(
    sound: Sound,
    value: number | { value: number } | { lower: number; upper: number }
  ): void {
    this.#soundsService.setVolume(sound, value);
  }

  toggleMute(sound: Sound): void {
    this.#soundsService.toggleMute(sound);
  }

  isFavorite(soundId: string): boolean {
    return this.#soundsService.isFavorite(soundId);
  }

  /**
   * Check if a sound is locked (requires premium access)
   */
  isSoundLocked(sound: Sound): boolean {
    return this.#soundsService.isSoundLocked(sound);
  }

  /**
   * Get premium unlock status for template
   */
  get isPremiumUnlocked() {
    return this.#soundsService.isPremiumUnlocked;
  }

  toggleFavorite(sound: Sound, event: Event): void {
    event.stopPropagation();

    this.#soundsService
      .toggleFavorite(sound.id)
      .pipe(
        tap((isNowFavorite) =>
          this.#toastController.create({
            message: isNowFavorite
              ? `Added to Favorites 🌙`
              : `Removed from Favorites`,
            duration: 1500,
            position: 'top',
            translucent: true,
            animated: true,
            color: 'primary',
          })
        ),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe();
  }

  // Open Save Mix Modal
  async openSaveMixModal() {
    const playingSounds = this.#soundsService.playingSounds();

    if (playingSounds.length === 0) {
      return;
    }

    const modal = await this.#modalController.create({
      component: SaveMixModalComponent,
      cssClass: 'save-mix-modal',
      backdropDismiss: true,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'save' && data?.name) {
      const result = this.#mixesService.saveMix(data.name, playingSounds);

      if (result.success) {
        this.#toastController.create({
          message: result.isUpdate
            ? `✅ Mix "${data.name}" updated!`
            : `✅ Mix "${data.name}" saved!`,
          duration: 2000,
          position: 'top',
          color: 'primary',
          translucent: true,
          animated: true,
          buttons: [
            {
              text: 'x',
              role: 'cancel',
            },
          ],
        });
      }
    }
  }

  // Removed ngOnDestroy to preserve sounds when switching tabs
  // The service will handle cleanup when the app is actually closed
}
