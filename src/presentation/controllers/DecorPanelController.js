import { Actions } from '../../core/state/actions.js';
import { DECOR_BACKGROUNDS, DECOR_FRAMES, DECOR_STICKERS, STORAGE_KEYS } from '../../config/constants.js';
import { localStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter.js';

export class DecorPanelController {
  constructor(store, reducers) {
    this.store = store;
    this.reducers = reducers;
    this.backgroundSelect = document.getElementById('backgroundSelect');
    this.frameSelect = document.getElementById('frameSelect');
    this.stickerSelect = document.getElementById('stickerSelect');
    this.titleInput = document.getElementById('titleInput');
    this.unsubscribe = null;
  }

  async init() {
    this._renderOptions();
    await this._loadStoredSettings();
    this._setupEvents();
    this._syncFromState();
    this.unsubscribe = this.store.subscribe(() => this._syncFromState());
  }

  _renderOptions() {
    this.backgroundSelect.innerHTML = DECOR_BACKGROUNDS.map(option => `<option value="${option.id}">${option.label}</option>`).join('');
    this.frameSelect.innerHTML = DECOR_FRAMES.map(option => `<option value="${option.id}">${option.label}</option>`).join('');
    this.stickerSelect.innerHTML = DECOR_STICKERS.map(option => `<option value="${option.id}">${option.label}</option>`).join('');
  }

  async _loadStoredSettings() {
    const stored = await localStorageAdapter.get(STORAGE_KEYS.SETTINGS);
    if (stored?.decorations) {
      this.store.dispatch(Actions.updateDecorations(stored.decorations), this.reducers);
    }
  }

  _setupEvents() {
    this.backgroundSelect?.addEventListener('change', () => this._updateDecorations({ background: this.backgroundSelect.value }));
    this.frameSelect?.addEventListener('change', () => this._updateDecorations({ frame: this.frameSelect.value }));
    this.stickerSelect?.addEventListener('change', () => this._updateDecorations({ sticker: this.stickerSelect.value }));
    this.titleInput?.addEventListener('input', () => this._updateDecorations({ title: this.titleInput.value }));
  }

  _syncFromState() {
    const decor = this.store.select(state => state.ui.decorations);
    if (!decor) return;
    if (this.backgroundSelect) this.backgroundSelect.value = decor.background;
    if (this.frameSelect) this.frameSelect.value = decor.frame;
    if (this.stickerSelect) this.stickerSelect.value = decor.sticker;
    if (this.titleInput && this.titleInput.value !== decor.title) this.titleInput.value = decor.title || '';
  }

  async _updateDecorations(next) {
    this.store.dispatch(Actions.updateDecorations(next), this.reducers);
    const state = this.store.getState();
    await localStorageAdapter.set(STORAGE_KEYS.SETTINGS, { decorations: state.ui.decorations });
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
}
