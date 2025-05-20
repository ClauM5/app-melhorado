// Arquivo JavaScript para corrigir o painel administrativo
// Este script substitui o comportamento problemático de redirecionamento

document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na página de administração
    if (document.querySelector('.admin-sidebar')) {
        initAdminPanel();
    }
});

function initAdminPanel() {
    // Verificar autenticação do administrador
    checkAdminAuth();
    
    // Configurar navegação do painel
    setupAdminNavigation();
    
    // Configurar botão de logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        logout();
    });
    
    // Carregar dados iniciais do dashboard
    loadDashboardData();
}

function checkAdminAuth() {
    // Recuperar token e informações do usuário do localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    
    // Se não houver token ou o usuário não for admin, redirecionar para a página inicial
    if (!token || !user || !user.is_admin) {
        window.location.href = '/';
        return false;
    }
    
    return true;
}

function setupAdminNavigation() {
    // Obter todos os links de navegação
    const navLinks = document.querySelectorAll('.admin-sidebar .nav-link');
    
    // Adicionar evento de clique a cada link
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover classe ativa de todos os links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Adicionar classe ativa ao link clicado
            link.classList.add('active');
            
            // Obter o ID do link
            const linkId = link.id;
            
            // Atualizar título da página
            updatePageTitle(linkId);
            
            // Mostrar a seção correspondente
            showSection(linkId);
        });
    });
    
    // Configurar links adicionais
    document.getElementById('view-all-orders').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('orders-link').click();
    });
    
    document.getElementById('view-all-products').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('products-link').click();
    });
}

function updatePageTitle(linkId) {
    const pageTitle = document.getElementById('page-title');
    
    switch(linkId) {
        case 'dashboard-link':
            pageTitle.textContent = 'Dashboard';
            break;
        case 'orders-link':
            pageTitle.textContent = 'Gerenciar Pedidos';
            break;
        case 'products-link':
            pageTitle.textContent = 'Gerenciar Produtos';
            break;
        case 'categories-link':
            pageTitle.textContent = 'Gerenciar Categorias';
            break;
        case 'customers-link':
            pageTitle.textContent = 'Gerenciar Clientes';
            break;
        case 'reports-link':
            pageTitle.textContent = 'Relatórios';
            break;
        case 'settings-link':
            pageTitle.textContent = 'Configurações';
            break;
        default:
            pageTitle.textContent = 'Dashboard';
    }
}

function showSection(linkId) {
    // Ocultar todas as seções de conteúdo
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar a seção correspondente ao link clicado
    let sectionId;
    
    switch(linkId) {
        case 'dashboard-link':
            sectionId = 'dashboard-content';
            loadDashboardData();
            break;
        case 'orders-link':
            sectionId = 'orders-content';
            loadOrdersData();
            break;
        case 'products-link':
            sectionId = 'products-content';
            loadProductsData();
            break;
        case 'categories-link':
            sectionId = 'categories-content';
            loadCategoriesData();
            break;
        case 'customers-link':
            sectionId = 'customers-content';
            loadCustomersData();
            break;
        case 'reports-link':
            sectionId = 'reports-content';
            loadReportsData();
            break;
        case 'settings-link':
            sectionId = 'settings-content';
            loadSettingsData();
            break;
        default:
            sectionId = 'dashboard-content';
            loadDashboardData();
    }
    
    // Mostrar a seção correspondente
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
}

function loadDashboardData() {
    // Simulação de carregamento de dados do dashboard
    // Em uma implementação real, isso faria chamadas à API
    
    // Atualizar contadores
    document.getElementById('today-orders-count').textContent = '5';
    document.getElementById('today-sales').textContent = 'R$ 350,00';
    document.getElementById('products-count').textContent = '42';
    document.getElementById('customers-count').textContent = '18';
    
    // Carregar tabela de pedidos recentes
    const recentOrdersTable = document.getElementById('recent-orders-table');
    if (recentOrdersTable) {
        recentOrdersTable.innerHTML = `
            <tr>
                <td>#1001</td>
                <td>João Silva</td>
                <td>R$ 75,90</td>
                <td><span class="badge bg-warning text-dark">Pendente</span></td>
            </tr>
            <tr>
                <td>#1002</td>
                <td>Maria Oliveira</td>
                <td>R$ 42,50</td>
                <td><span class="badge bg-info text-white">Em Preparo</span></td>
            </tr>
            <tr>
                <td>#1003</td>
                <td>Carlos Santos</td>
                <td>R$ 128,75</td>
                <td><span class="badge bg-primary">Em Entrega</span></td>
            </tr>
            <tr>
                <td>#1004</td>
                <td>Ana Pereira</td>
                <td>R$ 56,20</td>
                <td><span class="badge bg-success">Entregue</span></td>
            </tr>
            <tr>
                <td>#1005</td>
                <td>Pedro Costa</td>
                <td>R$ 89,90</td>
                <td><span class="badge bg-warning text-dark">Pendente</span></td>
            </tr>
        `;
    }
    
    // Carregar tabela de produtos com estoque baixo
    const lowStockTable = document.getElementById('low-stock-table');
    if (lowStockTable) {
        lowStockTable.innerHTML = `
            <tr>
                <td>Maçã Gala</td>
                <td>Frutas</td>
                <td>R$ 8,90</td>
                <td><span class="badge bg-danger">3</span></td>
            </tr>
            <tr>
                <td>Alface Crespa</td>
                <td>Verduras</td>
                <td>R$ 3,50</td>
                <td><span class="badge bg-warning text-dark">5</span></td>
            </tr>
            <tr>
                <td>Tomate Italiano</td>
                <td>Legumes</td>
                <td>R$ 6,90</td>
                <td><span class="badge bg-warning text-dark">7</span></td>
            </tr>
            <tr>
                <td>Banana Prata</td>
                <td>Frutas</td>
                <td>R$ 5,90</td>
                <td><span class="badge bg-warning text-dark">8</span></td>
            </tr>
        `;
    }
    
    // Inicializar gráficos (se Chart.js estiver disponível)
    if (typeof Chart !== 'undefined') {
        initCharts();
    }
}

function loadOrdersData() {
    // Implementação para carregar dados de pedidos
    console.log('Carregando dados de pedidos...');
}

function loadProductsData() {
    // Implementação para carregar dados de produtos
    console.log('Carregando dados de produtos...');
}

function loadCategoriesData() {
    // Implementação para carregar dados de categorias
    console.log('Carregando dados de categorias...');
}

function loadCustomersData() {
    // Implementação para carregar dados de clientes
    console.log('Carregando dados de clientes...');
}

function loadReportsData() {
    // Implementação para carregar dados de relatórios
    console.log('Carregando dados de relatórios...');
}

function loadSettingsData() {
    // Implementação para carregar dados de configurações
    console.log('Carregando dados de configurações...');
}

function initCharts() {
    // Gráfico de vendas dos últimos 7 dias
    const salesCtx = document.getElementById('sales-chart');
    if (salesCtx) {
        new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Vendas (R$)',
                    data: [280, 320, 250, 390, 420, 550, 350],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Gráfico de produtos mais vendidos
    const topProductsCtx = document.getElementById('top-products-chart');
    if (topProductsCtx) {
        new Chart(topProductsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Banana', 'Maçã', 'Laranja', 'Alface', 'Tomate'],
                datasets: [{
                    data: [25, 20, 18, 15, 12],
                    backgroundColor: [
                        '#FFC107',
                        '#F44336',
                        '#FF9800',
                        '#4CAF50',
                        '#E91E63'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

function logout() {
    // Limpar dados de autenticação
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirecionar para a página inicial
    window.location.href = '/';
}
