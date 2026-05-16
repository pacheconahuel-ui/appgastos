import { toast, esc } from '../utils/html.js';
import { icon, editCatIcon } from '../utils/icons.js';
import { saveCats } from '../storage/local.js';

let editingCat = null;

function renderCategoryHTML(cat) {
  const isEdit = !!cat;
  const name = cat?.name || '';
  const catIcon = cat?.icon || '';

  return `
    <div class="m-section">
      <label>Nombre</label>
      <input type="text" class="f-ctrl" id="cat-name" placeholder="Nombre de categoría" value="${esc(name)}">
      <label>Icono (emoji)</label>
      <input type="text" class="f-ctrl" id="cat-icon" placeholder="ej: 🍔" value="${catIcon}" maxlength="2">
      <div class="m-action-btns">
        <button class="btn-secondary" id="btn-cancel-cat">Cancelar</button>
        <button class="btn-primary" id="btn-save-cat">Guardar</button>
      </div>
    </div>
  `;
}

function renderCategoriesList() {
  const cats = window.cats || [];
  return `
    <div class="cats-list">
      ${cats.map(c => `
        <div class="cat-item">
          <div class="cat-ico">${icon(c)}</div>
          <div class="cat-name">${esc(c)}</div>
          <div class="cat-actions">
            <button class="btn-ico" onclick="editCat('${c}',event)">✏️</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCatManagerHTML() {
  return `
    <div class="m-dlg">
      <div class="m-ttl">🏷️ Categorías</div>
      <div class="m-body">
        ${!editingCat ? `
          ${renderCategoriesList()}
          <button class="btn-primary" id="btn-add-cat" style="width:100%;margin-top:1rem;">Agregar categoría</button>
        ` : renderCategoryHTML(editingCat)}
      </div>
      <div class="m-footer">
        <button class="btn-secondary" id="btn-close-cat">Cerrar</button>
      </div>
    </div>
  `;
}

export function openCatManager() {
  editingCat = null;
  const overlay = document.getElementById('cat-manager-overlay');
  if (!overlay) return;

  overlay.innerHTML = renderCatManagerHTML();
  overlay.classList.add('on');

  setupEventListeners();
}

function setupEventListeners() {
  document.getElementById('btn-close-cat')?.addEventListener('click', closeCatManager);
  document.getElementById('btn-add-cat')?.addEventListener('click', addCat);
}

function addCat() {
  editingCat = { name: '', icon: '' };
  const overlay = document.getElementById('cat-manager-overlay');
  if (overlay) {
    overlay.innerHTML = renderCatManagerHTML();
  }
  setupEventListeners();

  document.getElementById('btn-cancel-cat')?.addEventListener('click', () => {
    editingCat = null;
    if (overlay) {
      overlay.innerHTML = renderCatManagerHTML();
    }
    setupEventListeners();
  });

  document.getElementById('btn-save-cat')?.addEventListener('click', saveCat);
}

function saveCat() {
  const name = document.getElementById('cat-name')?.value || '';
  const catIcon = document.getElementById('cat-icon')?.value || '';

  if (!name) {
    toast('Por favor ingresá un nombre');
    return;
  }

  if (editingCat && editingCat.name !== name) {
    // Renaming
    const idx = window.cats.indexOf(editingCat.name);
    if (idx !== -1) {
      window.cats[idx] = name;
      if (catIcon) {
        editCatIcon(name, catIcon);
      }
    }
  } else if (!editingCat.name) {
    // New category
    if (!window.cats.includes(name)) {
      window.cats.push(name);
      if (catIcon) {
        editCatIcon(name, catIcon);
      }
    } else {
      toast('Esta categoría ya existe');
      return;
    }
  }

  const uid = window.auth?.currentUser?.uid;
  if (uid) {
    saveCats(window.cats, uid);
  }

  toast('✅ Categoría actualizada');
  editingCat = null;

  const overlay = document.getElementById('cat-manager-overlay');
  if (overlay) {
    overlay.innerHTML = renderCatManagerHTML();
  }
  setupEventListeners();
}

function editCat(catName, event) {
  event.preventDefault();
  editingCat = { name: catName, icon: '' };
  const overlay = document.getElementById('cat-manager-overlay');
  if (overlay) {
    overlay.innerHTML = renderCatManagerHTML();
  }

  document.getElementById('btn-cancel-cat')?.addEventListener('click', () => {
    editingCat = null;
    if (overlay) {
      overlay.innerHTML = renderCatManagerHTML();
    }
    setupEventListeners();
  });

  document.getElementById('btn-save-cat')?.addEventListener('click', saveCat);
}

window.editCat = editCat;

export function closeCatManager() {
  editingCat = null;
  const overlay = document.getElementById('cat-manager-overlay');
  if (overlay) {
    overlay.classList.remove('on');
    overlay.innerHTML = '';
  }
}
