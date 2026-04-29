function closeModal(modalRoot) {
  modalRoot.innerHTML = '';
}

export function openModal(modalRoot, { title, subtitle = '', content, onMount }) {
  modalRoot.innerHTML = `
    <div class="modal-overlay" role="dialog" aria-modal="true">
      <div class="modal">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">${title}</h3>
            <div class="section-kicker">${subtitle}</div>
          </div>
          <button class="modal-close" data-close-modal aria-label="Close modal">×</button>
        </div>
        <div class="modal-body">${content}</div>
      </div>
    </div>
  `;

  modalRoot.querySelector('[data-close-modal]').addEventListener('click', () => closeModal(modalRoot));
  modalRoot.querySelector('.modal-overlay').addEventListener('click', (event) => {
    if (event.target.classList.contains('modal-overlay')) {
      closeModal(modalRoot);
    }
  });

  if (typeof onMount === 'function') {
    onMount(modalRoot.querySelector('.modal'));
  }
}

export function closeActiveModal() {
  const modalRoot = document.getElementById('modal-root');
  if (modalRoot) {
    closeModal(modalRoot);
  }
}
