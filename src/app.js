/**
 * Monster Generator Application
 * Entry point with new modular architecture
 */

import { Store } from './core/state/Store.js';
import { rootReducer, initialState } from './core/state/reducers.js';
import { SceneService } from './core/services/SceneService.js';
import { PresetService } from './core/services/PresetService.js';
import { localStorageAdapter } from './infrastructure/storage/LocalStorageAdapter.js';
import { assetLoader } from './infrastructure/assets/AssetLoader.js';
import { canvasExporter } from './infrastructure/export/CanvasExporter.js';
import { partCatalog } from './domain/catalog/PartCatalog.js';
import { Actions } from './core/state/actions.js';
import { generateUUID } from './utils/id.js';
import { STORAGE_KEYS } from './config/constants.js';

// Import UI controllers
import { PickerController } from './presentation/controllers/PickerController.js';
import { CanvasController } from './presentation/controllers/CanvasController.js';
import { ToolbarController } from './presentation/controllers/ToolbarController.js';
import { ScalerPanelController } from './presentation/controllers/ScalerPanelController.js';
import { PresetPanelController } from './presentation/controllers/PresetPanelController.js';

/**
 * Main Application Class
 */
class MonsterGeneratorApp {
  constructor() {
    // Initialize state
    this.store = new Store(initialState);
    this.store.enableHistory(50);

    // Initialize services
    this.sceneService = new SceneService(this.store, localStorageAdapter);
    this.presetService = new PresetService(this.store, localStorageAdapter);

    // Register reducers
    this.sceneService.registerReducers(rootReducer);
    this.presetService.registerReducers(rootReducer);

    // Initialize controllers with reducers (dependency injection)
    this.controllers = {
      picker: new PickerController(this.store, this.sceneService, rootReducer),
      canvas: new CanvasController(this.store, this.sceneService, rootReducer),
      toolbar: new ToolbarController(this.store, this.sceneService, rootReducer),
      scaler: new ScalerPanelController(this.store, this.sceneService, rootReducer),
      preset: new PresetPanelController(this.store, this.presetService, this.sceneService, rootReducer)
    };

    // Track initialization
    this._initialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this._initialized) return;

    console.log('[App] Initializing Monster Generator...');

    // Load saved data
    await this._loadSavedData();

    // Initialize all controllers
    for (const [name, controller] of Object.entries(this.controllers)) {
      try {
        await controller.init();
        console.log(`[App] Controller "${name}" initialized`);
      } catch (error) {
        console.error(`[App] Failed to initialize controller "${name}":`, error);
      }
    }

    // Subscribe to state changes for persistence
    this._setupPersistence();

    // Subscribe to announcements
    this._setupAnnouncements();

    this._initialized = true;
    console.log('[App] Initialization complete');
  }

  /**
   * Load saved scene and presets
   * @private
   */
  async _loadSavedData() {
    try {
      // Load scene
      const sceneData = await localStorageAdapter.get(STORAGE_KEYS.SCENE);
      if (sceneData?.items) {
        this.store.dispatch(Actions.loadScene(sceneData.items), rootReducer);
        console.log('[App] Loaded saved scene:', sceneData.items.length, 'items');
      }

      // Load presets
      const presetsData = await localStorageAdapter.get(STORAGE_KEYS.PRESETS);
      if (presetsData?.presets) {
        for (const presetData of presetsData.presets) {
          this.store.dispatch(
            Actions.savePreset(presetData.name, presetData.items),
            rootReducer
          );
        }
        console.log('[App] Loaded presets:', presetsData.presets.length);
      }
    } catch (error) {
      console.error('[App] Failed to load saved data:', error);
    }
  }

  /**
   * Setup automatic persistence
   * @private
   */
  _setupPersistence() {
    let saveTimeout;
    
    this.store.subscribe((newState, prevState) => {
      // Debounce saves
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        this._persistState(newState);
      }, 500);
    });
  }

  /**
   * Persist state to storage
   * @private
   */
  async _persistState(state) {
    try {
      // Persist scene
      await localStorageAdapter.set(STORAGE_KEYS.SCENE, {
        items: state.scene.placedItems
      });

      // Persist presets
      await localStorageAdapter.set(STORAGE_KEYS.PRESETS, {
        presets: state.presets.items
      });
    } catch (error) {
      console.error('[App] Persistence failed:', error);
    }
  }

  /**
   * Setup accessibility announcements
   * @private
   */
  _setupAnnouncements() {
    const liveRegion = document.getElementById('liveRegion');
    if (!liveRegion) return;

    this.store.subscribe((state) => {
      const announcement = state.ui.announcement;
      const timestamp = state.ui.announcementTimestamp;
      
      if (announcement && timestamp) {
        liveRegion.textContent = '';
        // Force DOM update
        requestAnimationFrame(() => {
          liveRegion.textContent = announcement;
        });
      }
    });
  }

  /**
   * Export current scene as PNG
   */
  async export() {
    const items = this.store.select(state => state.scene.placedItems);
    const filename = `monster-${Date.now()}.png`;
    await canvasExporter.download(items, filename);
  }

  /**
   * Add random part to scene
   */
  addRandomPart() {
    const random = partCatalog.getRandomPart();
    if (random) {
      this.sceneService.addItem(random.part, {
        x: 0.4 + Math.random() * 0.2,
        y: 0.4 + Math.random() * 0.2
      });
      this._announce('Zufälliges Teil hinzugefügt');
    }
  }

  /**
   * Reset the entire scene
   */
  reset() {
    this.sceneService.clear();
    this._announce('Szene zurückgesetzt');
  }

  /**
   * Make accessibility announcement
   * @private
   * @param {string} message
   */
  _announce(message) {
    this.store.dispatch(Actions.announce(message), rootReducer);
  }

  /**
   * Get app version info
   */
  get version() {
    return {
      major: 2,
      minor: 0,
      patch: 0,
      string: '2.0.0'
    };
  }
}

// Create and export singleton
export const app = new MonsterGeneratorApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
