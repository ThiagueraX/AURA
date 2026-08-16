/**
 * AURA MOCOCA • SECURITY SHIELD & ANTI-CLONE PROTECTION ENGINE
 * Proteção de Código-Fonte, Direitos Autorais e Prevenção de Engenharia Reversa
 */

(function () {
  'use strict';

  // 1. Mensagem de Alerta Oficial no Console
  const brandBanner = `
%c  ▲ AURA MOCOCA • SISTEMA DE BILHETAGEM & IDENTIDADE OFICIAL  
%c  Todos os direitos reservados. É proibida a engenharia reversa, cópia de código ou uso não autorizado.  
  Conexões monitoradas e protegidas via criptografia ponta a ponta.
  `;
  console.log(
    brandBanner,
    'background: #08090C; color: #00F0FF; font-size: 14px; font-weight: bold; padding: 10px; border-left: 4px solid #00F0FF;',
    'background: #11141D; color: #8A9099; font-size: 11px; padding: 6px;'
  );

  // 2. Desabilitar Menu de Contexto (Clique com Botão Direito)
  document.addEventListener('contextmenu', function (e) {
    // Permite clique direito em inputs e textareas para colar texto normalmente
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    e.preventDefault();
  }, false);

  // 3. Bloqueio de Teclas de Atalho de Inspeção de Código (F12, Ctrl+Shift+I, Ctrl+U)
  document.addEventListener('keydown', function (e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }

    // Ctrl + Shift + I (DevTools)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
      e.preventDefault();
      return false;
    }

    // Ctrl + Shift + J (Console)
    if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
      e.preventDefault();
      return false;
    }

    // Ctrl + Shift + C (Inspecionar Elemento)
    if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
      e.preventDefault();
      return false;
    }

    // Ctrl + U (Exibir Código-Fonte da Página)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
      e.preventDefault();
      return false;
    }

    // Ctrl + S (Salvar Página no Computador)
    if (e.ctrlKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
      e.preventDefault();
      return false;
    }
  }, false);

  // 4. Proteção contra Arraste de Imagens da Marca
  document.addEventListener('dragstart', function (e) {
    if (e.target.tagName === 'IMG' || e.target.classList.contains('brand-emblem-svg')) {
      e.preventDefault();
    }
  }, false);

})();
