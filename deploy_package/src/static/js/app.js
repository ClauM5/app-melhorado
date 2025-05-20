// Aplicativo principal para Hortifruti Delivery PWA

// Configuração da API
const API_URL = '/api';

// Estado da aplicação
let appState = {
    products: [],
    categories: [],
    cart: [],
    user: null,
    isLoading: false,
    isOffline: !navigator.onLine
};

// Elementos DOM
const elements = {
    featuredProducts: document.getElementById('featured-products'),
    cartCount: document.querySelector('.cart-count'),
    cartItems: document.getElementById('cart-items'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartDelivery: document.getElementById('cart-delivery'),
    cartTotal: document.getElementById('cart-total'),
    checkoutBtn: document.getElementById('checkout-btn'),
    loginBtn: document.getElementById('btn-login'),
    cartBtn: document.getElementById('btn-cart'),
    emptyCartMessage: document.querySelector('.empty-cart-message')
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar componentes Bootstrap
    initBootstrapComponents();
    
    // Carregar dados iniciais
    loadInitialData();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Verificar estado de login
    checkLoginStatus();
    
    // Carregar carrinho do localStorage
    loadCartFromStorage();
    
    // Monitorar estado de conexão
    setupOfflineSupport();
});

// Inicializar componentes Bootstrap
function initBootstrapComponents() {
    // Tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Carregar dados iniciais
async function loadInitialData() {
    try {
        appState.isLoading = true;
        updateUI();
        
        // Carregar categorias
        const categoriesResponse = await fetchWithTimeout(`${API_URL}/categories`);
        if (categoriesResponse.ok) {
            appState.categories = await categoriesResponse.json();
        } else {
            // Fallback para dados offline
            appState.categories = getFallbackCategories();
        }
        
        // Carregar produtos em destaque
        const productsResponse = await fetchWithTimeout(`${API_URL}/products/featured`);
        if (productsResponse.ok) {
            appState.products = await productsResponse.json();
        } else {
            // Fallback para dados offline
            appState.products = getFallbackProducts();
        }
        
        appState.isLoading = false;
        updateUI();
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        appState.isLoading = false;
        appState.products = getFallbackProducts();
        appState.categories = getFallbackCategories();
        updateUI();
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Botão de carrinho
    elements.cartBtn.addEventListener('click', () => {
        const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
        cartOffcanvas.show();
    });
    
    // Botão de login
    elements.loginBtn.addEventListener('click', () => {
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
    });
    
    // Formulário de login
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });
    
    // Formulário de cadastro
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleRegister();
    });
    
    // Botão de checkout
    elements.checkoutBtn.addEventListener('click', () => {
        if (appState.user) {
            window.location.href = '/checkout';
        } else {
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
        }
    });
}

// Atualizar UI com base no estado atual
function updateUI() {
    // Atualizar contagem do carrinho
    updateCartCount();
    
    // Renderizar produtos em destaque
    renderFeaturedProducts();
    
    // Atualizar UI do carrinho
    updateCartUI();
    
    // Atualizar UI baseado no estado de login
    updateLoginUI();
    
    // Atualizar UI baseado no estado offline
    updateOfflineUI();
}

// Renderizar produtos em destaque
function renderFeaturedProducts() {
    if (appState.isLoading) {
        elements.featuredProducts.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            </div>
        `;
        return;
    }
    
    if (appState.products.length === 0) {
        elements.featuredProducts.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-muted">Nenhum produto em destaque disponível no momento.</p>
            </div>
        `;
        return;
    }
    
    const productsHTML = appState.products.map(product => `
        <div class="col-6 col-md-4 col-lg-3 fade-in">
            <div class="card product-card h-100">
                ${product.discount ? `<div class="product-discount-badge">-${product.discount}%</div>` : ''}
                ${product.organic ? '<div class="product-organic-badge">Orgânico</div>' : ''}
                <img src="${product.image || '/static/images/product-placeholder.jpg'}" class="card-img-top" alt="${product.name}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text text-muted small">${product.description || ''}</p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <span class="product-price">R$ ${formatPrice(product.price)}</span>
                                <span class="product-unit">/${product.unit}</span>
                            </div>
                        </div>
                        <button class="btn btn-success w-100 add-to-cart-btn" data-product-id="${product.id}">
                            <i class="bi bi-cart-plus"></i> Adicionar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    elements.featuredProducts.innerHTML = productsHTML;
    
    // Adicionar event listeners para botões de adicionar ao carrinho
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.getAttribute('data-product-id');
            addToCart(productId);
        });
    });
}

// Adicionar produto ao carrinho
function addToCart(productId) {
    const product = appState.products.find(p => p.id == productId);
    if (!product) return;
    
    const existingItem = appState.cart.find(item => item.product.id == productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        appState.cart.push({
            product: product,
            quantity: 1
        });
    }
    
    // Salvar carrinho no localStorage
    saveCartToStorage();
    
    // Atualizar UI
    updateUI();
    
    // Mostrar toast de confirmação
    showToast(`${product.name} adicionado ao carrinho!`);
}

// Remover item do carrinho
function removeFromCart(productId) {
    appState.cart = appState.cart.filter(item => item.product.id != productId);
    
    // Salvar carrinho no localStorage
    saveCartToStorage();
    
    // Atualizar UI
    updateUI();
}

// Atualizar quantidade de item no carrinho
function updateCartItemQuantity(productId, quantity) {
    const item = appState.cart.find(item => item.product.id == productId);
    if (!item) return;
    
    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    item.quantity = quantity;
    
    // Salvar carrinho no localStorage
    saveCartToStorage();
    
    // Atualizar UI
    updateUI();
}

// Atualizar contagem do carrinho
function updateCartCount() {
    const count = appState.cart.reduce((total, item) => total + item.quantity, 0);
    elements.cartCount.textContent = count;
    
    // Habilitar/desabilitar botão de checkout
    elements.checkoutBtn.disabled = count === 0;
}

// Atualizar UI do carrinho
function updateCartUI() {
    if (appState.cart.length === 0) {
        elements.cartItems.innerHTML = `<p class="text-center text-muted empty-cart-message">Seu carrinho está vazio</p>`;
        elements.emptyCartMessage.style.display = 'block';
    } else {
        elements.emptyCartMessage.style.display = 'none';
        
        const cartItemsHTML = appState.cart.map(item => `
            <div class="cart-item">
                <div class="d-flex">
                    <img src="${item.product.image || '/static/images/product-placeholder.jpg'}" class="cart-item-img me-2" alt="${item.product.name}">
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${item.product.name}</h6>
                        <p class="cart-item-price mb-1">R$ ${formatPrice(item.product.price)}</p>
                        <div class="d-flex align-items-center">
                            <button class="btn btn-sm btn-outline-secondary cart-item-decrease" data-product-id="${item.product.id}">-</button>
                            <input type="number" class="form-control form-control-sm mx-1 cart-item-quantity" value="${item.quantity}" min="1" data-product-id="${item.product.id}">
                            <button class="btn btn-sm btn-outline-secondary cart-item-increase" data-product-id="${item.product.id}">+</button>
                            <button class="btn btn-sm btn-outline-danger ms-2 cart-item-remove" data-product-id="${item.product.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        elements.cartItems.innerHTML = cartItemsHTML;
        
        // Adicionar event listeners para botões do carrinho
        document.querySelectorAll('.cart-item-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.getAttribute('data-product-id');
                removeFromCart(productId);
            });
        });
        
        document.querySelectorAll('.cart-item-decrease').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.getAttribute('data-product-id');
                const item = appState.cart.find(item => item.product.id == productId);
                if (item) {
                    updateCartItemQuantity(productId, item.quantity - 1);
                }
            });
        });
        
        document.querySelectorAll('.cart-item-increase').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.getAttribute('data-product-id');
                const item = appState.cart.find(item => item.product.id == productId);
                if (item) {
                    updateCartItemQuantity(productId, item.quantity + 1);
                }
            });
        });
        
        document.querySelectorAll('.cart-item-quantity').forEach(input => {
            input.addEventListener('change', (e) => {
                const productId = e.currentTarget.getAttribute('data-product-id');
                const quantity = parseInt(e.currentTarget.value);
                if (!isNaN(quantity)) {
                    updateCartItemQuantity(productId, quantity);
                }
            });
        });
    }
    
    // Atualizar subtotal, entrega e total
    const subtotal = calculateSubtotal();
    const delivery = subtotal > 0 ? 5.99 : 0;
    const total = subtotal + delivery;
    
    elements.cartSubtotal.textContent = `R$ ${formatPrice(subtotal)}`;
    elements.cartDelivery.textContent = `R$ ${formatPrice(delivery)}`;
    elements.cartTotal.textContent = `R$ ${formatPrice(total)}`;
}

// Calcular subtotal do carrinho
function calculateSubtotal() {
    return appState.cart.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
    }, 0);
}

// Salvar carrinho no localStorage
function saveCartToStorage() {
    try {
        const cartData = appState.cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
        }));
        localStorage.setItem('hortifruti_cart', JSON.stringify(cartData));
    } catch (error) {
        console.error('Erro ao salvar carrinho:', error);
    }
}

// Carregar carrinho do localStorage
function loadCartFromStorage() {
    try {
        const cartData = localStorage.getItem('hortifruti_cart');
        if (cartData) {
            const parsedCart = JSON.parse(cartData);
            
            appState.cart = parsedCart.map(item => {
                const product = appState.products.find(p => p.id == item.productId);
                if (product) {
                    return {
                        product: product,
                        quantity: item.quantity
                    };
                }
                return null;
            }).filter(item => item !== null);
            
            updateUI();
        }
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
    }
}

// Verificar estado de login
function checkLoginStatus() {
    try {
        const userData = localStorage.getItem('hortifruti_user');
        if (userData) {
            appState.user = JSON.parse(userData);
            updateLoginUI();
        }
    } catch (error) {
        console.error('Erro ao verificar login:', error);
    }
}

// Atualizar UI baseado no estado de login
function updateLoginUI() {
    if (appState.user) {
        elements.loginBtn.textContent = appState.user.name.split(' ')[0];
        elements.loginBtn.classList.remove('btn-outline-light');
        elements.loginBtn.classList.add('btn-light');
    } else {
        elements.loginBtn.textContent = 'Entrar';
        elements.loginBtn.classList.add('btn-outline-light');
        elements.loginBtn.classList.remove('btn-light');
    }
}

// Lidar com login
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const userData = await response.json();
            appState.user = userData;
            localStorage.setItem('hortifruti_user', JSON.stringify(userData));
            updateLoginUI();
            
            // Fechar modal
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();
            
            showToast('Login realizado com sucesso!');
        } else {
            // Simulação de login para demonstração
            simulateLogin(email);
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        // Simulação de login para demonstração
        simulateLogin(email);
    }
}

// Simulação de login para demonstração
function simulateLogin(email) {
    const userData = {
        id: 1,
        name: 'Cliente Demonstração',
        email: email,
        token: 'demo-token-123456'
    };
    
    appState.user = userData;
    localStorage.setItem('hortifruti_user', JSON.stringify(userData));
    updateLoginUI();
    
    // Fechar modal
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    loginModal.hide();
    
    showToast('Login realizado com sucesso!');
}

// Lidar com cadastro
async function handleRegister() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (password !== confirmPassword) {
        showToast('As senhas não coincidem!', 'danger');
        return;
    }
    
    try {
        const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, password })
        });
        
        if (response.ok) {
            const userData = await response.json();
            appState.user = userData;
            localStorage.setItem('hortifruti_user', JSON.stringify(userData));
            updateLoginUI();
            
            // Fechar modal
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();
            
            showToast('Cadastro realizado com sucesso!');
        } else {
            // Simulação de cadastro para demonstração
            simulateRegister(name, email);
        }
    } catch (error) {
        console.error('Erro ao fazer cadastro:', error);
        // Simulação de cadastro para demonstração
        simulateRegister(name, email);
    }
}

// Simulação de cadastro para demonstração
function simulateRegister(name, email) {
    const userData = {
        id: 1,
        name: name,
        email: email,
        token: 'demo-token-123456'
    };
    
    appState.user = userData;
    localStorage.setItem('hortifruti_user', JSON.stringify(userData));
    updateLoginUI();
    
    // Fechar modal
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    loginModal.hide();
    
    showToast('Cadastro realizado com sucesso!');
}

// Configurar suporte offline
function setupOfflineSupport() {
    window.addEventListener('online', () => {
        appState.isOffline = false;
        updateOfflineUI();
        loadInitialData();
        showToast('Você está online novamente!', 'success');
    });
    
    window.addEventListener('offline', () => {
        appState.isOffline = true;
        updateOfflineUI();
        showToast('Você está offline. Algumas funcionalidades podem estar limitadas.', 'warning');
    });
}

// Atualizar UI baseado no estado offline
function updateOfflineUI() {
    if (appState.isOffline) {
        document.body.classList.add('offline-mode');
    } else {
        document.body.classList.remove('offline-mode');
    }
}

// Mostrar toast de notificação
function showToast(message, type = 'success') {
    // Verificar se já existe um toast container
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = `toast-${Date.now()}`;
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">Hortifruti Delivery</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
    toast.show();
    
    // Remover toast do DOM após ser escondido
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Fetch com timeout para evitar esperas longas em caso de problemas de rede
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
        ...options,
        signal: controller.signal
    });
    
    clearTimeout(id);
    
    return response;
}

// Formatar preço
function formatPrice(price) {
    return price.toFixed(2).replace('.', ',');
}

// Dados fallback para uso offline
function getFallbackProducts() {
    return [
        {
            id: 1,
            name: 'Maçã Gala',
            description: 'Maçã fresca e suculenta',
            price: 5.99,
            unit: 'kg',
            image: '/static/images/apple.jpg',
            category_id: 1,
            organic: false,
            discount: 0
        },
        {
            id: 2,
            name: 'Banana Prata',
            description: 'Banana madura e doce',
            price: 4.50,
            unit: 'kg',
            image: '/static/images/banana.jpg',
            category_id: 1,
            organic: false,
            discount: 10
        },
        {
            id: 3,
            name: 'Alface Crespa',
            description: 'Alface fresca e crocante',
            price: 2.99,
            unit: 'unid',
            image: '/static/images/lettuce.jpg',
            category_id: 2,
            organic: true,
            discount: 0
        },
        {
            id: 4,
            name: 'Tomate Italiano',
            description: 'Tomate maduro e suculento',
            price: 6.99,
            unit: 'kg',
            image: '/static/images/tomato.jpg',
            category_id: 3,
            organic: false,
            discount: 0
        },
        {
            id: 5,
            name: 'Cenoura',
            description: 'Cenoura fresca e crocante',
            price: 3.99,
            unit: 'kg',
            image: '/static/images/carrot.jpg',
            category_id: 3,
            organic: true,
            discount: 15
        },
        {
            id: 6,
            name: 'Morango',
            description: 'Morango doce e suculento',
            price: 8.99,
            unit: 'bandeja',
            image: '/static/images/strawberry.jpg',
            category_id: 1,
            organic: true,
            discount: 0
        },
        {
            id: 7,
            name: 'Brócolis',
            description: 'Brócolis fresco e nutritivo',
            price: 5.50,
            unit: 'unid',
            image: '/static/images/broccoli.jpg',
            category_id: 2,
            organic: false,
            discount: 0
        },
        {
            id: 8,
            name: 'Abacate',
            description: 'Abacate maduro e cremoso',
            price: 7.99,
            unit: 'unid',
            image: '/static/images/avocado.jpg',
            category_id: 1,
            organic: false,
            discount: 20
        }
    ];
}

function getFallbackCategories() {
    return [
        {
            id: 1,
            name: 'Frutas',
            image: '/static/images/frutas.jpg'
        },
        {
            id: 2,
            name: 'Verduras',
            image: '/static/images/verduras.jpg'
        },
        {
            id: 3,
            name: 'Legumes',
            image: '/static/images/legumes.jpg'
        },
        {
            id: 4,
            name: 'Orgânicos',
            image: '/static/images/organicos.jpg'
        }
    ];
}
