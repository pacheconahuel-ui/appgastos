import { newId } from '../utils/format.js';
import { toast, showConfirm, esc } from '../utils/html.js';
import { savePersons } from '../storage/local.js';

let editingPerson = null;

function renderPersonForm(person) {
  const isEdit = !!person;
  const name = person?.name || '';
  const email = person?.email || '';
  const phone = person?.phone || '';

  return `
    <div class="m-section">
      <input type="text" class="f-ctrl" id="person-name" placeholder="Nombre" value="${esc(name)}">
      <input type="email" class="f-ctrl" id="person-email" placeholder="Email" value="${esc(email)}">
      <input type="tel" class="f-ctrl" id="person-phone" placeholder="Teléfono" value="${esc(phone)}">
      <div class="m-action-btns">
        <button class="btn-secondary" id="btn-cancel-person">Cancelar</button>
        <button class="btn-primary" id="btn-save-person">Guardar</button>
      </div>
    </div>
  `;
}

function renderPersonsList() {
  const persons = window.persons || [];
  return persons.length ? `
    <div class="persons-list">
      ${persons.map(p => `
        <div class="person-item">
          <div class="person-info">
            <div class="person-name">${esc(p.name)}</div>
            ${p.email ? `<div class="person-email">${esc(p.email)}</div>` : ''}
          </div>
          <div class="person-actions">
            <button class="btn-ico" onclick="editPerson('${p.id}',event)">✏️</button>
            <button class="btn-ico" onclick="delPerson('${p.id}',event)">🗑️</button>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '<div class="empty">Sin contactos</div>';
}

function renderContactsHTML() {
  return `
    <div class="m-dlg">
      <div class="m-ttl">👥 Contactos</div>
      <div class="m-body">
        ${renderPersonsList()}
        ${!editingPerson ? `<button class="btn-primary" id="btn-add-person" style="width:100%;margin-top:1rem;">Agregar contacto</button>` : renderPersonForm(editingPerson)}
      </div>
      <div class="m-footer">
        <button class="btn-secondary" id="btn-close-contacts">Cerrar</button>
      </div>
    </div>
  `;
}

export function openContactsModal() {
  editingPerson = null;
  const overlay = document.getElementById('contacts-overlay');
  if (!overlay) return;

  overlay.innerHTML = renderContactsHTML();
  overlay.classList.add('on');

  setupEventListeners();
}

function setupEventListeners() {
  document.getElementById('btn-close-contacts')?.addEventListener('click', closeContactsModal);
  document.getElementById('btn-add-person')?.addEventListener('click', addPerson);
}

function addPerson() {
  editingPerson = null;
  const overlay = document.getElementById('contacts-overlay');
  if (overlay) {
    overlay.innerHTML = renderContactsHTML();
  }
  setupEventListeners();

  document.getElementById('btn-cancel-person')?.addEventListener('click', () => {
    editingPerson = null;
    if (overlay) {
      overlay.innerHTML = renderContactsHTML();
    }
    setupEventListeners();
  });

  document.getElementById('btn-save-person')?.addEventListener('click', savePerson);
}

function savePerson() {
  const name = document.getElementById('person-name')?.value || '';
  const email = document.getElementById('person-email')?.value || '';
  const phone = document.getElementById('person-phone')?.value || '';

  if (!name) {
    toast('Por favor ingresá un nombre');
    return;
  }

  const person = editingPerson || {
    id: newId(),
    createdAt: Date.now()
  };

  Object.assign(person, {
    name,
    ...(email && { email }),
    ...(phone && { phone }),
    updatedAt: Date.now()
  });

  if (!editingPerson) {
    window.persons.push(person);
  }

  const uid = window.auth?.currentUser?.uid;
  if (uid) {
    savePersons(window.persons, uid);
  }

  toast(editingPerson ? '✅ Contacto actualizado' : '✅ Contacto creado');
  editingPerson = null;

  const overlay = document.getElementById('contacts-overlay');
  if (overlay) {
    overlay.innerHTML = renderContactsHTML();
  }
  setupEventListeners();
}

function editPerson(id, event) {
  event.preventDefault();
  editingPerson = window.persons?.find(p => p.id === id) || null;
  const overlay = document.getElementById('contacts-overlay');
  if (overlay) {
    overlay.innerHTML = renderContactsHTML();
  }

  document.getElementById('btn-cancel-person')?.addEventListener('click', () => {
    editingPerson = null;
    if (overlay) {
      overlay.innerHTML = renderContactsHTML();
    }
    setupEventListeners();
  });

  document.getElementById('btn-save-person')?.addEventListener('click', savePerson);
}

window.editPerson = editPerson;

function deletePerson(id) {
  window.persons = window.persons?.filter(p => p.id !== id) || [];
  const uid = window.auth?.currentUser?.uid;
  if (uid) {
    savePersons(window.persons, uid);
  }
  toast('🗑️ Contacto eliminado');
  const overlay = document.getElementById('contacts-overlay');
  if (overlay) {
    overlay.innerHTML = renderContactsHTML();
  }
  setupEventListeners();
}

function delPerson(id, event) {
  event.preventDefault();
  showConfirm('¿Eliminar este contacto?', () => deletePerson(id));
}

window.delPerson = delPerson;

export function closeContactsModal() {
  editingPerson = null;
  const overlay = document.getElementById('contacts-overlay');
  if (overlay) {
    overlay.classList.remove('on');
    overlay.innerHTML = '';
  }
}
