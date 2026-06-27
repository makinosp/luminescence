import { makeAutoObservable, runInAction } from 'mobx';

/**
 * UI state store.
 * Manages local UI state only — never triggers API calls.
 * Isolated from business logic stores.
 */
export class UIStore {
  isModalOpen = false;
  activeTab = 'transactions';
  formData: Record<string, unknown> = {};

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Open a modal dialog.
   */
  openModal(): void {
    this.isModalOpen = true;
  }

  /**
   * Close the modal dialog.
   */
  closeModal(): void {
    this.isModalOpen = false;
    this.formData = {};
  }

  /**
   * Switch the active tab.
   */
  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  /**
   * Set form data for the current form.
   */
  setFormData(data: Record<string, unknown>): void {
    this.formData = { ...this.formData, ...data };
  }

  /**
   * Clear form data.
   */
  clearFormData(): void {
    this.formData = {};
  }

  /**
   * Reset all UI state.
   */
  reset(): void {
    runInAction(() => {
      this.isModalOpen = false;
      this.activeTab = 'transactions';
      this.formData = {};
    });
  }
}
