import { Actions } from '../../core/state/actions.js';

export class LayersPanelController {
  constructor(store, sceneService, reducers) {
    this.store = store;
    this.sceneService = sceneService;
    this.reducers = reducers;

    this.panel = document.getElementById('layersPanel');
    this.list = document.getElementById('layersList');
    this.nameInput = document.getElementById('layerNameInput');
    this.moveTopBtn = document.getElementById('layerMoveTopBtn');
    this.moveUpBtn = document.getElementById('layerMoveUpBtn');
    this.moveDownBtn = document.getElementById('layerMoveDownBtn');
    this.moveBottomBtn = document.getElementById('layerMoveBottomBtn');

    this.draggedId = null;
    this.unsubscribe = null;
  }

  async init() {
    this._setupEventListeners();
    this._subscribeToState();
    this._render();
  }

  _setupEventListeners() {
    if (this.nameInput) {
      this.nameInput.addEventListener('input', () => {
        const selected = this.sceneService.getSelectedItem();
        if (!selected) return;
        this.sceneService.renameItem(selected.id, this.nameInput.value.trim() || selected.label);
      });
    }

    this.moveTopBtn?.addEventListener('click', () => this._moveSelected('top'));
    this.moveUpBtn?.addEventListener('click', () => this._moveSelected('front'));
    this.moveDownBtn?.addEventListener('click', () => this._moveSelected('back'));
    this.moveBottomBtn?.addEventListener('click', () => this._moveSelected('bottom'));
  }

  _subscribeToState() {
    this.unsubscribe = this.store.subscribe(() => this._render());
  }

  _render() {
    if (!this.list) return;

    const items = [...this.sceneService.getAllItems()];
    const selected = this.sceneService.getSelectedItem();
    const topFirst = [...items].reverse();

    this.list.innerHTML = '';

    if (topFirst.length === 0) {
      this.list.innerHTML = '<li class="layers-panel__empty">Noch keine Teile platziert</li>';
    }

    topFirst.forEach((item, visualIndex) => {
      const li = document.createElement('li');
      li.className = 'layers-panel__item';
      li.dataset.itemId = item.id;
      li.draggable = true;
      if (selected?.id === item.id) li.dataset.selected = 'true';

      li.innerHTML = `
        <button type="button" class="layers-panel__select" data-select-layer="${item.id}">
          <span class="layers-panel__swatch" style="background:${item.color}"></span>
          <span class="layers-panel__meta">
            <span class="layers-panel__name">${escapeHtml(item.label || `${item.categoryId} ${item.partId + 1}`)}</span>
            <span class="layers-panel__type">${escapeHtml(item.categoryId)} • Ebene ${topFirst.length - visualIndex}</span>
          </span>
        </button>
      `;

      li.querySelector('[data-select-layer]')?.addEventListener('click', () => {
        this.sceneService.selectItem(item.id);
      });

      li.addEventListener('dragstart', () => {
        this.draggedId = item.id;
        li.dataset.dragging = 'true';
      });

      li.addEventListener('dragend', () => {
        this.draggedId = null;
        delete li.dataset.dragging;
      });

      li.addEventListener('dragover', (event) => {
        event.preventDefault();
        li.dataset.dropTarget = 'true';
      });

      li.addEventListener('dragleave', () => {
        delete li.dataset.dropTarget;
      });

      li.addEventListener('drop', (event) => {
        event.preventDefault();
        delete li.dataset.dropTarget;
        this._handleDrop(item.id);
      });

      this.list.appendChild(li);
    });

    if (this.nameInput) {
      this.nameInput.disabled = !selected;
      this.nameInput.value = selected?.label || '';
    }

    this._updateButtons(items, selected);
  }

  _updateButtons(items, selected) {
    const index = selected ? items.findIndex(item => item.id === selected.id) : -1;
    const disabled = index === -1;

    if (this.moveTopBtn) this.moveTopBtn.disabled = disabled || index === items.length - 1;
    if (this.moveUpBtn) this.moveUpBtn.disabled = disabled || index === items.length - 1;
    if (this.moveDownBtn) this.moveDownBtn.disabled = disabled || index === 0;
    if (this.moveBottomBtn) this.moveBottomBtn.disabled = disabled || index === 0;
  }

  _moveSelected(direction) {
    const selected = this.sceneService.getSelectedItem();
    if (!selected) return;
    const moved = this.sceneService.moveItemLayer(selected.id, direction);
    if (moved) {
      this._announce('Ebenenreihenfolge aktualisiert');
    }
  }

  _handleDrop(targetId) {
    if (!this.draggedId || this.draggedId === targetId) return;
    const items = [...this.sceneService.getAllItems()];
    const topFirstIds = items.map(item => item.id).reverse();
    const from = topFirstIds.indexOf(this.draggedId);
    const to = topFirstIds.indexOf(targetId);
    if (from === -1 || to === -1) return;

    const [moved] = topFirstIds.splice(from, 1);
    topFirstIds.splice(to, 0, moved);
    this.sceneService.reorderItems(topFirstIds.reverse());
    this.sceneService.selectItem(moved);
    this._announce('Ebene per Drag-and-Drop verschoben');
  }

  _announce(message) {
    this.store.dispatch(Actions.announce(message), this.reducers);
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
}

function escapeHtml(value) {
  return `${value}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
