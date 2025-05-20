// Funcionalidades do painel administrativo para Hortifruti Delivery

// Estado da aplicação
let adminState = {
    products: [],
    categories: [],
    orders: [],
    customers: [],
    currentSection: 'dashboard',
    isLoading: false,
    isAuthenticated: false,
    admin: null
};

// Elementos DOM
const elements = {
    contentSections: document.querySelectorAll('.content-section'),
    navLinks: document.querySelectorAll('.nav-link'),
    pageTitle: document.getElementById('page-title'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Dashboard
    todayOrdersCount: document.getElementById('today-orders-count'),
    todaySales: document.getElementById('today-sales'),
    productsCount: document.getElementById('products-count'),
    customersCount: document.getElementById('customers-count'),
    recentOrdersTable: document.getElementById('recent-orders-table'),
    lowStockTable: document.getElementById('low-stock-table'),
    
    // Produtos
    productsTable: document.getElementById('products-table'),
    addProductBtn: document.getElementById('add-product-btn'),
    saveProductBtn: document.getElementById('save-product-btn'),
    productForm: document.getElementById('product-form'),
    categoryFilter: document.getElementById('category-filter'),
    
    // Categorias
    categoriesTable: document.getElementById('categories-table'),
    categoryForm: document.getElementById('category-form'),
    saveCategoryBtn: document.getElementById('save-category-btn'),
    
    // Pedidos
    ordersTable: document.getElementById('orders-table'),
    orderStatusFilters: document.querySelectorAll('[data-filter]'),
    updateOrderStatusBtn: document.getElementById('update-order-status-btn'),
    
    // Clientes
    customersTable: document.getElementById('customers-table'),
    
    // Relatórios
    salesReportForm: document.getElementById('sales-report-form'),
    productsReportForm: document.getElementById('products-report-form'),
    salesReportResults: document.getElementById('sales-report-results'),
    productsReportResults: document.getElementById('products-report-results'),
    
    // Configurações
    storeSettingsForm: document.getElementById('store-settings-form'),
    paymentSettingsForm: document.getElementById('payment-settings-form'),
    notificationSettingsForm: document.getElementById('notification-settings-form')
};

// API URL
const API_URL = '/api';

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    checkAdminAuth();
    
    // Configurar navegação
    setupNavigation();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Carregar dados iniciais
    loadInitialData();
});

// Verificar autenticação de administrador
function checkAdminAuth() {
    try {
        const adminData = localStorage.getItem('hortifruti_admin');
        if (adminData) {
            adminState.admin = JSON.parse(adminData);
            adminState.isAuthenticated = true;
        } else {
            // Redirecionar para login se não estiver autenticado
            // window.location.href = '/admin/login.html';
            
            // Para demonstração, simular login
            simulateAdminLogin();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        // Simular login para demonstração
        simulateAdminLogin();
    }
}

// Simular login de administrador para demonstração
function simulateAdminLogin() {
    const adminData = {
        id: 1,
        name: 'Administrador',
        email: 'admin@hortifrutidelivery.com.br',
        role: 'admin',
        token: 'admin-token-123456'
    };
    
    adminState.admin = adminData;
    adminState.isAuthenticated = true;
    localStorage.setItem('hortifruti_admin', JSON.stringify(adminData));
}

// Configurar navegação
function setupNavigation() {
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover classe active de todos os links
            elements.navLinks.forEach(l => l.classList.remove('active'));
            
            // Adicionar classe active ao link clicado
            link.classList.add('active');
            
            // Obter seção a ser exibida
            const sectionId = link.id.replace('-link', '-content');
            
            // Atualizar título da página
            elements.pageTitle.textContent = link.textContent.trim();
            
            // Atualizar seção atual
            adminState.currentSection = link.id.replace('-link', '');
            
            // Esconder todas as seções
            elements.contentSections.forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });
            
            // Mostrar seção selecionada
            const selectedSection = document.getElementById(sectionId);
            if (selectedSection) {
                selectedSection.style.display = 'block';
                selectedSection.classList.add('active');
            }
            
            // Carregar dados específicos da seção
            loadSectionData(adminState.currentSection);
        });
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Logout
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Produtos
    if (elements.addProductBtn) {
        elements.addProductBtn.addEventListener('click', showAddProductModal);
    }
    
    if (elements.saveProductBtn) {
        elements.saveProductBtn.addEventListener('click', saveProduct);
    }
    
    // Categorias
    if (elements.saveCategoryBtn) {
        elements.saveCategoryBtn.addEventListener('click', saveCategory);
    }
    
    // Pedidos
    if (elements.orderStatusFilters) {
        elements.orderStatusFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                // Remover classe active de todos os filtros
                elements.orderStatusFilters.forEach(f => f.classList.remove('active'));
                
                // Adicionar classe active ao filtro clicado
                e.currentTarget.classList.add('active');
                
                // Filtrar pedidos
                const filterValue = e.currentTarget.getAttribute('data-filter');
                filterOrders(filterValue);
            });
        });
    }
    
    if (elements.updateOrderStatusBtn) {
        elements.updateOrderStatusBtn.addEventListener('click', updateOrderStatus);
    }
    
    // Relatórios
    if (elements.salesReportForm) {
        elements.salesReportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            generateSalesReport();
        });
    }
    
    if (elements.productsReportForm) {
        elements.productsReportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            generateProductsReport();
        });
    }
    
    // Configurações
    if (elements.storeSettingsForm) {
        elements.storeSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveStoreSettings();
        });
    }
    
    if (elements.paymentSettingsForm) {
        elements.paymentSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savePaymentSettings();
        });
    }
    
    if (elements.notificationSettingsForm) {
        elements.notificationSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveNotificationSettings();
        });
    }
    
    // Configurar período personalizado para relatórios
    const salesReportPeriod = document.getElementById('sales-report-period');
    if (salesReportPeriod) {
        salesReportPeriod.addEventListener('change', (e) => {
            const customDateRange = document.querySelectorAll('.custom-date-range');
            if (e.target.value === 'custom') {
                customDateRange.forEach(el => el.style.display = 'block');
            } else {
                customDateRange.forEach(el => el.style.display = 'none');
            }
        });
    }
    
    const productsReportPeriod = document.getElementById('products-report-period');
    if (productsReportPeriod) {
        productsReportPeriod.addEventListener('change', (e) => {
            const customDateRange = document.querySelectorAll('.custom-date-range-products');
            if (e.target.value === 'custom') {
                customDateRange.forEach(el => el.style.display = 'block');
            } else {
                customDateRange.forEach(el => el.style.display = 'none');
            }
        });
    }
    
    // Botões de exportação de relatórios
    const exportSalesReportBtn = document.getElementById('export-sales-report');
    if (exportSalesReportBtn) {
        exportSalesReportBtn.addEventListener('click', exportSalesReport);
    }
    
    const exportProductsReportBtn = document.getElementById('export-products-report');
    if (exportProductsReportBtn) {
        exportProductsReportBtn.addEventListener('click', exportProductsReport);
    }
    
    const exportCustomersReportBtn = document.getElementById('export-customers-report');
    if (exportCustomersReportBtn) {
        exportCustomersReportBtn.addEventListener('click', exportCustomersReport);
    }
    
    // Botões de visualização de todos os itens
    const viewAllOrdersBtn = document.getElementById('view-all-orders');
    if (viewAllOrdersBtn) {
        viewAllOrdersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('orders-link').click();
        });
    }
    
    const viewAllProductsBtn = document.getElementById('view-all-products');
    if (viewAllProductsBtn) {
        viewAllProductsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('products-link').click();
        });
    }
}

// Carregar dados iniciais
async function loadInitialData() {
    try {
        adminState.isLoading = true;
        
        // Carregar dados do dashboard
        await loadDashboardData();
        
        adminState.isLoading = false;
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        adminState.isLoading = false;
        
        // Carregar dados de demonstração
        loadDemoData();
    }
}

// Carregar dados específicos da seção
async function loadSectionData(section) {
    try {
        adminState.isLoading = true;
        
        switch (section) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'products':
                await loadProductsData();
                break;
            case 'categories':
                await loadCategoriesData();
                break;
            case 'orders':
                await loadOrdersData();
                break;
            case 'customers':
                await loadCustomersData();
                break;
            case 'reports':
                // Relatórios são gerados sob demanda
                break;
            case 'settings':
                await loadSettingsData();
                break;
        }
        
        adminState.isLoading = false;
    } catch (error) {
        console.error(`Erro ao carregar dados da seção ${section}:`, error);
        adminState.isLoading = false;
        
        // Carregar dados de demonstração para a seção
        loadDemoSectionData(section);
    }
}

// Carregar dados do dashboard
async function loadDashboardData() {
    try {
        // Carregar contagem de pedidos de hoje
        const todayOrdersResponse = await fetchWithTimeout(`${API_URL}/orders/count/today`);
        if (todayOrdersResponse.ok) {
            const todayOrdersData = await todayOrdersResponse.json();
            elements.todayOrdersCount.textContent = todayOrdersData.count;
        } else {
            // Fallback para dados de demonstração
            elements.todayOrdersCount.textContent = '12';
        }
        
        // Carregar vendas de hoje
        const todaySalesResponse = await fetchWithTimeout(`${API_URL}/orders/sales/today`);
        if (todaySalesResponse.ok) {
            const todaySalesData = await todaySalesResponse.json();
            elements.todaySales.textContent = `R$ ${formatPrice(todaySalesData.total)}`;
        } else {
            // Fallback para dados de demonstração
            elements.todaySales.textContent = 'R$ 1.250,00';
        }
        
        // Carregar contagem de produtos
        const productsCountResponse = await fetchWithTimeout(`${API_URL}/products/count`);
        if (productsCountResponse.ok) {
            const productsCountData = await productsCountResponse.json();
            elements.productsCount.textContent = productsCountData.count;
        } else {
            // Fallback para dados de demonstração
            elements.productsCount.textContent = '48';
        }
        
        // Carregar contagem de clientes
        const customersCountResponse = await fetchWithTimeout(`${API_URL}/customers/count`);
        if (customersCountResponse.ok) {
            const customersCountData = await customersCountResponse.json();
            elements.customersCount.textContent = customersCountData.count;
        } else {
            // Fallback para dados de demonstração
            elements.customersCount.textContent = '156';
        }
        
        // Carregar pedidos recentes
        const recentOrdersResponse = await fetchWithTimeout(`${API_URL}/orders/recent`);
        if (recentOrdersResponse.ok) {
            const recentOrdersData = await recentOrdersResponse.json();
            renderRecentOrders(recentOrdersData);
        } else {
            // Fallback para dados de demonstração
            renderRecentOrders(getDemoRecentOrders());
        }
        
        // Carregar produtos com estoque baixo
        const lowStockResponse = await fetchWithTimeout(`${API_URL}/products/low-stock`);
        if (lowStockResponse.ok) {
            const lowStockData = await lowStockResponse.json();
            renderLowStockProducts(lowStockData);
        } else {
            // Fallback para dados de demonstração
            renderLowStockProducts(getDemoLowStockProducts());
        }
        
        // Inicializar gráficos
        initCharts();
        
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        
        // Fallback para dados de demonstração
        elements.todayOrdersCount.textContent = '12';
        elements.todaySales.textContent = 'R$ 1.250,00';
        elements.productsCount.textContent = '48';
        elements.customersCount.textContent = '156';
        
        renderRecentOrders(getDemoRecentOrders());
        renderLowStockProducts(getDemoLowStockProducts());
        
        initCharts();
    }
}

// Carregar dados de produtos
async function loadProductsData() {
    try {
        // Carregar produtos
        const productsResponse = await fetchWithTimeout(`${API_URL}/products`);
        if (productsResponse.ok) {
            adminState.products = await productsResponse.json();
        } else {
            // Fallback para dados de demonstração
            adminState.products = getDemoProducts();
        }
        
        // Carregar categorias para o filtro
        const categoriesResponse = await fetchWithTimeout(`${API_URL}/categories`);
        if (categoriesResponse.ok) {
            adminState.categories = await categoriesResponse.json();
        } else {
            // Fallback para dados de demonstração
            adminState.categories = getDemoCategories();
        }
        
        // Renderizar produtos
        renderProducts(adminState.products);
        
        // Preencher select de categorias
        populateCategorySelect();
        
    } catch (error) {
        console.error('Erro ao carregar dados de produtos:', error);
        
        // Fallback para dados de demonstração
        adminState.products = getDemoProducts();
        adminState.categories = getDemoCategories();
        
        renderProducts(adminState.products);
        populateCategorySelect();
    }
}

// Carregar dados de categorias
async function loadCategoriesData() {
    try {
        // Carregar categorias
        const categoriesResponse = await fetchWithTimeout(`${API_URL}/categories`);
        if (categoriesResponse.ok) {
            adminState.categories = await categoriesResponse.json();
        } else {
            // Fallback para dados de demonstração
            adminState.categories = getDemoCategories();
        }
        
        // Renderizar categorias
        renderCategories(adminState.categories);
        
    } catch (error) {
        console.error('Erro ao carregar dados de categorias:', error);
        
        // Fallback para dados de demonstração
        adminState.categories = getDemoCategories();
        renderCategories(adminState.categories);
    }
}

// Carregar dados de pedidos
async function loadOrdersData() {
    try {
        // Carregar pedidos
        const ordersResponse = await fetchWithTimeout(`${API_URL}/orders`);
        if (ordersResponse.ok) {
            adminState.orders = await ordersResponse.json();
        } else {
            // Fallback para dados de demonstração
            adminState.orders = getDemoOrders();
        }
        
        // Renderizar pedidos
        renderOrders(adminState.orders);
        
    } catch (error) {
        console.error('Erro ao carregar dados de pedidos:', error);
        
        // Fallback para dados de demonstração
        adminState.orders = getDemoOrders();
        renderOrders(adminState.orders);
    }
}

// Carregar dados de clientes
async function loadCustomersData() {
    try {
        // Carregar clientes
        const customersResponse = await fetchWithTimeout(`${API_URL}/customers`);
        if (customersResponse.ok) {
            adminState.customers = await customersResponse.json();
        } else {
            // Fallback para dados de demonstração
            adminState.customers = getDemoCustomers();
        }
        
        // Renderizar clientes
        renderCustomers(adminState.customers);
        
    } catch (error) {
        console.error('Erro ao carregar dados de clientes:', error);
        
        // Fallback para dados de demonstração
        adminState.customers = getDemoCustomers();
        renderCustomers(adminState.customers);
    }
}

// Carregar dados de configurações
async function loadSettingsData() {
    try {
        // Carregar configurações da loja
        const settingsResponse = await fetchWithTimeout(`${API_URL}/settings`);
        if (settingsResponse.ok) {
            const settings = await settingsResponse.json();
            populateSettingsForm(settings);
        } else {
            // Fallback para dados de demonstração
            populateSettingsForm(getDemoSettings());
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados de configurações:', error);
        
        // Fallback para dados de demonstração
        populateSettingsForm(getDemoSettings());
    }
}

// Renderizar pedidos recentes
function renderRecentOrders(orders) {
    if (!elements.recentOrdersTable) return;
    
    if (orders.length === 0) {
        elements.recentOrdersTable.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">Nenhum pedido recente encontrado.</td>
            </tr>
        `;
        return;
    }
    
    const ordersHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer_name}</td>
            <td>R$ ${formatPrice(order.total)}</td>
            <td>
                <span class="status-badge status-${order.status}">
                    ${getStatusLabel(order.status)}
                </span>
            </td>
        </tr>
    `).join('');
    
    elements.recentOrdersTable.innerHTML = ordersHTML;
}

// Renderizar produtos com estoque baixo
function renderLowStockProducts(products) {
    if (!elements.lowStockTable) return;
    
    if (products.length === 0) {
        elements.lowStockTable.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">Nenhum produto com estoque baixo encontrado.</td>
            </tr>
        `;
        return;
    }
    
    const productsHTML = products.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${getCategoryName(product.category_id)}</td>
            <td>R$ ${formatPrice(product.price)}</td>
            <td>
                <span class="badge ${product.stock <= 5 ? 'bg-danger' : 'bg-warning'} text-white">
                    ${product.stock}
                </span>
            </td>
        </tr>
    `).join('');
    
    elements.lowStockTable.innerHTML = productsHTML;
}

// Renderizar produtos
function renderProducts(products) {
    if (!elements.productsTable) return;
    
    if (products.length === 0) {
        elements.productsTable.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Nenhum produto encontrado.</td>
            </tr>
        `;
        return;
    }
    
    const productsHTML = products.map(product => `
        <tr>
            <td>
                <img src="${product.image || '/static/images/product-placeholder.jpg'}" alt="${product.name}" width="50" height="50" class="rounded">
            </td>
            <td>${product.name}</td>
            <td>${getCategoryName(product.category_id)}</td>
            <td>R$ ${formatPrice(product.price)}/${product.unit}</td>
            <td>
                <span class="badge ${product.stock <= 5 ? 'bg-danger' : product.stock <= 10 ? 'bg-warning' : 'bg-success'} text-white">
                    ${product.stock}
                </span>
            </td>
            <td>
                <span class="badge ${product.active ? 'bg-success' : 'bg-secondary'} text-white">
                    ${product.active ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary edit-product-btn" data-product-id="${product.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger delete-product-btn" data-product-id="${product.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    elements.productsTable.innerHTML = productsHTML;
    
    // Adicionar event listeners para botões de edição e exclusão
    document.querySelectorAll('.edit-product-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.getAttribute('data-product-id');
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('.delete-product-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.getAttribute('data-product-id');
            deleteProduct(productId);
        });
    });
}

// Renderizar categorias
function renderCategories(categories) {
    if (!elements.categoriesTable) return;
    
    if (categories.length === 0) {
        elements.categoriesTable.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">Nenhuma categoria encontrada.</td>
            </tr>
        `;
        return;
    }
    
    const categoriesHTML = categories.map(category => `
        <tr>
            <td>
                <img src="${category.image || '/static/images/category-placeholder.jpg'}" alt="${category.name}" width="50" height="50" class="rounded">
            </td>
            <td>${category.name}</td>
            <td>${getProductCountByCategory(category.id)}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary edit-category-btn" data-category-id="${category.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger delete-category-btn" data-category-id="${category.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    elements.categoriesTable.innerHTML = categoriesHTML;
    
    // Adicionar event listeners para botões de edição e exclusão
    document.querySelectorAll('.edit-category-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const categoryId = e.currentTarget.getAttribute('data-category-id');
            editCategory(categoryId);
        });
    });
    
    document.querySelectorAll('.delete-category-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const categoryId = e.currentTarget.getAttribute('data-category-id');
            deleteCategory(categoryId);
        });
    });
}

// Renderizar pedidos
function renderOrders(orders) {
    if (!elements.ordersTable) return;
    
    if (orders.length === 0) {
        elements.ordersTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Nenhum pedido encontrado.</td>
            </tr>
        `;
        return;
    }
    
    const ordersHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer_name}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>R$ ${formatPrice(order.total)}</td>
            <td>
                <span class="status-badge status-${order.status}">
                    ${getStatusLabel(order.status)}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary view-order-btn" data-order-id="${order.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-success update-order-btn" data-order-id="${order.id}">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger cancel-order-btn" data-order-id="${order.id}" ${order.status === 'cancelled' || order.status === 'delivered' ? 'disabled' : ''}>
                        <i class="bi bi-x-circle"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    elements.ordersTable.innerHTML = ordersHTML;
    
    // Adicionar event listeners para botões de visualização, atualização e cancelamento
    document.querySelectorAll('.view-order-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-order-id');
            viewOrderDetails(orderId);
        });
    });
    
    document.querySelectorAll('.update-order-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-order-id');
            showUpdateOrderModal(orderId);
        });
    });
    
    document.querySelectorAll('.cancel-order-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-order-id');
            cancelOrder(orderId);
        });
    });
}

// Renderizar clientes
function renderCustomers(customers) {
    if (!elements.customersTable) return;
    
    if (customers.length === 0) {
        elements.customersTable.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Nenhum cliente encontrado.</td>
            </tr>
        `;
        return;
    }
    
    const customersHTML = customers.map(customer => `
        <tr>
            <td>#${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone || 'N/A'}</td>
            <td>${customer.orders_count}</td>
            <td>R$ ${formatPrice(customer.total_spent)}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary view-customer-btn" data-customer-id="${customer.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-success customer-orders-btn" data-customer-id="${customer.id}">
                        <i class="bi bi-cart"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    elements.customersTable.innerHTML = customersHTML;
    
    // Adicionar event listeners para botões de visualização e pedidos
    document.querySelectorAll('.view-customer-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const customerId = e.currentTarget.getAttribute('data-customer-id');
            viewCustomerDetails(customerId);
        });
    });
    
    document.querySelectorAll('.customer-orders-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const customerId = e.currentTarget.getAttribute('data-customer-id');
            viewCustomerOrders(customerId);
        });
    });
}

// Inicializar gráficos
function initCharts() {
    // Gráfico de vendas dos últimos 7 dias
    const salesChartCanvas = document.getElementById('sales-chart');
    if (salesChartCanvas) {
        const salesChartData = {
            labels: getLast7Days(),
            datasets: [{
                label: 'Vendas (R$)',
                data: getDemoSalesData(),
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 2,
                tension: 0.4
            }]
        };
        
        new Chart(salesChartCanvas, {
            type: 'line',
            data: salesChartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico de produtos mais vendidos
    const topProductsChartCanvas = document.getElementById('top-products-chart');
    if (topProductsChartCanvas) {
        const topProductsData = getDemoTopProductsData();
        
        const topProductsChartData = {
            labels: topProductsData.map(item => item.name),
            datasets: [{
                label: 'Quantidade Vendida',
                data: topProductsData.map(item => item.quantity),
                backgroundColor: [
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(33, 150, 243, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(156, 39, 176, 0.7)',
                    'rgba(233, 30, 99, 0.7)'
                ],
                borderWidth: 1
            }]
        };
        
        new Chart(topProductsChartCanvas, {
            type: 'doughnut',
            data: topProductsChartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Mostrar modal para adicionar produto
function showAddProductModal() {
    // Limpar formulário
    elements.productForm.reset();
    document.getElementById('product-id').value = '';
    
    // Atualizar título do modal
    document.getElementById('productModalLabel').textContent = 'Adicionar Produto';
    
    // Mostrar modal
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    productModal.show();
}

// Editar produto
function editProduct(productId) {
    // Buscar produto pelo ID
    const product = adminState.products.find(p => p.id == productId);
    if (!product) return;
    
    // Preencher formulário
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category_id;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-unit').value = product.unit;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-discount').value = product.discount || 0;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-organic').checked = product.organic || false;
    document.getElementById('product-featured').checked = product.featured || false;
    document.getElementById('product-active').checked = product.active !== false;
    
    // Atualizar título do modal
    document.getElementById('productModalLabel').textContent = 'Editar Produto';
    
    // Mostrar modal
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    productModal.show();
}

// Salvar produto
async function saveProduct() {
    // Validar formulário
    if (!elements.productForm.checkValidity()) {
        elements.productForm.reportValidity();
        return;
    }
    
    // Obter dados do formulário
    const productId = document.getElementById('product-id').value;
    const productData = {
        name: document.getElementById('product-name').value,
        category_id: document.getElementById('product-category').value,
        price: parseFloat(document.getElementById('product-price').value),
        unit: document.getElementById('product-unit').value,
        stock: parseInt(document.getElementById('product-stock').value),
        discount: parseInt(document.getElementById('product-discount').value) || 0,
        description: document.getElementById('product-description').value,
        organic: document.getElementById('product-organic').checked,
        featured: document.getElementById('product-featured').checked,
        active: document.getElementById('product-active').checked
    };
    
    try {
        let response;
        
        if (productId) {
            // Atualizar produto existente
            response = await fetchWithTimeout(`${API_URL}/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminState.admin.token}`
                },
                body: JSON.stringify(productData)
            });
        } else {
            // Criar novo produto
            response = await fetchWithTimeout(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminState.admin.token}`
                },
                body: JSON.stringify(productData)
            });
        }
        
        if (response.ok) {
            // Produto salvo com sucesso
            showToast(productId ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!', 'success');
            
            // Fechar modal
            const productModal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
            productModal.hide();
            
            // Recarregar dados de produtos
            loadProductsData();
        } else {
            // Erro ao salvar produto
            showToast('Erro ao salvar produto. Tente novamente.', 'danger');
        }
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        
        // Simular sucesso para demonstração
        simulateProductSave(productId, productData);
    }
}

// Simular salvamento de produto para demonstração
function simulateProductSave(productId, productData) {
    if (productId) {
        // Atualizar produto existente
        const index = adminState.products.findIndex(p => p.id == productId);
        if (index !== -1) {
            adminState.products[index] = {
                ...adminState.products[index],
                ...productData
            };
        }
    } else {
        // Criar novo produto
        const newProduct = {
            id: adminState.products.length + 1,
            ...productData,
            image: '/static/images/product-placeholder.jpg',
            created_at: new Date().toISOString()
        };
        
        adminState.products.push(newProduct);
    }
    
    // Mostrar mensagem de sucesso
    showToast(productId ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!', 'success');
    
    // Fechar modal
    const productModal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    productModal.hide();
    
    // Renderizar produtos atualizados
    renderProducts(adminState.products);
}

// Excluir produto
async function deleteProduct(productId) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
        const response = await fetchWithTimeout(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminState.admin.token}`
            }
        });
        
        if (response.ok) {
            // Produto excluído com sucesso
            showToast('Produto excluído com sucesso!', 'success');
            
            // Recarregar dados de produtos
            loadProductsData();
        } else {
            // Erro ao excluir produto
            showToast('Erro ao excluir produto. Tente novamente.', 'danger');
        }
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        
        // Simular sucesso para demonstração
        simulateProductDelete(productId);
    }
}

// Simular exclusão de produto para demonstração
function simulateProductDelete(productId) {
    // Remover produto da lista
    adminState.products = adminState.products.filter(p => p.id != productId);
    
    // Mostrar mensagem de sucesso
    showToast('Produto excluído com sucesso!', 'success');
    
    // Renderizar produtos atualizados
    renderProducts(adminState.products);
}

// Editar categoria
function editCategory(categoryId) {
    // Buscar categoria pelo ID
    const category = adminState.categories.find(c => c.id == categoryId);
    if (!category) return;
    
    // Preencher formulário
    document.getElementById('category-id').value = category.id;
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-description').value = category.description || '';
    
    // Mostrar botão de cancelar
    document.getElementById('cancel-category-btn').style.display = 'block';
    
    // Atualizar texto do botão de salvar
    document.getElementById('save-category-btn').textContent = 'Atualizar Categoria';
    
    // Adicionar event listener para botão de cancelar
    document.getElementById('cancel-category-btn').addEventListener('click', () => {
        // Limpar formulário
        elements.categoryForm.reset();
        document.getElementById('category-id').value = '';
        
        // Esconder botão de cancelar
        document.getElementById('cancel-category-btn').style.display = 'none';
        
        // Restaurar texto do botão de salvar
        document.getElementById('save-category-btn').textContent = 'Salvar Categoria';
    });
}

// Salvar categoria
async function saveCategory() {
    // Validar formulário
    if (!elements.categoryForm.checkValidity()) {
        elements.categoryForm.reportValidity();
        return;
    }
    
    // Obter dados do formulário
    const categoryId = document.getElementById('category-id').value;
    const categoryData = {
        name: document.getElementById('category-name').value,
        description: document.getElementById('category-description').value
    };
    
    try {
        let response;
        
        if (categoryId) {
            // Atualizar categoria existente
            response = await fetchWithTimeout(`${API_URL}/categories/${categoryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminState.admin.token}`
                },
                body: JSON.stringify(categoryData)
            });
        } else {
            // Criar nova categoria
            response = await fetchWithTimeout(`${API_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminState.admin.token}`
                },
                body: JSON.stringify(categoryData)
            });
        }
        
        if (response.ok) {
            // Categoria salva com sucesso
            showToast(categoryId ? 'Categoria atualizada com sucesso!' : 'Categoria adicionada com sucesso!', 'success');
            
            // Limpar formulário
            elements.categoryForm.reset();
            document.getElementById('category-id').value = '';
            
            // Esconder botão de cancelar
            document.getElementById('cancel-category-btn').style.display = 'none';
            
            // Restaurar texto do botão de salvar
            document.getElementById('save-category-btn').textContent = 'Salvar Categoria';
            
            // Recarregar dados de categorias
            loadCategoriesData();
        } else {
            // Erro ao salvar categoria
            showToast('Erro ao salvar categoria. Tente novamente.', 'danger');
        }
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        
        // Simular sucesso para demonstração
        simulateCategorySave(categoryId, categoryData);
    }
}

// Simular salvamento de categoria para demonstração
function simulateCategorySave(categoryId, categoryData) {
    if (categoryId) {
        // Atualizar categoria existente
        const index = adminState.categories.findIndex(c => c.id == categoryId);
        if (index !== -1) {
            adminState.categories[index] = {
                ...adminState.categories[index],
                ...categoryData
            };
        }
    } else {
        // Criar nova categoria
        const newCategory = {
            id: adminState.categories.length + 1,
            ...categoryData,
            image: '/static/images/category-placeholder.jpg',
            created_at: new Date().toISOString()
        };
        
        adminState.categories.push(newCategory);
    }
    
    // Mostrar mensagem de sucesso
    showToast(categoryId ? 'Categoria atualizada com sucesso!' : 'Categoria adicionada com sucesso!', 'success');
    
    // Limpar formulário
    elements.categoryForm.reset();
    document.getElementById('category-id').value = '';
    
    // Esconder botão de cancelar
    document.getElementById('cancel-category-btn').style.display = 'none';
    
    // Restaurar texto do botão de salvar
    document.getElementById('save-category-btn').textContent = 'Salvar Categoria';
    
    // Renderizar categorias atualizadas
    renderCategories(adminState.categories);
    
    // Atualizar select de categorias
    populateCategorySelect();
}

// Excluir categoria
async function deleteCategory(categoryId) {
    // Verificar se há produtos associados a esta categoria
    const productsInCategory = adminState.products.filter(p => p.category_id == categoryId);
    
    if (productsInCategory.length > 0) {
        showToast(`Não é possível excluir esta categoria. Existem ${productsInCategory.length} produtos associados a ela.`, 'warning');
        return;
    }
    
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    
    try {
        const response = await fetchWithTimeout(`${API_URL}/categories/${categoryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminState.admin.token}`
            }
        });
        
        if (response.ok) {
            // Categoria excluída com sucesso
            showToast('Categoria excluída com sucesso!', 'success');
            
            // Recarregar dados de categorias
            loadCategoriesData();
        } else {
            // Erro ao excluir categoria
            showToast('Erro ao excluir categoria. Tente novamente.', 'danger');
        }
    } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        
        // Simular sucesso para demonstração
        simulateCategoryDelete(categoryId);
    }
}

// Simular exclusão de categoria para demonstração
function simulateCategoryDelete(categoryId) {
    // Remover categoria da lista
    adminState.categories = adminState.categories.filter(c => c.id != categoryId);
    
    // Mostrar mensagem de sucesso
    showToast('Categoria excluída com sucesso!', 'success');
    
    // Renderizar categorias atualizadas
    renderCategories(adminState.categories);
    
    // Atualizar select de categorias
    populateCategorySelect();
}

// Ver detalhes do pedido
function viewOrderDetails(orderId) {
    // Buscar pedido pelo ID
    const order = adminState.orders.find(o => o.id == orderId);
    if (!order) return;
    
    // Preencher detalhes do pedido no modal
    document.getElementById('order-detail-id').textContent = order.id;
    document.getElementById('order-customer-name').textContent = order.customer_name;
    document.getElementById('order-customer-email').textContent = order.customer_email;
    document.getElementById('order-customer-phone').textContent = order.customer_phone || 'N/A';
    document.getElementById('order-date').textContent = formatDate(order.created_at);
    document.getElementById('order-status').innerHTML = `<span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span>`;
    document.getElementById('order-payment').textContent = getPaymentMethodLabel(order.payment.method);
    document.getElementById('order-address').textContent = formatAddress(order.delivery_address);
    document.getElementById('order-status-update').value = order.status;
    document.getElementById('order-notes').textContent = order.notes || 'Nenhuma observação.';
    
    // Renderizar itens do pedido
    const orderItemsHTML = order.items.map(item => `
        <tr>
            <td>${item.product_name}</td>
            <td>R$ ${formatPrice(item.price)}</td>
            <td>${item.quantity}</td>
            <td>R$ ${formatPrice(item.price * item.quantity)}</td>
        </tr>
    `).join('');
    
    document.getElementById('order-items').innerHTML = orderItemsHTML;
    
    // Preencher valores totais
    document.getElementById('order-subtotal').textContent = `R$ ${formatPrice(order.subtotal)}`;
    document.getElementById('order-delivery-fee').textContent = `R$ ${formatPrice(order.delivery_fee)}`;
    document.getElementById('order-total').textContent = `R$ ${formatPrice(order.total)}`;
    
    // Configurar botão de atualização de status
    document.getElementById('update-order-status-btn').setAttribute('data-order-id', order.id);
    
    // Mostrar modal
    const orderDetailModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
    orderDetailModal.show();
}

// Atualizar status do pedido
async function updateOrderStatus() {
    const orderId = document.getElementById('update-order-status-btn').getAttribute('data-order-id');
    const newStatus = document.getElementById('order-status-update').value;
    
    try {
        const response = await fetchWithTimeout(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminState.admin.token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            // Status atualizado com sucesso
            showToast('Status do pedido atualizado com sucesso!', 'success');
            
            // Fechar modal
            const orderDetailModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailModal'));
            orderDetailModal.hide();
            
            // Recarregar dados de pedidos
            loadOrdersData();
        } else {
            // Erro ao atualizar status
            showToast('Erro ao atualizar status do pedido. Tente novamente.', 'danger');
        }
    } catch (error) {
        console.error('Erro ao atualizar status do pedido:', error);
        
        // Simular sucesso para demonstração
        simulateOrderStatusUpdate(orderId, newStatus);
    }
}

// Simular atualização de status do pedido para demonstração
function simulateOrderStatusUpdate(orderId, newStatus) {
    // Atualizar status do pedido
    const index = adminState.orders.findIndex(o => o.id == orderId);
    if (index !== -1) {
        adminState.orders[index].status = newStatus;
    }
    
    // Mostrar mensagem de sucesso
    showToast('Status do pedido atualizado com sucesso!', 'success');
    
    // Fechar modal
    const orderDetailModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailModal'));
    orderDetailModal.hide();
    
    // Renderizar pedidos atualizados
    renderOrders(adminState.orders);
}

// Cancelar pedido
async function cancelOrder(orderId) {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
    
    try {
        const response = await fetchWithTimeout(`${API_URL}/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminState.admin.token}`
            }
        });
        
        if (response.ok) {
            // Pedido cancelado com sucesso
            showToast('Pedido cancelado com sucesso!', 'success');
            
            // Recarregar dados de pedidos
            loadOrdersData();
        } else {
            // Erro ao cancelar pedido
            showToast('Erro ao cancelar pedido. Tente novamente.', 'danger');
        }
    } catch (error) {
        console.error('Erro ao cancelar pedido:', error);
        
        // Simular sucesso para demonstração
        simulateOrderCancel(orderId);
    }
}

// Simular cancelamento de pedido para demonstração
function simulateOrderCancel(orderId) {
    // Atualizar status do pedido para cancelado
    const index = adminState.orders.findIndex(o => o.id == orderId);
    if (index !== -1) {
        adminState.orders[index].status = 'cancelled';
    }
    
    // Mostrar mensagem de sucesso
    showToast('Pedido cancelado com sucesso!', 'success');
    
    // Renderizar pedidos atualizados
    renderOrders(adminState.orders);
}

// Filtrar pedidos por status
function filterOrders(status) {
    if (status === 'all') {
        renderOrders(adminState.orders);
        return;
    }
    
    const filteredOrders = adminState.orders.filter(order => order.status === status);
    renderOrders(filteredOrders);
}

// Ver detalhes do cliente
function viewCustomerDetails(customerId) {
    // Implementação futura
    alert('Funcionalidade em desenvolvimento');
}

// Ver pedidos do cliente
function viewCustomerOrders(customerId) {
    // Filtrar pedidos do cliente
    const customerOrders = adminState.orders.filter(order => order.customer_id == customerId);
    
    // Mudar para a seção de pedidos
    document.getElementById('orders-link').click();
    
    // Renderizar pedidos do cliente
    renderOrders(customerOrders);
    
    // Mostrar mensagem
    showToast(`Exibindo pedidos do cliente #${customerId}`, 'info');
}

// Gerar relatório de vendas
function generateSalesReport() {
    const period = document.getElementById('sales-report-period').value;
    let startDate, endDate;
    
    if (period === 'custom') {
        startDate = document.getElementById('sales-report-start').value;
        endDate = document.getElementById('sales-report-end').value;
        
        if (!startDate || !endDate) {
            showToast('Por favor, selecione as datas inicial e final.', 'warning');
            return;
        }
    } else {
        // Calcular datas com base no período selecionado
        const today = new Date();
        endDate = formatDateForInput(today);
        
        switch (period) {
            case 'today':
                startDate = formatDateForInput(today);
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = formatDateForInput(yesterday);
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(weekStart.getDate() - 7);
                startDate = formatDateForInput(weekStart);
                break;
            case 'month':
                const monthStart = new Date(today);
                monthStart.setMonth(monthStart.getMonth() - 1);
                startDate = formatDateForInput(monthStart);
                break;
        }
    }
    
    // Simular geração de relatório
    const salesReportData = generateDemoSalesReportData(startDate, endDate);
    
    // Renderizar resultados
    renderSalesReport(salesReportData, startDate, endDate);
}

// Renderizar relatório de vendas
function renderSalesReport(data, startDate, endDate) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    const totalSales = data.reduce((total, item) => total + item.total, 0);
    const totalOrders = data.reduce((total, item) => total + item.orders, 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    const reportHTML = `
        <div class="card">
            <div class="card-header bg-white">
                <h6 class="card-title mb-0">Relatório de Vendas: ${formattedStartDate} a ${formattedEndDate}</h6>
            </div>
            <div class="card-body">
                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h6 class="card-title">Total de Vendas</h6>
                                <h3 class="mb-0">R$ ${formatPrice(totalSales)}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h6 class="card-title">Total de Pedidos</h6>
                                <h3 class="mb-0">${totalOrders}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-info text-white">
                            <div class="card-body text-center">
                                <h6 class="card-title">Ticket Médio</h6>
                                <h3 class="mb-0">R$ ${formatPrice(averageOrderValue)}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Pedidos</th>
                                <th>Vendas</th>
                                <th>Ticket Médio</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(item => `
                                <tr>
                                    <td>${formatDate(item.date)}</td>
                                    <td>${item.orders}</td>
                                    <td>R$ ${formatPrice(item.total)}</td>
                                    <td>R$ ${formatPrice(item.orders > 0 ? item.total / item.orders : 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="table-success">
                                <th>Total</th>
                                <th>${totalOrders}</th>
                                <th>R$ ${formatPrice(totalSales)}</th>
                                <th>R$ ${formatPrice(averageOrderValue)}</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    elements.salesReportResults.innerHTML = reportHTML;
}

// Gerar relatório de produtos
function generateProductsReport() {
    const period = document.getElementById('products-report-period').value;
    let startDate, endDate;
    
    if (period === 'custom') {
        startDate = document.getElementById('products-report-start').value;
        endDate = document.getElementById('products-report-end').value;
        
        if (!startDate || !endDate) {
            showToast('Por favor, selecione as datas inicial e final.', 'warning');
            return;
        }
    } else {
        // Calcular datas com base no período selecionado
        const today = new Date();
        endDate = formatDateForInput(today);
        
        switch (period) {
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(weekStart.getDate() - 7);
                startDate = formatDateForInput(weekStart);
                break;
            case 'month':
                const monthStart = new Date(today);
                monthStart.setMonth(monthStart.getMonth() - 1);
                startDate = formatDateForInput(monthStart);
                break;
            case 'quarter':
                const quarterStart = new Date(today);
                quarterStart.setMonth(quarterStart.getMonth() - 3);
                startDate = formatDateForInput(quarterStart);
                break;
            case 'year':
                const yearStart = new Date(today);
                yearStart.setFullYear(yearStart.getFullYear() - 1);
                startDate = formatDateForInput(yearStart);
                break;
        }
    }
    
    // Simular geração de relatório
    const productsReportData = generateDemoProductsReportData();
    
    // Renderizar resultados
    renderProductsReport(productsReportData, startDate, endDate);
}

// Renderizar relatório de produtos
function renderProductsReport(data, startDate, endDate) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    const totalQuantity = data.reduce((total, item) => total + item.quantity, 0);
    const totalRevenue = data.reduce((total, item) => total + item.revenue, 0);
    
    const reportHTML = `
        <div class="card">
            <div class="card-header bg-white">
                <h6 class="card-title mb-0">Relatório de Produtos: ${formattedStartDate} a ${formattedEndDate}</h6>
            </div>
            <div class="card-body">
                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h6 class="card-title">Total de Vendas</h6>
                                <h3 class="mb-0">R$ ${formatPrice(totalRevenue)}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h6 class="card-title">Itens Vendidos</h6>
                                <h3 class="mb-0">${totalQuantity}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Categoria</th>
                                <th>Quantidade</th>
                                <th>Receita</th>
                                <th>Preço Médio</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.category}</td>
                                    <td>${item.quantity}</td>
                                    <td>R$ ${formatPrice(item.revenue)}</td>
                                    <td>R$ ${formatPrice(item.revenue / item.quantity)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="table-success">
                                <th colspan="2">Total</th>
                                <th>${totalQuantity}</th>
                                <th>R$ ${formatPrice(totalRevenue)}</th>
                                <th>R$ ${formatPrice(totalRevenue / totalQuantity)}</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    elements.productsReportResults.innerHTML = reportHTML;
}

// Exportar relatório de vendas
function exportSalesReport() {
    // Simular exportação
    showToast('Relatório de vendas exportado com sucesso!', 'success');
}

// Exportar relatório de produtos
function exportProductsReport() {
    // Simular exportação
    showToast('Relatório de produtos exportado com sucesso!', 'success');
}

// Exportar relatório de clientes
function exportCustomersReport() {
    // Simular exportação
    showToast('Relatório de clientes exportado com sucesso!', 'success');
}

// Salvar configurações da loja
function saveStoreSettings() {
    // Simular salvamento
    showToast('Configurações da loja salvas com sucesso!', 'success');
}

// Salvar configurações de pagamento
function savePaymentSettings() {
    // Simular salvamento
    showToast('Configurações de pagamento salvas com sucesso!', 'success');
}

// Salvar configurações de notificação
function saveNotificationSettings() {
    // Simular salvamento
    showToast('Configurações de notificação salvas com sucesso!', 'success');
}

// Preencher select de categorias
function populateCategorySelect() {
    const categorySelect = document.getElementById('product-category');
    const categoryFilter = document.getElementById('category-filter');
    
    if (categorySelect) {
        // Limpar opções existentes, mantendo a primeira
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
        // Adicionar categorias
        adminState.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }
    
    if (categoryFilter) {
        // Limpar opções existentes, mantendo a primeira
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
        // Adicionar categorias
        adminState.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }
}

// Preencher formulário de configurações
function populateSettingsForm(settings) {
    // Configurações da loja
    document.getElementById('store-name').value = settings.store_name;
    document.getElementById('store-email').value = settings.store_email;
    document.getElementById('store-phone').value = settings.store_phone;
    document.getElementById('store-address').value = settings.store_address;
    document.getElementById('store-open-time').value = settings.store_open_time;
    document.getElementById('store-close-time').value = settings.store_close_time;
    document.getElementById('store-delivery-fee').value = settings.delivery_fee;
    document.getElementById('store-min-order').value = settings.min_order;
    
    // Configurações de pagamento
    document.getElementById('payment-money').checked = settings.payment_methods.includes('money');
    document.getElementById('payment-credit').checked = settings.payment_methods.includes('credit');
    document.getElementById('payment-debit').checked = settings.payment_methods.includes('debit');
    document.getElementById('payment-pix').checked = settings.payment_methods.includes('pix');
    document.getElementById('pix-key').value = settings.pix_key || '';
    
    // Configurações de notificação
    document.getElementById('notify-new-order').checked = settings.notifications.new_order;
    document.getElementById('notify-low-stock').checked = settings.notifications.low_stock;
    document.getElementById('notify-customer-message').checked = settings.notifications.customer_message;
}

// Fazer logout
function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        // Limpar dados de autenticação
        localStorage.removeItem('hortifruti_admin');
        
        // Redirecionar para página de login
        window.location.href = '/admin/login.html';
    }
}

// Carregar dados de demonstração
function loadDemoData() {
    // Dashboard
    elements.todayOrdersCount.textContent = '12';
    elements.todaySales.textContent = 'R$ 1.250,00';
    elements.productsCount.textContent = '48';
    elements.customersCount.textContent = '156';
    
    renderRecentOrders(getDemoRecentOrders());
    renderLowStockProducts(getDemoLowStockProducts());
    
    initCharts();
    
    // Produtos
    adminState.products = getDemoProducts();
    adminState.categories = getDemoCategories();
    
    // Pedidos
    adminState.orders = getDemoOrders();
    
    // Clientes
    adminState.customers = getDemoCustomers();
}

// Carregar dados de demonstração para seção específica
function loadDemoSectionData(section) {
    switch (section) {
        case 'dashboard':
            elements.todayOrdersCount.textContent = '12';
            elements.todaySales.textContent = 'R$ 1.250,00';
            elements.productsCount.textContent = '48';
            elements.customersCount.textContent = '156';
            
            renderRecentOrders(getDemoRecentOrders());
            renderLowStockProducts(getDemoLowStockProducts());
            
            initCharts();
            break;
        case 'products':
            adminState.products = getDemoProducts();
            adminState.categories = getDemoCategories();
            
            renderProducts(adminState.products);
            populateCategorySelect();
            break;
        case 'categories':
            adminState.categories = getDemoCategories();
            renderCategories(adminState.categories);
            break;
        case 'orders':
            adminState.orders = getDemoOrders();
            renderOrders(adminState.orders);
            break;
        case 'customers':
            adminState.customers = getDemoCustomers();
            renderCustomers(adminState.customers);
            break;
        case 'settings':
            populateSettingsForm(getDemoSettings());
            break;
    }
}

// Obter nome da categoria pelo ID
function getCategoryName(categoryId) {
    const category = adminState.categories.find(c => c.id == categoryId);
    return category ? category.name : 'Sem categoria';
}

// Obter contagem de produtos por categoria
function getProductCountByCategory(categoryId) {
    return adminState.products.filter(p => p.category_id == categoryId).length;
}

// Obter label de status
function getStatusLabel(status) {
    switch (status) {
        case 'pending':
            return 'Pendente';
        case 'processing':
            return 'Em Preparo';
        case 'shipping':
            return 'Em Entrega';
        case 'delivered':
            return 'Entregue';
        case 'cancelled':
            return 'Cancelado';
        default:
            return status;
    }
}

// Obter label de método de pagamento
function getPaymentMethodLabel(method) {
    switch (method) {
        case 'money':
            return 'Dinheiro';
        case 'credit':
            return 'Cartão de Crédito';
        case 'debit':
            return 'Cartão de Débito';
        case 'pix':
            return 'PIX';
        default:
            return method;
    }
}

// Formatar endereço
function formatAddress(address) {
    if (!address) return 'Endereço não disponível';
    
    return `${address.address}, ${address.number}${address.complement ? `, ${address.complement}` : ''} - ${address.neighborhood}, ${address.city}`;
}

// Formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Formatar data para input
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Formatar preço
function formatPrice(price) {
    return price.toFixed(2).replace('.', ',');
}

// Obter últimos 7 dias
function getLast7Days() {
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        result.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    }
    return result;
}

// Mostrar toast
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

// Fetch com timeout
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        
        clearTimeout(id);
        
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// Dados de demonstração
function getDemoRecentOrders() {
    return [
        {
            id: 1001,
            customer_name: 'João Silva',
            total: 78.50,
            status: 'pending'
        },
        {
            id: 1000,
            customer_name: 'Maria Oliveira',
            total: 45.90,
            status: 'processing'
        },
        {
            id: 999,
            customer_name: 'Pedro Santos',
            total: 120.75,
            status: 'shipping'
        },
        {
            id: 998,
            customer_name: 'Ana Costa',
            total: 65.30,
            status: 'delivered'
        },
        {
            id: 997,
            customer_name: 'Carlos Ferreira',
            total: 92.40,
            status: 'cancelled'
        }
    ];
}

function getDemoLowStockProducts() {
    return [
        {
            id: 1,
            name: 'Maçã Gala',
            category_id: 1,
            price: 5.99,
            stock: 3
        },
        {
            id: 5,
            name: 'Cenoura',
            category_id: 3,
            price: 3.99,
            stock: 5
        },
        {
            id: 8,
            name: 'Abacate',
            category_id: 1,
            price: 7.99,
            stock: 2
        },
        {
            id: 12,
            name: 'Alho',
            category_id: 3,
            price: 2.50,
            stock: 4
        }
    ];
}

function getDemoSalesData() {
    return [1250, 980, 1450, 1100, 1300, 1600, 1200];
}

function getDemoTopProductsData() {
    return [
        { name: 'Banana Prata', quantity: 120 },
        { name: 'Maçã Gala', quantity: 85 },
        { name: 'Tomate', quantity: 75 },
        { name: 'Alface', quantity: 60 },
        { name: 'Laranja', quantity: 50 }
    ];
}

function getDemoProducts() {
    return [
        {
            id: 1,
            name: 'Maçã Gala',
            description: 'Maçã fresca e suculenta',
            price: 5.99,
            unit: 'kg',
            image: '/static/images/apple.jpg',
            category_id: 1,
            stock: 3,
            organic: false,
            featured: true,
            active: true,
            discount: 0,
            created_at: '2025-05-01T10:00:00Z'
        },
        {
            id: 2,
            name: 'Banana Prata',
            description: 'Banana madura e doce',
            price: 4.50,
            unit: 'kg',
            image: '/static/images/banana.jpg',
            category_id: 1,
            stock: 15,
            organic: false,
            featured: true,
            active: true,
            discount: 10,
            created_at: '2025-05-01T10:00:00Z'
        },
        {
            id: 3,
            name: 'Alface Crespa',
            description: 'Alface fresca e crocante',
            price: 2.99,
            unit: 'unid',
            image: '/static/images/lettuce.jpg',
            category_id: 2,
            stock: 8,
            organic: true,
            featured: false,
            active: true,
            discount: 0,
            created_at: '2025-05-01T10:00:00Z'
        },
        {
            id: 4,
            name: 'Tomate Italiano',
            description: 'Tomate maduro e suculento',
            price: 6.99,
            unit: 'kg',
            image: '/static/images/tomato.jpg',
            category_id: 3,
            stock: 12,
            organic: false,
            featured: true,
            active: true,
            discount: 0,
            created_at: '2025-05-01T10:00:00Z'
        },
        {
            id: 5,
            name: 'Cenoura',
            description: 'Cenoura fresca e crocante',
            price: 3.99,
            unit: 'kg',
            image: '/static/images/carrot.jpg',
            category_id: 3,
            stock: 5,
            organic: true,
            featured: false,
            active: true,
            discount: 15,
            created_at: '2025-05-01T10:00:00Z'
        },
        {
            id: 6,
            name: 'Morango',
            description: 'Morango doce e suculento',
            price: 8.99,
            unit: 'bandeja',
            image: '/static/images/strawberry.jpg',
            category_id: 1,
            stock: 7,
            organic: true,
            featured: true,
            active: true,
            discount: 0,
            created_at: '2025-05-01T10:00:00Z'
        },
        {
            id: 7,
            name: 'Brócolis',
            description: 'Brócolis fresco e nutritivo',
            price: 5.50,
            unit: 'unid',
            image: '/static/images/broccoli.jpg',
            category_id: 2,
            stock: 10,
            organic: false,
            featured: false,
            active: true,
            discount: 0,
            created_at: '2025-05-01T10:00:00Z'
        },
        {
            id: 8,
            name: 'Abacate',
            description: 'Abacate maduro e cremoso',
            price: 7.99,
            unit: 'unid',
            image: '/static/images/avocado.jpg',
            category_id: 1,
            stock: 2,
            organic: false,
            featured: true,
            active: true,
            discount: 20,
            created_at: '2025-05-01T10:00:00Z'
        }
    ];
}

function getDemoCategories() {
    return [
        {
            id: 1,
            name: 'Frutas',
            description: 'Frutas frescas e selecionadas',
            image: '/static/images/frutas.jpg',
            created_at: '2025-05-01T10:00:00Z'
        },
        {
            id: 2,
            name: 'Verduras',
            description: 'Verduras frescas e selecionadas',
            image: '/static/images/verduras.jpg',
            created_at: '2025-05-01T10:00:00Z'
        },
        {
            id: 3,
            name: 'Legumes',
            description: 'Legumes frescos e selecionados',
            image: '/static/images/legumes.jpg',
            created_at: '2025-05-01T10:00:00Z'
        },
        {
            id: 4,
            name: 'Orgânicos',
            description: 'Produtos orgânicos certificados',
            image: '/static/images/organicos.jpg',
            created_at: '2025-05-01T10:00:00Z'
        }
    ];
}

function getDemoOrders() {
    return [
        {
            id: 1001,
            customer_id: 1,
            customer_name: 'João Silva',
            customer_email: 'joao.silva@example.com',
            customer_phone: '(11) 98765-4321',
            items: [
                {
                    product_id: 1,
                    product_name: 'Maçã Gala',
                    price: 5.99,
                    quantity: 2
                },
                {
                    product_id: 2,
                    product_name: 'Banana Prata',
                    price: 4.50,
                    quantity: 1.5
                },
                {
                    product_id: 4,
                    product_name: 'Tomate Italiano',
                    price: 6.99,
                    quantity: 1
                }
            ],
            delivery_address: {
                address: 'Rua das Flores',
                number: '123',
                complement: 'Apto 101',
                neighborhood: 'Jardim Primavera',
                city: 'São Paulo'
            },
            payment: {
                method: 'credit',
                change: null
            },
            notes: 'Entregar no período da tarde.',
            subtotal: 24.97,
            delivery_fee: 5.99,
            total: 30.96,
            status: 'pending',
            created_at: '2025-05-17T14:30:00Z'
        },
        {
            id: 1000,
            customer_id: 2,
            customer_name: 'Maria Oliveira',
            customer_email: 'maria.oliveira@example.com',
            customer_phone: '(11) 98765-1234',
            items: [
                {
                    product_id: 3,
                    product_name: 'Alface Crespa',
                    price: 2.99,
                    quantity: 2
                },
                {
                    product_id: 5,
                    product_name: 'Cenoura',
                    price: 3.99,
                    quantity: 1
                },
                {
                    product_id: 7,
                    product_name: 'Brócolis',
                    price: 5.50,
                    quantity: 1
                }
            ],
            delivery_address: {
                address: 'Avenida Paulista',
                number: '1000',
                complement: 'Bloco B, Apto 502',
                neighborhood: 'Bela Vista',
                city: 'São Paulo'
            },
            payment: {
                method: 'pix',
                change: null
            },
            notes: '',
            subtotal: 15.47,
            delivery_fee: 5.99,
            total: 21.46,
            status: 'processing',
            created_at: '2025-05-17T10:15:00Z'
        },
        {
            id: 999,
            customer_id: 3,
            customer_name: 'Pedro Santos',
            customer_email: 'pedro.santos@example.com',
            customer_phone: '(11) 97654-3210',
            items: [
                {
                    product_id: 6,
                    product_name: 'Morango',
                    price: 8.99,
                    quantity: 2
                },
                {
                    product_id: 8,
                    product_name: 'Abacate',
                    price: 7.99,
                    quantity: 3
                },
                {
                    product_id: 2,
                    product_name: 'Banana Prata',
                    price: 4.50,
                    quantity: 2
                }
            ],
            delivery_address: {
                address: 'Rua Augusta',
                number: '500',
                complement: 'Casa',
                neighborhood: 'Consolação',
                city: 'São Paulo'
            },
            payment: {
                method: 'money',
                change: 100.00
            },
            notes: 'Deixar na portaria.',
            subtotal: 47.95,
            delivery_fee: 5.99,
            total: 53.94,
            status: 'shipping',
            created_at: '2025-05-16T16:45:00Z'
        },
        {
            id: 998,
            customer_id: 4,
            customer_name: 'Ana Costa',
            customer_email: 'ana.costa@example.com',
            customer_phone: '(11) 96543-2109',
            items: [
                {
                    product_id: 1,
                    product_name: 'Maçã Gala',
                    price: 5.99,
                    quantity: 1
                },
                {
                    product_id: 3,
                    product_name: 'Alface Crespa',
                    price: 2.99,
                    quantity: 1
                },
                {
                    product_id: 4,
                    product_name: 'Tomate Italiano',
                    price: 6.99,
                    quantity: 1
                }
            ],
            delivery_address: {
                address: 'Rua Oscar Freire',
                number: '300',
                complement: 'Apto 1001',
                neighborhood: 'Jardins',
                city: 'São Paulo'
            },
            payment: {
                method: 'debit',
                change: null
            },
            notes: '',
            subtotal: 15.97,
            delivery_fee: 5.99,
            total: 21.96,
            status: 'delivered',
            created_at: '2025-05-16T09:30:00Z'
        },
        {
            id: 997,
            customer_id: 5,
            customer_name: 'Carlos Ferreira',
            customer_email: 'carlos.ferreira@example.com',
            customer_phone: '(11) 95432-1098',
            items: [
                {
                    product_id: 5,
                    product_name: 'Cenoura',
                    price: 3.99,
                    quantity: 2
                },
                {
                    product_id: 7,
                    product_name: 'Brócolis',
                    price: 5.50,
                    quantity: 1
                },
                {
                    product_id: 8,
                    product_name: 'Abacate',
                    price: 7.99,
                    quantity: 2
                }
            ],
            delivery_address: {
                address: 'Rua Haddock Lobo',
                number: '150',
                complement: 'Casa 2',
                neighborhood: 'Cerqueira César',
                city: 'São Paulo'
            },
            payment: {
                method: 'credit',
                change: null
            },
            notes: 'Cliente solicitou cancelamento.',
            subtotal: 29.46,
            delivery_fee: 5.99,
            total: 35.45,
            status: 'cancelled',
            created_at: '2025-05-15T14:00:00Z'
        }
    ];
}

function getDemoCustomers() {
    return [
        {
            id: 1,
            name: 'João Silva',
            email: 'joao.silva@example.com',
            phone: '(11) 98765-4321',
            orders_count: 5,
            total_spent: 150.75,
            created_at: '2025-04-10T10:00:00Z'
        },
        {
            id: 2,
            name: 'Maria Oliveira',
            email: 'maria.oliveira@example.com',
            phone: '(11) 98765-1234',
            orders_count: 3,
            total_spent: 89.90,
            created_at: '2025-04-12T14:30:00Z'
        },
        {
            id: 3,
            name: 'Pedro Santos',
            email: 'pedro.santos@example.com',
            phone: '(11) 97654-3210',
            orders_count: 7,
            total_spent: 320.45,
            created_at: '2025-04-05T09:15:00Z'
        },
        {
            id: 4,
            name: 'Ana Costa',
            email: 'ana.costa@example.com',
            phone: '(11) 96543-2109',
            orders_count: 2,
            total_spent: 65.30,
            created_at: '2025-04-20T16:45:00Z'
        },
        {
            id: 5,
            name: 'Carlos Ferreira',
            email: 'carlos.ferreira@example.com',
            phone: '(11) 95432-1098',
            orders_count: 4,
            total_spent: 175.80,
            created_at: '2025-04-15T11:30:00Z'
        }
    ];
}

function getDemoSettings() {
    return {
        store_name: 'Hortifruti Delivery',
        store_email: 'contato@hortifrutidelivery.com.br',
        store_phone: '(11) 99999-9999',
        store_address: 'Rua das Hortaliças, 123',
        store_open_time: '08:00',
        store_close_time: '20:00',
        delivery_fee: 5.99,
        min_order: 20.00,
        payment_methods: ['money', 'credit', 'debit', 'pix'],
        pix_key: 'contato@hortifrutidelivery.com.br',
        notifications: {
            new_order: true,
            low_stock: true,
            customer_message: true
        }
    };
}

function generateDemoSalesReportData(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    const result = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        
        // Gerar dados aleatórios
        const orders = Math.floor(Math.random() * 10) + 5;
        const total = (Math.random() * 500) + 500;
        
        result.push({
            date: formatDateForInput(date),
            orders: orders,
            total: total
        });
    }
    
    return result;
}

function generateDemoProductsReportData() {
    return [
        {
            name: 'Banana Prata',
            category: 'Frutas',
            quantity: 120,
            revenue: 540.00
        },
        {
            name: 'Maçã Gala',
            category: 'Frutas',
            quantity: 85,
            revenue: 509.15
        },
        {
            name: 'Tomate Italiano',
            category: 'Legumes',
            quantity: 75,
            revenue: 524.25
        },
        {
            name: 'Alface Crespa',
            category: 'Verduras',
            quantity: 60,
            revenue: 179.40
        },
        {
            name: 'Cenoura',
            category: 'Legumes',
            quantity: 55,
            revenue: 219.45
        },
        {
            name: 'Morango',
            category: 'Frutas',
            quantity: 45,
            revenue: 404.55
        },
        {
            name: 'Brócolis',
            category: 'Verduras',
            quantity: 40,
            revenue: 220.00
        },
        {
            name: 'Abacate',
            category: 'Frutas',
            quantity: 35,
            revenue: 279.65
        }
    ];
}
