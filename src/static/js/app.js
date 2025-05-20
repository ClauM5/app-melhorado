// Aplicativo principal para Hortifruti Delivery

// Configuração da API
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : '/api';

// Estado global da aplicação
const state = {
    currentSection: 'home',
    user: null,
    token: null,
    cart: [],
    products: [],
    categories: [],
    orders: [],
    currentProduct: null,
    isAdmin: false
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    // Carregar token do localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        state.token = token;
        state.user = JSON.parse(user);
        state.isAdmin = state.user.is_admin;
        updateAuthUI();
    }
    
    // Carregar carrinho do localStorage
    const cart = localStorage.getItem('cart');
    if (cart) {
        state.cart = JSON.parse(cart);
        updateCartCount();
    }
    
    // Configurar navegação
    setupNavigation();
    
    // Carregar dados iniciais
    loadInitialData();
    
    // Configurar formulários
    setupForms();
    
    // Configurar PWA
    setupPWA();
});

// Configuração da navegação
function setupNavigation() {
    // Links de navegação
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1);
            navigateTo(target);
        });
    });
    
    // Botão de logout
    document.getElementById('logout-link').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    document.getElementById('logout-profile').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // Navegação inicial baseada na URL
    const hash = window.location.hash.substring(1);
    navigateTo(hash || 'home');
    
    // Configurar navegação por histórico
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.substring(1);
        navigateTo(hash || 'home');
    });
}

// Função de navegação
function navigateTo(section) {
    // Verificar se a seção existe
    const sectionElement = document.getElementById(section);
    if (!sectionElement) {
        navigateTo('home');
        return;
    }
    
    // Verificar se a seção requer autenticação
    const authRequiredSections = ['profile', 'orders', 'checkout'];
    if (authRequiredSections.includes(section) && !state.token) {
        showToast('Você precisa fazer login para acessar esta página', 'error');
        navigateTo('login');
        return;
    }
    
    // Verificar se a seção é o painel admin
    if (section === 'admin' && (!state.isAdmin || !state.token)) {
        showToast('Acesso restrito a administradores', 'error');
        navigateTo('home');
        return;
    }
    
    // Atualizar seção atual
    state.currentSection = section;
    
    // Ocultar todas as seções
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
    });
    
    // Mostrar a seção atual
    sectionElement.classList.add('active');
    
    // Atualizar links de navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${section}`) {
            link.classList.add('active');
        }
    });
    
    // Atualizar URL
    window.location.hash = `#${section}`;
    
    // Executar ações específicas da seção
    switch (section) {
        case 'home':
            loadFeaturedProducts();
            break;
        case 'products':
            loadAllProducts();
            loadCategories();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'cart':
            updateCartUI();
            break;
        case 'checkout':
            updateCheckoutUI();
            break;
        case 'profile':
            loadUserProfile();
            break;
        case 'orders':
            loadUserOrders();
            break;
        case 'admin':
            loadAdminDashboard();
            break;
    }
    
    // Rolar para o topo
    window.scrollTo(0, 0);
}

// Carregar dados iniciais
function loadInitialData() {
    loadFeaturedProducts();
    loadCategories();
}

// Carregar produtos em destaque
function loadFeaturedProducts() {
    const featuredProductsContainer = document.getElementById('featured-products');
    featuredProductsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    
    fetch(`${API_URL}/products?featured=1`)
        .then(response => response.json())
        .then(data => {
            state.products = data.products;
            
            if (data.products.length === 0) {
                featuredProductsContainer.innerHTML = '<div class="col-12 text-center"><p>Nenhum produto em destaque disponível.</p></div>';
                return;
            }
            
            featuredProductsContainer.innerHTML = '';
            
            data.products.forEach(product => {
                const productCard = createProductCard(product);
                featuredProductsContainer.appendChild(productCard);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar produtos em destaque:', error);
            featuredProductsContainer.innerHTML = '<div class="col-12 text-center"><p>Erro ao carregar produtos. Tente novamente mais tarde.</p></div>';
        });
}

// Carregar todos os produtos
function loadAllProducts() {
    const productsContainer = document.getElementById('products-container');
    const noProducts = document.getElementById('no-products');
    
    productsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    
    // Obter filtros
    const categoryFilter = document.getElementById('category-filter').value;
    const searchQuery = document.getElementById('search-product').value;
    
    // Construir URL com filtros
    let url = `${API_URL}/products`;
    const params = [];
    
    if (categoryFilter) {
        params.push(`category_id=${categoryFilter}`);
    }
    
    if (searchQuery) {
        params.push(`search=${encodeURIComponent(searchQuery)}`);
    }
    
    if (params.length > 0) {
        url += `?${params.join('&')}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            state.products = data.products;
            
            if (data.products.length === 0) {
                productsContainer.innerHTML = '';
                noProducts.style.display = 'block';
                return;
            }
            
            noProducts.style.display = 'none';
            productsContainer.innerHTML = '';
            
            data.products.forEach(product => {
                const productCard = createProductCard(product);
                productsContainer.appendChild(productCard);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar produtos:', error);
            productsContainer.innerHTML = '<div class="col-12 text-center"><p>Erro ao carregar produtos. Tente novamente mais tarde.</p></div>';
        });
}

// Carregar categorias
function loadCategories() {
    const categoriesContainer = document.getElementById('categories-container');
    const categoryFilter = document.getElementById('category-filter');
    
    if (categoriesContainer) {
        categoriesContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    }
    
    fetch(`${API_URL}/categories`)
        .then(response => response.json())
        .then(data => {
            state.categories = data.categories;
            
            // Atualizar filtro de categorias
            if (categoryFilter) {
                const currentValue = categoryFilter.value;
                categoryFilter.innerHTML = '<option value="">Todas as Categorias</option>';
                
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categoryFilter.appendChild(option);
                });
                
                categoryFilter.value = currentValue;
            }
            
            // Atualizar lista de categorias
            if (categoriesContainer) {
                if (data.categories.length === 0) {
                    categoriesContainer.innerHTML = '<div class="col-12 text-center"><p>Nenhuma categoria disponível.</p></div>';
                    return;
                }
                
                categoriesContainer.innerHTML = '';
                
                data.categories.forEach(category => {
                    const categoryCard = createCategoryCard(category);
                    categoriesContainer.appendChild(categoryCard);
                });
            }
        })
        .catch(error => {
            console.error('Erro ao carregar categorias:', error);
            if (categoriesContainer) {
                categoriesContainer.innerHTML = '<div class="col-12 text-center"><p>Erro ao carregar categorias. Tente novamente mais tarde.</p></div>';
            }
        });
}

// Criar card de produto
function createProductCard(product) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 col-xl-3';
    
    col.innerHTML = `
        <div class="card product-card h-100">
            <img src="${product.image || '/static/images/products/default.jpg'}" class="card-img-top" alt="${product.name}">
            <div class="card-body">
                <h5 class="card-title">${product.name}</h5>
                <p class="card-text">${product.description || ''}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="product-price">R$ ${product.price.toFixed(2)}</span>
                        <span class="product-unit">/ ${product.unit}</span>
                    </div>
                    <button class="btn btn-success btn-sm view-product" data-id="${product.id}">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar evento para visualizar produto
    col.querySelector('.view-product').addEventListener('click', () => {
        viewProduct(product.id);
    });
    
    return col;
}

// Criar card de categoria
function createCategoryCard(category) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    col.innerHTML = `
        <div class="category-card">
            <img src="${category.image || '/static/images/categories/default.jpg'}" alt="${category.name}">
            <div class="category-overlay">
                <h3 class="category-name">${category.name}</h3>
            </div>
        </div>
    `;
    
    // Adicionar evento para filtrar produtos por categoria
    col.addEventListener('click', () => {
        document.getElementById('category-filter').value = category.id;
        navigateTo('products');
        loadAllProducts();
    });
    
    return col;
}

// Visualizar produto
function viewProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    state.currentProduct = product;
    
    // Preencher modal
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-description').textContent = product.description || 'Sem descrição disponível.';
    document.getElementById('modal-product-price').textContent = `R$ ${product.price.toFixed(2)}`;
    document.getElementById('modal-product-image').src = product.image || '/static/images/products/default.jpg';
    document.getElementById('modal-product-qty').value = 1;
    
    // Encontrar categoria
    const category = state.categories.find(c => c.id === product.category_id);
    document.getElementById('modal-product-category').textContent = category ? category.name : '';
    
    // Mostrar modal
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    productModal.show();
}

// Configurar formulários
function setupForms() {
    // Formulário de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            login(email, password);
        });
    }
    
    // Formulário de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const phone = document.getElementById('register-phone').value;
            const terms = document.getElementById('terms').checked;
            
            if (password !== confirmPassword) {
                showToast('As senhas não coincidem', 'error');
                return;
            }
            
            if (!terms) {
                showToast('Você precisa aceitar os termos de uso', 'error');
                return;
            }
            
            register(name, email, password, phone);
        });
    }
    
    // Formulário de perfil
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('profile-update-name').value;
            const email = document.getElementById('profile-update-email').value;
            const phone = document.getElementById('profile-update-phone').value;
            const currentPassword = document.getElementById('profile-current-password').value;
            const newPassword = document.getElementById('profile-new-password').value;
            const confirmPassword = document.getElementById('profile-confirm-password').value;
            
            if (newPassword && newPassword !== confirmPassword) {
                showToast('As senhas não coincidem', 'error');
                return;
            }
            
            updateProfile(name, email, phone, currentPassword, newPassword);
        });
    }
    
    // Formulário de contato
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // Simulação de envio de mensagem
            showToast('Mensagem enviada com sucesso!', 'success');
            contactForm.reset();
        });
    }
    
    // Botão de checkout
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            if (!state.token) {
                showToast('Você precisa fazer login para finalizar o pedido', 'error');
                navigateTo('login');
                return;
            }
            
            navigateTo('checkout');
        });
    }
    
    // Botão de finalizar pedido
    const placeOrderButton = document.getElementById('place-order-button');
    if (placeOrderButton) {
        placeOrderButton.addEventListener('click', () => {
            placeOrder();
        });
    }
    
    // Botões de adicionar ao carrinho
    document.getElementById('modal-add-to-cart').addEventListener('click', () => {
        const quantity = parseInt(document.getElementById('modal-product-qty').value);
        addToCart(state.currentProduct, quantity);
        
        // Fechar modal
        const productModal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        productModal.hide();
    });
    
    // Botões de quantidade no modal
    document.getElementById('modal-decrease-qty').addEventListener('click', () => {
        const qtyInput = document.getElementById('modal-product-qty');
        const currentQty = parseInt(qtyInput.value);
        if (currentQty > 1) {
            qtyInput.value = currentQty - 1;
        }
    });
    
    document.getElementById('modal-increase-qty').addEventListener('click', () => {
        const qtyInput = document.getElementById('modal-product-qty');
        const currentQty = parseInt(qtyInput.value);
        qtyInput.value = currentQty + 1;
    });
    
    // Filtro de produtos
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            loadAllProducts();
        });
    }
    
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            loadAllProducts();
        });
    }
    
    const searchInput = document.getElementById('search-product');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadAllProducts();
            }
        });
    }
    
    // Método de pagamento
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    if (paymentRadios.length > 0) {
        paymentRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const moneyChangeContainer = document.getElementById('money-change-container');
                if (radio.value === 'money') {
                    moneyChangeContainer.style.display = 'block';
                } else {
                    moneyChangeContainer.style.display = 'none';
                }
            });
        });
    }
}

// Login
function login(email, password) {
    fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Credenciais inválidas');
        }
        return response.json();
    })
    .then(data => {
        state.token = data.token;
        state.user = data.user;
        state.isAdmin = data.user.is_admin;
        
        // Salvar no localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Atualizar UI
        updateAuthUI();
        
        // Redirecionar
        if (state.isAdmin) {
            navigateTo('admin');
        } else {
            navigateTo('home');
        }
        
        showToast('Login realizado com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro ao fazer login:', error);
        showToast('Erro ao fazer login. Verifique suas credenciais.', 'error');
    });
}

// Registro
function register(name, email, password, phone) {
    fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, phone })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao registrar usuário');
        }
        return response.json();
    })
    .then(data => {
        showToast('Registro realizado com sucesso! Faça login para continuar.', 'success');
        navigateTo('login');
    })
    .catch(error => {
        console.error('Erro ao registrar:', error);
        showToast('Erro ao registrar. Verifique os dados e tente novamente.', 'error');
    });
}

// Logout
function logout() {
    state.token = null;
    state.user = null;
    state.isAdmin = false;
    
    // Remover do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Atualizar UI
    updateAuthUI();
    
    // Redirecionar
    navigateTo('home');
    
    showToast('Logout realizado com sucesso!', 'success');
}

// Atualizar UI de autenticação
function updateAuthUI() {
    const loginNavItem = document.getElementById('login-nav-item');
    const logoutNavItem = document.getElementById('logout-nav-item');
    const profileNavItem = document.getElementById('profile-nav-item');
    const ordersNavItem = document.getElementById('orders-nav-item');
    
    if (state.token) {
        loginNavItem.style.display = 'none';
        logoutNavItem.style.display = 'block';
        profileNavItem.style.display = 'block';
        ordersNavItem.style.display = 'block';
    } else {
        loginNavItem.style.display = 'block';
        logoutNavItem.style.display = 'none';
        profileNavItem.style.display = 'none';
        ordersNavItem.style.display = 'none';
    }
}

// Carregar perfil do usuário
function loadUserProfile() {
    if (!state.token || !state.user) return;
    
    document.getElementById('profile-name').textContent = state.user.name;
    document.getElementById('profile-email').textContent = state.user.email;
    
    document.getElementById('profile-update-name').value = state.user.name;
    document.getElementById('profile-update-email').value = state.user.email;
    document.getElementById('profile-update-phone').value = state.user.phone || '';
}

// Atualizar perfil
function updateProfile(name, email, phone, currentPassword, newPassword) {
    if (!state.token) return;
    
    const data = { name, email, phone };
    
    if (currentPassword && newPassword) {
        data.current_password = currentPassword;
        data.password = newPassword;
    }
    
    fetch(`${API_URL}/users/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao atualizar perfil');
        }
        return response.json();
    })
    .then(data => {
        state.user = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
        
        loadUserProfile();
        showToast('Perfil atualizado com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro ao atualizar perfil:', error);
        showToast('Erro ao atualizar perfil. Tente novamente.', 'error');
    });
}

// Adicionar ao carrinho
function addToCart(product, quantity) {
    if (!product) return;
    
    // Verificar se o produto já está no carrinho
    const existingItem = state.cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        state.cart.push({
            product,
            quantity
        });
    }
    
    // Salvar no localStorage
    localStorage.setItem('cart', JSON.stringify(state.cart));
    
    // Atualizar UI
    updateCartCount();
    
    showToast(`${product.name} adicionado ao carrinho!`, 'success');
}

// Atualizar quantidade no carrinho
function updateCartItemQuantity(productId, quantity) {
    const item = state.cart.find(item => item.product.id === productId);
    
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            localStorage.setItem('cart', JSON.stringify(state.cart));
            updateCartUI();
        }
    }
}

// Remover do carrinho
function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.product.id !== productId);
    localStorage.setItem('cart', JSON.stringify(state.cart));
    
    updateCartCount();
    updateCartUI();
}

// Atualizar contador do carrinho
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    const count = state.cart.reduce((total, item) => total + item.quantity, 0);
    
    cartCount.textContent = count;
}

// Atualizar UI do carrinho
function updateCartUI() {
    const cartEmpty = document.getElementById('cart-empty');
    const cartContent = document.getElementById('cart-content');
    const cartItems = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    
    if (state.cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartContent.style.display = 'none';
        return;
    }
    
    cartEmpty.style.display = 'none';
    cartContent.style.display = 'block';
    
    // Limpar itens
    cartItems.innerHTML = '';
    
    // Calcular subtotal
    let subtotal = 0;
    
    // Adicionar itens
    state.cart.forEach(item => {
        const tr = document.createElement('tr');
        
        const itemSubtotal = item.product.price * item.quantity;
        subtotal += itemSubtotal;
        
        tr.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.product.image || '/static/images/products/default.jpg'}" alt="${item.product.name}" class="cart-item-img me-3">
                    <div>
                        <h6 class="mb-0">${item.product.name}</h6>
                        <small class="text-muted">${item.product.unit}</small>
                    </div>
                </div>
            </td>
            <td>R$ ${item.product.price.toFixed(2)}</td>
            <td>
                <div class="input-group" style="width: 120px;">
                    <button class="btn btn-outline-secondary btn-sm decrease-qty" data-id="${item.product.id}">-</button>
                    <input type="number" class="form-control form-control-sm text-center item-qty" value="${item.quantity}" min="1" data-id="${item.product.id}">
                    <button class="btn btn-outline-secondary btn-sm increase-qty" data-id="${item.product.id}">+</button>
                </div>
            </td>
            <td>R$ ${itemSubtotal.toFixed(2)}</td>
            <td>
                <button class="btn btn-outline-danger btn-sm remove-item" data-id="${item.product.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        cartItems.appendChild(tr);
    });
    
    // Adicionar eventos
    document.querySelectorAll('.decrease-qty').forEach(button => {
        button.addEventListener('click', () => {
            const productId = parseInt(button.getAttribute('data-id'));
            const item = state.cart.find(item => item.product.id === productId);
            if (item && item.quantity > 1) {
                updateCartItemQuantity(productId, item.quantity - 1);
            }
        });
    });
    
    document.querySelectorAll('.increase-qty').forEach(button => {
        button.addEventListener('click', () => {
            const productId = parseInt(button.getAttribute('data-id'));
            const item = state.cart.find(item => item.product.id === productId);
            if (item) {
                updateCartItemQuantity(productId, item.quantity + 1);
            }
        });
    });
    
    document.querySelectorAll('.item-qty').forEach(input => {
        input.addEventListener('change', () => {
            const productId = parseInt(input.getAttribute('data-id'));
            const quantity = parseInt(input.value);
            updateCartItemQuantity(productId, quantity);
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', () => {
            const productId = parseInt(button.getAttribute('data-id'));
            removeFromCart(productId);
        });
    });
    
    // Atualizar totais
    const delivery = 5.99;
    const total = subtotal + delivery;
    
    cartSubtotal.textContent = `R$ ${subtotal.toFixed(2)}`;
    cartTotal.textContent = `R$ ${total.toFixed(2)}`;
}

// Atualizar UI do checkout
function updateCheckoutUI() {
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutSubtotal = document.getElementById('checkout-subtotal');
    const checkoutTotal = document.getElementById('checkout-total');
    
    // Limpar itens
    checkoutItems.innerHTML = '';
    
    // Calcular subtotal
    let subtotal = 0;
    
    // Adicionar itens
    state.cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'mb-3';
        
        const itemSubtotal = item.product.price * item.quantity;
        subtotal += itemSubtotal;
        
        div.innerHTML = `
            <div class="d-flex justify-content-between">
                <div>
                    <h6 class="mb-0">${item.product.name}</h6>
                    <small class="text-muted">${item.quantity} x R$ ${item.product.price.toFixed(2)}</small>
                </div>
                <span>R$ ${itemSubtotal.toFixed(2)}</span>
            </div>
        `;
        
        checkoutItems.appendChild(div);
    });
    
    // Atualizar totais
    const delivery = 5.99;
    const total = subtotal + delivery;
    
    checkoutSubtotal.textContent = `R$ ${subtotal.toFixed(2)}`;
    checkoutTotal.textContent = `R$ ${total.toFixed(2)}`;
}

// Finalizar pedido
function placeOrder() {
    if (!state.token) {
        showToast('Você precisa fazer login para finalizar o pedido', 'error');
        navigateTo('login');
        return;
    }
    
    if (state.cart.length === 0) {
        showToast('Seu carrinho está vazio', 'error');
        return;
    }
    
    // Obter dados do formulário
    const address = document.getElementById('address').value;
    const number = document.getElementById('number').value;
    const complement = document.getElementById('complement').value;
    const neighborhood = document.getElementById('neighborhood').value;
    const city = document.getElementById('city').value;
    const zipcode = document.getElementById('zipcode').value;
    
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const moneyChange = document.getElementById('money-change').value;
    const notes = document.getElementById('order-notes').value;
    
    if (!address || !number || !neighborhood || !city || !zipcode) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    // Formatar endereço completo
    const fullAddress = `${address}, ${number}${complement ? `, ${complement}` : ''} - ${neighborhood}, ${city} - ${zipcode}`;
    
    // Preparar itens do pedido
    const items = state.cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
    }));
    
    // Preparar dados do pedido
    const orderData = {
        items,
        address: fullAddress,
        payment_method: paymentMethod + (paymentMethod === 'money' && moneyChange ? ` (Troco para R$ ${moneyChange})` : ''),
        notes
    };
    
    // Enviar pedido
    fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao finalizar pedido');
        }
        return response.json();
    })
    .then(data => {
        // Limpar carrinho
        state.cart = [];
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateCartCount();
        
        // Mostrar modal de sucesso
        document.getElementById('success-order-id').textContent = data.order.id;
        const orderSuccessModal = new bootstrap.Modal(document.getElementById('orderSuccessModal'));
        orderSuccessModal.show();
        
        // Redirecionar após fechar o modal
        document.getElementById('orderSuccessModal').addEventListener('hidden.bs.modal', () => {
            navigateTo('orders');
        });
    })
    .catch(error => {
        console.error('Erro ao finalizar pedido:', error);
        showToast('Erro ao finalizar pedido. Tente novamente.', 'error');
    });
}

// Carregar pedidos do usuário
function loadUserOrders() {
    if (!state.token) return;
    
    const ordersContent = document.getElementById('orders-content');
    const ordersEmpty = document.getElementById('orders-empty');
    const ordersList = document.getElementById('orders-list');
    
    ordersList.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    
    fetch(`${API_URL}/orders`, {
        headers: {
            'Authorization': `Bearer ${state.token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao carregar pedidos');
        }
        return response.json();
    })
    .then(data => {
        state.orders = data.orders;
        
        if (data.orders.length === 0) {
            ordersContent.style.display = 'none';
            ordersEmpty.style.display = 'block';
            return;
        }
        
        ordersContent.style.display = 'block';
        ordersEmpty.style.display = 'none';
        
        ordersList.innerHTML = '';
        
        data.orders.forEach(order => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4';
            
            // Definir classe de badge baseada no status
            let badgeClass = '';
            switch (order.status) {
                case 'pending':
                    badgeClass = 'badge-pending';
                    break;
                case 'processing':
                    badgeClass = 'badge-processing';
                    break;
                case 'shipped':
                    badgeClass = 'badge-shipped';
                    break;
                case 'delivered':
                    badgeClass = 'badge-delivered';
                    break;
                case 'cancelled':
                    badgeClass = 'badge-cancelled';
                    break;
                default:
                    badgeClass = 'badge-pending';
            }
            
            // Traduzir status
            let statusText = '';
            switch (order.status) {
                case 'pending':
                    statusText = 'Pendente';
                    break;
                case 'processing':
                    statusText = 'Em processamento';
                    break;
                case 'shipped':
                    statusText = 'Enviado';
                    break;
                case 'delivered':
                    statusText = 'Entregue';
                    break;
                case 'cancelled':
                    statusText = 'Cancelado';
                    break;
                default:
                    statusText = 'Pendente';
            }
            
            // Formatar data
            const date = new Date(order.created_at);
            const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
            
            col.innerHTML = `
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="card-title mb-0">Pedido #${order.id}</h5>
                            <span class="badge ${badgeClass}">${statusText}</span>
                        </div>
                        <p class="card-text text-muted mb-2">Data: ${formattedDate}</p>
                        <p class="card-text mb-3">Total: R$ ${order.total.toFixed(2)}</p>
                        <p class="card-text mb-3">Itens: ${order.items.length}</p>
                        <button class="btn btn-outline-success w-100 view-order" data-id="${order.id}">Ver Detalhes</button>
                    </div>
                </div>
            `;
            
            ordersList.appendChild(col);
        });
        
        // Adicionar eventos para visualizar pedido
        document.querySelectorAll('.view-order').forEach(button => {
            button.addEventListener('click', () => {
                const orderId = parseInt(button.getAttribute('data-id'));
                viewOrder(orderId);
            });
        });
    })
    .catch(error => {
        console.error('Erro ao carregar pedidos:', error);
        ordersList.innerHTML = '<div class="col-12 text-center"><p>Erro ao carregar pedidos. Tente novamente mais tarde.</p></div>';
    });
}

// Visualizar pedido
function viewOrder(orderId) {
    if (!state.token) return;
    
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Preencher detalhes do pedido
    document.getElementById('order-detail-id').textContent = order.id;
    
    // Definir classe de badge baseada no status
    let badgeClass = '';
    switch (order.status) {
        case 'pending':
            badgeClass = 'badge-pending';
            break;
        case 'processing':
            badgeClass = 'badge-processing';
            break;
        case 'shipped':
            badgeClass = 'badge-shipped';
            break;
        case 'delivered':
            badgeClass = 'badge-delivered';
            break;
        case 'cancelled':
            badgeClass = 'badge-cancelled';
            break;
        default:
            badgeClass = 'badge-pending';
    }
    
    // Traduzir status
    let statusText = '';
    switch (order.status) {
        case 'pending':
            statusText = 'Pendente';
            break;
        case 'processing':
            statusText = 'Em processamento';
            break;
        case 'shipped':
            statusText = 'Enviado';
            break;
        case 'delivered':
            statusText = 'Entregue';
            break;
        case 'cancelled':
            statusText = 'Cancelado';
            break;
        default:
            statusText = 'Pendente';
    }
    
    document.getElementById('order-detail-status').className = `badge ${badgeClass}`;
    document.getElementById('order-detail-status').textContent = statusText;
    
    // Formatar data
    const date = new Date(order.created_at);
    const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
    document.getElementById('order-detail-date').textContent = formattedDate;
    
    // Preencher itens
    const orderDetailItems = document.getElementById('order-detail-items');
    orderDetailItems.innerHTML = '';
    
    let subtotal = 0;
    
    order.items.forEach(item => {
        const tr = document.createElement('tr');
        
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;
        
        tr.innerHTML = `
            <td>${item.product ? item.product.name : 'Produto indisponível'}</td>
            <td>R$ ${item.price.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>R$ ${itemSubtotal.toFixed(2)}</td>
        `;
        
        orderDetailItems.appendChild(tr);
    });
    
    // Preencher totais
    document.getElementById('order-detail-subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('order-detail-delivery').textContent = `R$ ${(order.total - subtotal).toFixed(2)}`;
    document.getElementById('order-detail-total').textContent = `R$ ${order.total.toFixed(2)}`;
    
    // Preencher endereço e forma de pagamento
    document.getElementById('order-detail-address').textContent = order.address;
    document.getElementById('order-detail-payment').textContent = order.payment_method;
    
    // Preencher observações
    document.getElementById('order-detail-notes').textContent = order.notes || 'Nenhuma observação.';
    
    // Navegar para a seção de detalhes do pedido
    navigateTo('order-detail');
}

// Carregar painel administrativo
function loadAdminDashboard() {
    if (!state.token || !state.isAdmin) {
        navigateTo('home');
        return;
    }
    
    // Implementação do painel administrativo seria feita aqui
    // Esta é uma versão simplificada
}

// Configurar PWA
function setupPWA() {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/static/js/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registrado com sucesso:', registration);
                })
                .catch(error => {
                    console.log('Falha ao registrar Service Worker:', error);
                });
        });
    }
    
    // Configurar prompt de instalação
    let deferredPrompt;
    const pwaInstallPrompt = document.createElement('div');
    pwaInstallPrompt.className = 'pwa-install-prompt';
    pwaInstallPrompt.innerHTML = `
        <div class="pwa-install-prompt-text">
            <h5 class="mb-1">Instalar Hortifruti Delivery</h5>
            <p class="mb-0">Instale nosso app para uma experiência melhor!</p>
        </div>
        <div class="pwa-install-prompt-actions">
            <button class="btn btn-outline-secondary btn-sm" id="pwa-cancel">Agora não</button>
            <button class="btn btn-success btn-sm" id="pwa-install">Instalar</button>
        </div>
    `;
    
    document.body.appendChild(pwaInstallPrompt);
    
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevenir o prompt automático
        e.preventDefault();
        // Armazenar o evento para uso posterior
        deferredPrompt = e;
        // Mostrar o prompt personalizado
        pwaInstallPrompt.classList.add('show');
    });
    
    document.getElementById('pwa-install').addEventListener('click', () => {
        // Esconder o prompt personalizado
        pwaInstallPrompt.classList.remove('show');
        // Mostrar o prompt nativo
        deferredPrompt.prompt();
        // Esperar pela escolha do usuário
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Usuário aceitou a instalação do PWA');
            } else {
                console.log('Usuário recusou a instalação do PWA');
            }
            deferredPrompt = null;
        });
    });
    
    document.getElementById('pwa-cancel').addEventListener('click', () => {
        // Esconder o prompt personalizado
        pwaInstallPrompt.classList.remove('show');
    });
}

// Mostrar toast
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} mb-3`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="me-auto">${message}</div>
            <button type="button" class="btn-close ms-2" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 5000
    });
    
    bsToast.show();
    
    // Remover toast após ocultar
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}
