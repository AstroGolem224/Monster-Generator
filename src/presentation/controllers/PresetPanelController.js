/**
 * Preset Panel Controller - Manages preset save/load/gallery actions
 */

import { Actions } from '../../core/state/actions.js';

export class PresetPanelController {
  constructor(store, presetService, sceneService, reducers) {
    this.store = store;
    this.presetService = presetService;
    this.sceneService = sceneService;
    this.reducers = reducers;
    
    this.nameInput = document.getElementById('presetName');
    this.selectEl = document.getElementById('presetSelect');
    this.saveBtn = document.getElementById('savePresetBtn');
    this.loadBtn = document.getElementById('loadPresetBtn');
    this.deleteBtn = document.getElementById('deletePresetBtn');
    this.renameBtn = document.getElementById('renamePresetBtn');
    this.duplicateBtn = document.getElementById('duplicatePresetBtn');
    this.gallery = document.getElementById('presetGallery');
    this.importTextarea = document.getElementById('presetImportTextarea');
    this.importBtn = document.getElementById('importPresetBtn');
    this.exportBtn = document.getElementById('exportPresetBtn');
  }

  async init() {
    this._setupEventListeners();
    this._subscribeToState();
    this._renderPresets();
  }

  _setupEventListeners() {
    this.saveBtn?.addEventListener('click', () => this._handleSave());
    this.loadBtn?.addEventListener('click', () => this._handleLoad());
    this.deleteBtn?.addEventListener('click', () => this._handleDelete());
    this.renameBtn?.addEventListener('click', () => this._handleRename());
    this.duplicateBtn?.addEventListener('click', () => this._handleDuplicate());
    this.importBtn?.addEventListener('click', () => this._handleImport());
    this.exportBtn?.addEventListener('click', () => this._handleExport());

    this.nameInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this._handleSave();
      }
    });
  }

  _subscribeToState() {
    this.store.subscribe((state, prevState) => {
      const presetsChanged = JSON.stringify(state.presets.items) !== JSON.stringify(prevState?.presets?.items);
      if (presetsChanged) {
        this._renderPresets();
      }
    });
  }

  _renderPresets() {
    const presets = this.presetService.getPresets();
    const selectedValue = this.selectEl?.value || '';

    if (this.selectEl) {
      this.selectEl.innerHTML = '<option value="">– auswählen –</option>' +
        presets.map(p => `<option value="${escapeHtml(p.name)}" ${p.name === selectedValue ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');
    }

    if (this.gallery) {
      if (presets.length === 0) {
        this.gallery.innerHTML = '<div class="preset-gallery__empty">Noch keine Presets gespeichert</div>';
      } else {
        this.gallery.innerHTML = '';
        presets.forEach((preset) => {
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'preset-card';
          card.dataset.preset = preset.name;
          if (preset.name === this.selectEl?.value) {
            card.dataset.selected = 'true';
          }

          const preview = renderPresetPreview(preset.items);
          card.innerHTML = `
            <span class="preset-card__thumb-wrap"><img class="preset-card__thumb" alt="Preset ${escapeHtml(preset.name)}" src="${preview}" /></span>
            <span class="preset-card__name">${escapeHtml(preset.name)}</span>
            <span class="preset-card__meta">${preset.items.length} Teile</span>
          `;

          card.addEventListener('click', () => {
            if (this.selectEl) this.selectEl.value = preset.name;
            this._renderPresets();
          });

          card.addEventListener('dblclick', () => {
            if (this.selectEl) this.selectEl.value = preset.name;
            this._handleLoad();
          });

          this.gallery.appendChild(card);
        });
      }
    }
  }

  _handleSave() {
    const name = this.nameInput?.value.trim();
    if (!name) {
      this._announce('Bitte einen Namen eingeben');
      return;
    }

    const result = this.presetService.savePreset(name);
    if (result.success) {
      if (this.nameInput) this.nameInput.value = '';
      if (this.selectEl) this.selectEl.value = result.name;
      this._announce(`Preset "${result.name}" gespeichert`);
      this._renderPresets();
    } else {
      this._announce(result.error || 'Speichern fehlgeschlagen');
    }
  }

  _handleLoad() {
    const name = this.selectEl?.value;
    if (!name) {
      this._announce('Bitte ein Preset auswählen');
      return;
    }

    const result = this.presetService.loadPreset(name);
    this._announce(result.success ? `Preset "${name}" geladen` : (result.error || 'Laden fehlgeschlagen'));
  }

  _handleDelete() {
    const name = this.selectEl?.value;
    if (!name) {
      this._announce('Bitte ein Preset zum Löschen auswählen');
      return;
    }

    const confirmed = confirm(`Möchtest du das Preset "${name}" wirklich löschen?`);
    if (!confirmed) return;

    const result = this.presetService.deletePreset(name);
    if (result.success) {
      if (this.selectEl) this.selectEl.value = '';
      this._announce(`Preset "${name}" gelöscht`);
    } else {
      this._announce(result.error || 'Löschen fehlgeschlagen');
    }
  }

  _handleRename() {
    const current = this.selectEl?.value;
    if (!current) {
      this._announce('Bitte zuerst ein Preset auswählen');
      return;
    }

    const nextName = prompt('Neuer Preset-Name', current)?.trim();
    if (!nextName || nextName === current) return;

    const result = this.presetService.renamePreset(current, nextName);
    if (result.success) {
      if (this.selectEl) this.selectEl.value = result.name;
      this._announce(`Preset umbenannt zu "${result.name}"`);
    } else {
      this._announce(result.error || 'Umbenennen fehlgeschlagen');
    }
  }

  _handleDuplicate() {
    const current = this.selectEl?.value;
    if (!current) {
      this._announce('Bitte zuerst ein Preset auswählen');
      return;
    }

    const result = this.presetService.duplicatePreset(current);
    if (result.success) {
      if (this.selectEl) this.selectEl.value = result.name;
      this._announce(`Preset dupliziert als "${result.name}"`);
    } else {
      this._announce(result.error || 'Duplizieren fehlgeschlagen');
    }
  }

  _handleImport() {
    const json = this.importTextarea?.value.trim();
    if (!json) {
      this._announce('Bitte Preset-JSON einfügen');
      return;
    }

    const result = this.presetService.importPreset(json);
    if (result.success) {
      if (this.selectEl) this.selectEl.value = result.name;
      if (this.importTextarea) this.importTextarea.value = '';
      this._announce(`Preset "${result.name}" importiert`);
    } else {
      this._announce(result.error || 'Import fehlgeschlagen');
    }
  }

  async _handleExport() {
    const name = this.selectEl?.value;
    if (!name) {
      this._announce('Bitte zuerst ein Preset auswählen');
      return;
    }

    const json = this.presetService.exportPreset(name);
    if (!json) {
      this._announce('Export fehlgeschlagen');
      return;
    }

    if (this.importTextarea) {
      this.importTextarea.value = json;
      this.importTextarea.focus();
      this.importTextarea.select();
    }

    try {
      await navigator.clipboard.writeText(json);
      this._announce(`Preset "${name}" als JSON kopiert`);
    } catch {
      this._announce(`Preset "${name}" exportiert`);
    }
  }

  _announce(message) {
    this.store.dispatch(Actions.announce(message), this.reducers);
  }
}

function renderPresetPreview(items) {
  const canvas = document.createElement('canvas');
  canvas.width = 112;
  canvas.height = 112;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#10161a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(212, 82, 10, 0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  items.forEach((item) => {
    const x = item.x * canvas.width;
    const y = item.y * canvas.height;
    const size = Math.max(10, 16 * (item.scale || 1));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(((item.rotation || 0) * Math.PI) / 180);
    ctx.fillStyle = item.color || '#d4520a';
    ctx.globalAlpha = 0.9;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  });

  return canvas.toDataURL('image/png');
}

function escapeHtml(value) {
  return `${value}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
