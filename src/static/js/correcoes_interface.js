// Correções para problemas de interface mobile e PWA
// 1. Correção para notificação de instalação PWA persistente
function corrigirNotificacaoPWA() {
  // Verificar se o app já está instalado antes de mostrar a notificação
  let deferredPrompt;
  const pwaInstallPrompt = document.getElementById('pwa-install-prompt');
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir o comportamento padrão
    e.preventDefault();
    // Armazenar o evento para uso posterior
    deferredPrompt = e;
    
    // Verificar se o app já está instalado usando matchMedia
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: fullscreen)').matches || 
        window.matchMedia('(display-mode: minimal-ui)').matches) {
      // App já está instalado, não mostrar notificação
      if (pwaInstallPrompt) {
        pwaInstallPrompt.style.display = 'none';
      }
      // Salvar no localStorage que o app está instalado
      localStorage.setItem('appInstalado', 'true');
    } else {
      // Verificar se o usuário já instalou anteriormente
      if (localStorage.getItem('appInstalado') !== 'true') {
        // Mostrar notificação apenas se não estiver instalado
        if (pwaInstallPrompt) {
          pwaInstallPrompt.style.display = 'flex';
        }
      }
    }
  });
  
  // Adicionar evento para o botão de instalação
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        // Mostrar prompt de instalação
        deferredPrompt.prompt();
        // Esperar pela resposta do usuário
        const { outcome } = await deferredPrompt.userChoice;
        // Limpar o prompt salvo
        deferredPrompt = null;
        
        // Se o usuário aceitou a instalação
        if (outcome === 'accepted') {
          localStorage.setItem('appInstalado', 'true');
          if (pwaInstallPrompt) {
            pwaInstallPrompt.style.display = 'none';
          }
        }
      }
    });
  }
  
  // Adicionar evento para o botão de fechar notificação
  const closeButton = document.getElementById('close-install-prompt');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      if (pwaInstallPrompt) {
        pwaInstallPrompt.style.display = 'none';
        // Salvar preferência do usuário para não mostrar novamente
        localStorage.setItem('notificacaoFechada', 'true');
      }
    });
  }
  
  // Verificar se o app já está instalado ao carregar a página
  window.addEventListener('load', () => {
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: fullscreen)').matches || 
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        localStorage.getItem('appInstalado') === 'true' ||
        localStorage.getItem('notificacaoFechada') === 'true') {
      // App já está instalado ou usuário fechou a notificação
      if (pwaInstallPrompt) {
        pwaInstallPrompt.style.display = 'none';
      }
    }
  });
}

// 2. Correção para carrinho de compras na versão mobile
function corrigirCarrinhoMobile() {
  // Adicionar botão flutuante para o carrinho na versão mobile
  const body = document.body;
  const carrinhoFlutuante = document.createElement('div');
  carrinhoFlutuante.className = 'carrinho-flutuante';
  carrinhoFlutuante.innerHTML = `
    <a href="#" id="botao-carrinho-flutuante" class="btn-carrinho-flutuante">
      <i class="bi bi-cart3"></i>
      <span class="badge bg-danger contador-carrinho">0</span>
    </a>
  `;
  body.appendChild(carrinhoFlutuante);
  
  // Adicionar estilos CSS para o botão flutuante
  const style = document.createElement('style');
  style.textContent = `
    .carrinho-flutuante {
      display: none;
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }
    
    .btn-carrinho-flutuante {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: var(--primary-color);
      color: white;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      text-decoration: none;
      position: relative;
    }
    
    .btn-carrinho-flutuante i {
      font-size: 24px;
    }
    
    .btn-carrinho-flutuante .contador-carrinho {
      position: absolute;
      top: 0;
      right: 0;
      transform: translate(30%, -30%);
    }
    
    @media (max-width: 767.98px) {
      .carrinho-flutuante {
        display: block;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Atualizar contador do carrinho flutuante
  function atualizarContadorCarrinho() {
    const itensCarrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const contadores = document.querySelectorAll('.contador-carrinho');
    contadores.forEach(contador => {
      contador.textContent = itensCarrinho.length;
    });
  }
  
  // Adicionar evento de clique para abrir o carrinho
  const botaoCarrinhoFlutuante = document.getElementById('botao-carrinho-flutuante');
  if (botaoCarrinhoFlutuante) {
    botaoCarrinhoFlutuante.addEventListener('click', (e) => {
      e.preventDefault();
      // Abrir modal do carrinho ou navegar para página do carrinho
      const carrinhoLink = document.querySelector('a[href="#carrinho"]');
      if (carrinhoLink) {
        carrinhoLink.click();
      }
    });
  }
  
  // Atualizar contador ao carregar a página
  window.addEventListener('load', atualizarContadorCarrinho);
  
  // Atualizar contador quando o carrinho for modificado
  window.addEventListener('carrinhoAtualizado', atualizarContadorCarrinho);
}

// 3. Correção para menu mobile que não fecha automaticamente
function corrigirMenuMobile() {
  // Selecionar todos os links do menu mobile
  const menuMobile = document.querySelector('.navbar-collapse');
  const toggleButton = document.querySelector('.navbar-toggler');
  
  if (menuMobile && toggleButton) {
    // Adicionar evento de clique para todos os links do menu
    const linksMenu = menuMobile.querySelectorAll('a');
    linksMenu.forEach(link => {
      link.addEventListener('click', () => {
        // Verificar se o menu está aberto (tem a classe show)
        if (menuMobile.classList.contains('show')) {
          // Fechar o menu clicando no botão toggle
          toggleButton.click();
        }
      });
    });
  }
}

// 4. Correção para imagens não responsivas no carrinho
function corrigirImagensCarrinho() {
  // Adicionar estilos CSS para garantir que as imagens sejam responsivas
  const style = document.createElement('style');
  style.textContent = `
    .cart-item-image {
      width: 80px !important;
      height: 80px !important;
      object-fit: cover !important;
      border-radius: 8px !important;
      max-width: 100% !important;
    }
    
    @media (max-width: 767.98px) {
      .cart-item {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        padding: 10px !important;
      }
      
      .cart-item-image {
        width: 60px !important;
        height: 60px !important;
        margin-right: 10px !important;
      }
      
      .cart-item-details {
        flex: 1 !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Função para aplicar classes às imagens do carrinho quando o carrinho for aberto
  function ajustarImagensCarrinho() {
    const imagensCarrinho = document.querySelectorAll('.cart-item img');
    imagensCarrinho.forEach(img => {
      img.classList.add('cart-item-image');
    });
  }
  
  // Observar mudanças no DOM para detectar quando o carrinho é aberto
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        // Verificar se algum dos nós adicionados contém imagens do carrinho
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList && 
              (node.classList.contains('cart-item') || node.querySelector('.cart-item'))) {
            ajustarImagensCarrinho();
          }
        });
      }
    });
  });
  
  // Iniciar observação do DOM
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Também ajustar imagens ao carregar a página
  window.addEventListener('load', ajustarImagensCarrinho);
}

// Inicializar todas as correções quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  corrigirNotificacaoPWA();
  corrigirCarrinhoMobile();
  corrigirMenuMobile();
  corrigirImagensCarrinho();
});
