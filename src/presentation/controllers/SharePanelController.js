import { Serializer } from '../../infrastructure/export/Serializer.js';
import { Actions } from '../../core/state/actions.js';

export class SharePanelController {
  constructor(store, sceneService, reducers) {
    this.store = store;
    this.sceneService = sceneService;
    this.reducers = reducers;

    this.exportTextarea = document.getElementById('shareCodeOutput');
    this.importTextarea = document.getElementById('shareCodeInput');
    this.exportBtn = document.getElementById('generateShareCodeBtn');
    this.importBtn = document.getElementById('loadShareCodeBtn');
    this.copyCodeBtn = document.getElementById('copyShareCodeBtn');
    this.copyLinkBtn = document.getElementById('copyShareLinkBtn');
  }

  async init() {
    this.exportBtn?.addEventListener('click', () => this._generateShareCode());
    this.importBtn?.addEventListener('click', () => this._loadShareCode());
    this.copyCodeBtn?.addEventListener('click', () => this._copyCode());
    this.copyLinkBtn?.addEventListener('click', () => this._copyLink());
    this._loadFromHash();
  }

  _generateShareCode() {
    const items = this.sceneService.getAllItems();
    if (!items.length) {
      this._announce('Es gibt noch nichts zum Teilen');
      return;
    }

    const code = Serializer.toShareable(items);
    if (this.exportTextarea) {
      this.exportTextarea.value = code;
    }
    window.history.replaceState({}, '', `#monster=${encodeURIComponent(code)}`);
    this._announce('Share-Code erzeugt');
  }

  _loadShareCode() {
    const code = this.importTextarea?.value.trim();
    if (!code) {
      this._announce('Bitte einen Share-Code einfügen');
      return;
    }

    const items = Serializer.fromShareable(code);
    if (!items.length) {
      this._announce('Share-Code konnte nicht geladen werden');
      return;
    }

    this.store.dispatch(Actions.loadScene(items), this.reducers);
    window.history.replaceState({}, '', `#monster=${encodeURIComponent(code)}`);
    this._announce('Monster aus Share-Code geladen');
  }

  async _copyCode() {
    const code = this.exportTextarea?.value.trim();
    if (!code) {
      this._announce('Erst einen Share-Code erzeugen');
      return;
    }

    await this._copyText(code, 'Share-Code kopiert');
  }

  async _copyLink() {
    const code = this.exportTextarea?.value.trim();
    if (!code) {
      this._announce('Erst einen Share-Code erzeugen');
      return;
    }

    const url = `${window.location.origin}${window.location.pathname}#monster=${encodeURIComponent(code)}`;
    await this._copyText(url, 'Share-Link kopiert');
  }

  _loadFromHash() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const code = hash.get('monster');
    if (!code) return;

    const items = Serializer.fromShareable(code);
    if (!items.length) return;

    this.store.dispatch(Actions.loadScene(items), this.reducers);
    if (this.exportTextarea) this.exportTextarea.value = code;
    this._announce('Monster aus URL geladen');
  }

  async _copyText(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      this._announce(successMessage);
    } catch {
      if (this.exportTextarea) {
        this.exportTextarea.focus();
        this.exportTextarea.select();
      }
      this._announce('Text markiert — bitte manuell kopieren');
    }
  }

  _announce(message) {
    this.store.dispatch(Actions.announce(message), this.reducers);
  }
}
