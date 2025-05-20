// Funcionalidades do painel administrativo para Hortifruti Delivery

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar eventos específicos do painel admin
    if (document.getElementById('admin-dashboard')) {
        setupAdminEvents();
    }
});

// Configurar eventos do painel administrativo
function setupAdminEvents() {
    // Verificar se o usuário é admin
    if (!state.token || !state.isAdmin) {
        navigateTo('home');
        return;
    }
    
    // Configurar navegação do painel
    setupAdminNavigation();
    
    // Carregar dados iniciais
    loadAdminDashboardData();
    
    // Configurar formulários
    setupAdminForms();
}

// Configurar navegação do painel
function setupAdminNavigation() {
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover classe ativa de todos os links
            document.querySelectorAll('.admin-nav-link').forEach(l => {
                l.classList.remove('active');
            });
            
            // Adicionar classe ativa ao link clicado
            link.classList.add('active');
            
            // Obter seção alvo
            const target = link.getAttribute('data-target');
            
            // Ocultar todas as seções
            document.querySelectorAll('.admin-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Mostrar seção alvo
            document.getElementById(target).style.display = 'block';
            
            // Carregar dados da seção
            switch (target) {
                case 'admin-dashboard-section':
                    loadAdminDashboardData();
                    break;
                case 'admin-products-section':
                    loadAdminProducts();
                    break;
                case 'admin-categories-section':
                    loadAdminCategories();
                    break;
                case 'admin-orders-section':
                    loadAdminOrders();
                    break;
                case 'admin-users-section':
                    loadAdminUsers();
                    break;
                case 'admin-settings-section':
                    loadAdminSettings();
                    break;
            }
        });
    });
}

// Carregar dados do dashboard
function loadAdminDashboardData() {
    // Em uma implementação real, isso faria chamadas à API para obter estatísticas
    // Aqui apenas simulamos alguns dados
    
    // Contadores
    document.getElementById('admin-total-orders').textContent = '0';
    document.getElementById('admin-total-products').textContent = '0';
    document.getElementById('admin-total-users').textContent = '0';
    document.getElementById('admin-total-revenue').textContent = 'R$ 0,00';
    
    // Carregar dados reais
    Promise.all([
        fetch(`${API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        }).then(res => res.json()),
        fetch(`${API_URL}/products`).then(res => res.json()),
        fetch(`${API_URL}/users/count`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        }).catch(() => ({ count: 0 }))
    ])
    .then(([ordersData, productsData, usersData]) => {
        // Atualizar contadores
        document.getElementById('admin-total-orders').textContent = ordersData.orders ? ordersData.orders.length : '0';
        document.getElementById('admin-total-products').textContent = productsData.products ? productsData.products.length : '0';
        document.getElementById('admin-total-users').textContent = usersData.count || '0';
        
        // Calcular receita total
        let totalRevenue = 0;
        if (ordersData.orders) {
            ordersData.orders.forEach(order => {
                if (order.status !== 'cancelled') {
                    totalRevenue += order.total;
                }
            });
        }
        document.getElementById('admin-total-revenue').textContent = `R$ ${totalRevenue.toFixed(2)}`;
        
        // Carregar pedidos recentes
        loadRecentOrders(ordersData.orders || []);
    })
    .catch(error => {
        console.error('Erro ao carregar dados do dashboard:', error);
        showToast('Erro ao carregar dados do dashboard', 'error');
    });
}

// Carregar pedidos recentes
function loadRecentOrders(orders) {
    const recentOrdersTable = document.getElementById('admin-recent-orders');
    const tbody = recentOrdersTable.querySelector('tbody');
    
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum pedido encontrado</td></tr>';
        return;
    }
    
    // Ordenar por data (mais recentes primeiro)
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Mostrar apenas os 5 mais recentes
    const recentOrders = orders.slice(0, 5);
    
    recentOrders.forEach(order => {
        const tr = document.createElement('tr');
        
        // Traduzir status
        let statusText = '';
        let badgeClass = '';
        switch (order.status) {
            case 'pending':
                statusText = 'Pendente';
                badgeClass = 'badge-pending';
                break;
            case 'processing':
                statusText = 'Em processamento';
                badgeClass = 'badge-processing';
                break;
            case 'shipped':
                statusText = 'Enviado';
                badgeClass = 'badge-shipped';
                break;
            case 'delivered':
                statusText = 'Entregue';
                badgeClass = 'badge-delivered';
                break;
            case 'cancelled':
                statusText = 'Cancelado';
                badgeClass = 'badge-cancelled';
                break;
            default:
                statusText = 'Pendente';
                badgeClass = 'badge-pending';
        }
        
        // Formatar data
        const date = new Date(order.created_at);
        const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
        
        tr.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.user_id}</td>
            <td>R$ ${order.total.toFixed(2)}</td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
            <td>${formattedDate}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Carregar produtos para o painel admin
function loadAdminProducts() {
    const productsTable = document.getElementById('admin-products-table');
    const tbody = productsTable.querySelector('tbody');
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border spinner-border-sm text-success" role="status"><span class="visually-hidden">Carregando...</span></div> Carregando produtos...</td></tr>';
    
    fetch(`${API_URL}/products`)
        .then(response => response.json())
        .then(data => {
            tbody.innerHTML = '';
            
            if (!data.products || data.products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum produto encontrado</td></tr>';
                return;
            }
            
            data.products.forEach(product => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${product.id}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${product.image || '/static/images/products/default.jpg'}" alt="${product.name}" class="me-2" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                            ${product.name}
                        </div>
                    </td>
                    <td>R$ ${product.price.toFixed(2)}</td>
                    <td>${product.stock}</td>
                    <td>${product.category_id}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1 edit-product" data-id="${product.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-product" data-id="${product.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
            
            // Adicionar eventos aos botões
            document.querySelectorAll('.edit-product').forEach(button => {
                button.addEventListener('click', () => {
                    const productId = parseInt(button.getAttribute('data-id'));
                    editProduct(productId);
                });
            });
            
            document.querySelectorAll('.delete-product').forEach(button => {
                button.addEventListener('click', () => {
                    const productId = parseInt(button.getAttribute('data-id'));
                    deleteProduct(productId);
                });
            });
        })
        .catch(error => {
            console.error('Erro ao carregar produtos:', error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Erro ao carregar produtos. Tente novamente mais tarde.</td></tr>';
        });
}

// Editar produto
function editProduct(productId) {
    // Obter produto
    fetch(`${API_URL}/products/${productId}`)
        .then(response => response.json())
        .then(data => {
            const product = data.product;
            
            // Preencher formulário
            document.getElementById('edit-product-id').value = product.id;
            document.getElementById('edit-product-name').value = product.name;
            document.getElementById('edit-product-description').value = product.description || '';
            document.getElementById('edit-product-price').value = product.price;
            document.getElementById('edit-product-stock').value = product.stock;
            document.getElementById('edit-product-unit').value = product.unit;
            document.getElementById('edit-product-category').value = product.category_id;
            document.getElementById('edit-product-featured').checked = product.featured === 1;
            document.getElementById('edit-product-current-image').src = product.image || '/static/images/products/default.jpg';
            
            // Mostrar modal
            const editProductModal = new bootstrap.Modal(document.getElementById('editProductModal'));
            editProductModal.show();
        })
        .catch(error => {
            console.error('Erro ao carregar produto:', error);
            showToast('Erro ao carregar produto', 'error');
        });
}

// Excluir produto
function deleteProduct(productId) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao excluir produto');
            }
            return response.json();
        })
        .then(data => {
            showToast('Produto excluído com sucesso', 'success');
            loadAdminProducts();
        })
        .catch(error => {
            console.error('Erro ao excluir produto:', error);
            showToast('Erro ao excluir produto', 'error');
        });
    }
}

// Carregar categorias para o painel admin
function loadAdminCategories() {
    const categoriesTable = document.getElementById('admin-categories-table');
    const tbody = categoriesTable.querySelector('tbody');
    
    tbody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border spinner-border-sm text-success" role="status"><span class="visually-hidden">Carregando...</span></div> Carregando categorias...</td></tr>';
    
    fetch(`${API_URL}/categories`)
        .then(response => response.json())
        .then(data => {
            tbody.innerHTML = '';
            
            if (!data.categories || data.categories.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma categoria encontrada</td></tr>';
                return;
            }
            
            data.categories.forEach(category => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${category.id}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${category.image || '/static/images/categories/default.jpg'}" alt="${category.name}" class="me-2" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                            ${category.name}
                        </div>
                    </td>
                    <td>${category.description || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1 edit-category" data-id="${category.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-category" data-id="${category.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
            
            // Adicionar eventos aos botões
            document.querySelectorAll('.edit-category').forEach(button => {
                button.addEventListener('click', () => {
                    const categoryId = parseInt(button.getAttribute('data-id'));
                    editCategory(categoryId);
                });
            });
            
            document.querySelectorAll('.delete-category').forEach(button => {
                button.addEventListener('click', () => {
                    const categoryId = parseInt(button.getAttribute('data-id'));
                    deleteCategory(categoryId);
                });
            });
        })
        .catch(error => {
            console.error('Erro ao carregar categorias:', error);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Erro ao carregar categorias. Tente novamente mais tarde.</td></tr>';
        });
}

// Editar categoria
function editCategory(categoryId) {
    // Obter categoria
    fetch(`${API_URL}/categories/${categoryId}`)
        .then(response => response.json())
        .then(data => {
            const category = data.category;
            
            // Preencher formulário
            document.getElementById('edit-category-id').value = category.id;
            document.getElementById('edit-category-name').value = category.name;
            document.getElementById('edit-category-description').value = category.description || '';
            document.getElementById('edit-category-current-image').src = category.image || '/static/images/categories/default.jpg';
            
            // Mostrar modal
            const editCategoryModal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
            editCategoryModal.show();
        })
        .catch(error => {
            console.error('Erro ao carregar categoria:', error);
            showToast('Erro ao carregar categoria', 'error');
        });
}

// Excluir categoria
function deleteCategory(categoryId) {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
        fetch(`${API_URL}/categories/${categoryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao excluir categoria');
            }
            return response.json();
        })
        .then(data => {
            showToast('Categoria excluída com sucesso', 'success');
            loadAdminCategories();
        })
        .catch(error => {
            console.error('Erro ao excluir categoria:', error);
            showToast('Erro ao excluir categoria. Verifique se não há produtos associados a esta categoria.', 'error');
        });
    }
}

// Carregar pedidos para o painel admin
function loadAdminOrders() {
    const ordersTable = document.getElementById('admin-orders-table');
    const tbody = ordersTable.querySelector('tbody');
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border spinner-border-sm text-success" role="status"><span class="visually-hidden">Carregando...</span></div> Carregando pedidos...</td></tr>';
    
    fetch(`${API_URL}/orders`, {
        headers: {
            'Authorization': `Bearer ${state.token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        tbody.innerHTML = '';
        
        if (!data.orders || data.orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum pedido encontrado</td></tr>';
            return;
        }
        
        data.orders.forEach(order => {
            const tr = document.createElement('tr');
            
            // Traduzir status
            let statusText = '';
            let badgeClass = '';
            switch (order.status) {
                case 'pending':
                    statusText = 'Pendente';
                    badgeClass = 'badge-pending';
                    break;
                case 'processing':
                    statusText = 'Em processamento';
                    badgeClass = 'badge-processing';
                    break;
                case 'shipped':
                    statusText = 'Enviado';
                    badgeClass = 'badge-shipped';
                    break;
                case 'delivered':
                    statusText = 'Entregue';
                    badgeClass = 'badge-delivered';
                    break;
                case 'cancelled':
                    statusText = 'Cancelado';
                    badgeClass = 'badge-cancelled';
                    break;
                default:
                    statusText = 'Pendente';
                    badgeClass = 'badge-pending';
            }
            
            // Formatar data
            const date = new Date(order.created_at);
            const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
            
            tr.innerHTML = `
                <td>#${order.id}</td>
                <td>${order.user_id}</td>
                <td>R$ ${order.total.toFixed(2)}</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>${formattedDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1 view-order" data-id="${order.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success update-status" data-id="${order.id}">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Adicionar eventos aos botões
        document.querySelectorAll('.view-order').forEach(button => {
            button.addEventListener('click', () => {
                const orderId = parseInt(button.getAttribute('data-id'));
                viewAdminOrder(orderId);
            });
        });
        
        document.querySelectorAll('.update-status').forEach(button => {
            button.addEventListener('click', () => {
                const orderId = parseInt(button.getAttribute('data-id'));
                updateOrderStatus(orderId);
            });
        });
    })
    .catch(error => {
        console.error('Erro ao carregar pedidos:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Erro ao carregar pedidos. Tente novamente mais tarde.</td></tr>';
    });
}

// Visualizar pedido (admin)
function viewAdminOrder(orderId) {
    // Obter pedido
    fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
            'Authorization': `Bearer ${state.token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const order = data.order;
        
        // Preencher detalhes do pedido
        document.getElementById('admin-order-id').textContent = order.id;
        document.getElementById('admin-order-user-id').textContent = order.user_id;
        
        // Traduzir status
        let statusText = '';
        let badgeClass = '';
        switch (order.status) {
            case 'pending':
                statusText = 'Pendente';
                badgeClass = 'badge-pending';
                break;
            case 'processing':
                statusText = 'Em processamento';
                badgeClass = 'badge-processing';
                break;
            case 'shipped':
                statusText = 'Enviado';
                badgeClass = 'badge-shipped';
                break;
            case 'delivered':
                statusText = 'Entregue';
                badgeClass = 'badge-delivered';
                break;
            case 'cancelled':
                statusText = 'Cancelado';
                badgeClass = 'badge-cancelled';
                break;
            default:
                statusText = 'Pendente';
                badgeClass = 'badge-pending';
        }
        
        document.getElementById('admin-order-status').className = `badge ${badgeClass}`;
        document.getElementById('admin-order-status').textContent = statusText;
        
        // Formatar data
        const date = new Date(order.created_at);
        const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
        document.getElementById('admin-order-date').textContent = formattedDate;
        
        // Preencher itens
        const orderItems = document.getElementById('admin-order-items');
        orderItems.innerHTML = '';
        
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
            
            orderItems.appendChild(tr);
        });
        
        // Preencher totais
        document.getElementById('admin-order-subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
        document.getElementById('admin-order-delivery').textContent = `R$ ${(order.total - subtotal).toFixed(2)}`;
        document.getElementById('admin-order-total').textContent = `R$ ${order.total.toFixed(2)}`;
        
        // Preencher endereço e forma de pagamento
        document.getElementById('admin-order-address').textContent = order.address;
        document.getElementById('admin-order-payment').textContent = order.payment_method;
        
        // Preencher observações
        document.getElementById('admin-order-notes').textContent = order.notes || 'Nenhuma observação.';
        
        // Mostrar modal
        const viewOrderModal = new bootstrap.Modal(document.getElementById('viewOrderModal'));
        viewOrderModal.show();
    })
    .catch(error => {
        console.error('Erro ao carregar pedido:', error);
        showToast('Erro ao carregar pedido', 'error');
    });
}

// Atualizar status do pedido
function updateOrderStatus(orderId) {
    // Obter pedido atual
    fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
            'Authorization': `Bearer ${state.token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const order = data.order;
        
        // Preencher formulário
        document.getElementById('update-status-order-id').value = order.id;
        document.getElementById('update-status-current').value = order.status;
        document.getElementById('update-status-new').value = order.status;
        
        // Mostrar modal
        const updateStatusModal = new bootstrap.Modal(document.getElementById('updateStatusModal'));
        updateStatusModal.show();
    })
    .catch(error => {
        console.error('Erro ao carregar pedido:', error);
        showToast('Erro ao carregar pedido', 'error');
    });
}

// Carregar usuários para o painel admin
function loadAdminUsers() {
    const usersTable = document.getElementById('admin-users-table');
    const tbody = usersTable.querySelector('tbody');
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border spinner-border-sm text-success" role="status"><span class="visually-hidden">Carregando...</span></div> Carregando usuários...</td></tr>';
    
    fetch(`${API_URL}/users`, {
        headers: {
            'Authorization': `Bearer ${state.token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao carregar usuários');
        }
        return response.json();
    })
    .then(data => {
        tbody.innerHTML = '';
        
        if (!data.users || data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum usuário encontrado</td></tr>';
            return;
        }
        
        data.users.forEach(user => {
            const tr = document.createElement('tr');
            
            // Formatar data
            const date = new Date(user.created_at);
            const formattedDate = date.toLocaleDateString('pt-BR');
            
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.is_admin ? '<span class="badge bg-primary">Admin</span>' : '<span class="badge bg-secondary">Cliente</span>'}</td>
                <td>${formattedDate}</td>
            `;
            
            tbody.appendChild(tr);
        });
    })
    .catch(error => {
        console.error('Erro ao carregar usuários:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Erro ao carregar usuários. Tente novamente mais tarde.</td></tr>';
    });
}

// Carregar configurações do admin
function loadAdminSettings() {
    // Em uma implementação real, isso carregaria configurações do backend
    // Aqui apenas simulamos algumas configurações
    
    document.getElementById('store-name').value = 'Hortifruti Delivery';
    document.getElementById('store-email').value = 'contato@hortifrutidelivery.com.br';
    document.getElementById('store-phone').value = '(11) 99999-9999';
    document.getElementById('store-address').value = 'Rua das Frutas, 123 - São Paulo/SP';
    document.getElementById('delivery-fee').value = '5.99';
    document.getElementById('min-order-value').value = '20.00';
    document.getElementById('max-delivery-distance').value = '10';
}

// Configurar formulários do admin
function setupAdminForms() {
    // Formulário de novo produto
    const newProductForm = document.getElementById('new-product-form');
    if (newProductForm) {
        newProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('new-product-name').value;
            const description = document.getElementById('new-product-description').value;
            const price = parseFloat(document.getElementById('new-product-price').value);
            const stock = parseInt(document.getElementById('new-product-stock').value);
            const unit = document.getElementById('new-product-unit').value;
            const categoryId = parseInt(document.getElementById('new-product-category').value);
            const featured = document.getElementById('new-product-featured').checked ? 1 : 0;
            const image = document.getElementById('new-product-image').value;
            
            // Em uma implementação real, isso enviaria o formulário com upload de imagem
            // Aqui apenas simulamos o envio
            
            const productData = {
                name,
                description,
                price,
                stock,
                unit,
                category_id: categoryId,
                featured,
                image: image || '/static/images/products/default.jpg'
            };
            
            fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify(productData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao criar produto');
                }
                return response.json();
            })
            .then(data => {
                showToast('Produto criado com sucesso', 'success');
                newProductForm.reset();
                
                // Fechar modal
                const newProductModal = bootstrap.Modal.getInstance(document.getElementById('newProductModal'));
                newProductModal.hide();
                
                // Recarregar produtos
                loadAdminProducts();
            })
            .catch(error => {
                console.error('Erro ao criar produto:', error);
                showToast('Erro ao criar produto', 'error');
            });
        });
    }
    
    // Formulário de edição de produto
    const editProductForm = document.getElementById('edit-product-form');
    if (editProductForm) {
        editProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const id = document.getElementById('edit-product-id').value;
            const name = document.getElementById('edit-product-name').value;
            const description = document.getElementById('edit-product-description').value;
            const price = parseFloat(document.getElementById('edit-product-price').value);
            const stock = parseInt(document.getElementById('edit-product-stock').value);
            const unit = document.getElementById('edit-product-unit').value;
            const categoryId = parseInt(document.getElementById('edit-product-category').value);
            const featured = document.getElementById('edit-product-featured').checked ? 1 : 0;
            const image = document.getElementById('edit-product-image').value;
            
            // Em uma implementação real, isso enviaria o formulário com upload de imagem
            // Aqui apenas simulamos o envio
            
            const productData = {
                name,
                description,
                price,
                stock,
                unit,
                category_id: categoryId,
                featured
            };
            
            // Adicionar imagem apenas se uma nova for fornecida
            if (image) {
                productData.image = image;
            }
            
            fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify(productData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao atualizar produto');
                }
                return response.json();
            })
            .then(data => {
                showToast('Produto atualizado com sucesso', 'success');
                
                // Fechar modal
                const editProductModal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
                editProductModal.hide();
                
                // Recarregar produtos
                loadAdminProducts();
            })
            .catch(error => {
                console.error('Erro ao atualizar produto:', error);
                showToast('Erro ao atualizar produto', 'error');
            });
        });
    }
    
    // Formulário de nova categoria
    const newCategoryForm = document.getElementById('new-category-form');
    if (newCategoryForm) {
        newCategoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('new-category-name').value;
            const description = document.getElementById('new-category-description').value;
            const image = document.getElementById('new-category-image').value;
            
            // Em uma implementação real, isso enviaria o formulário com upload de imagem
            // Aqui apenas simulamos o envio
            
            const categoryData = {
                name,
                description,
                image: image || '/static/images/categories/default.jpg'
            };
            
            fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify(categoryData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao criar categoria');
                }
                return response.json();
            })
            .then(data => {
                showToast('Categoria criada com sucesso', 'success');
                newCategoryForm.reset();
                
                // Fechar modal
                const newCategoryModal = bootstrap.Modal.getInstance(document.getElementById('newCategoryModal'));
                newCategoryModal.hide();
                
                // Recarregar categorias
                loadAdminCategories();
            })
            .catch(error => {
                console.error('Erro ao criar categoria:', error);
                showToast('Erro ao criar categoria', 'error');
            });
        });
    }
    
    // Formulário de edição de categoria
    const editCategoryForm = document.getElementById('edit-category-form');
    if (editCategoryForm) {
        editCategoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const id = document.getElementById('edit-category-id').value;
            const name = document.getElementById('edit-category-name').value;
            const description = document.getElementById('edit-category-description').value;
            const image = document.getElementById('edit-category-image').value;
            
            // Em uma implementação real, isso enviaria o formulário com upload de imagem
            // Aqui apenas simulamos o envio
            
            const categoryData = {
                name,
                description
            };
            
            // Adicionar imagem apenas se uma nova for fornecida
            if (image) {
                categoryData.image = image;
            }
            
            fetch(`${API_URL}/categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify(categoryData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao atualizar categoria');
                }
                return response.json();
            })
            .then(data => {
                showToast('Categoria atualizada com sucesso', 'success');
                
                // Fechar modal
                const editCategoryModal = bootstrap.Modal.getInstance(document.getElementById('editCategoryModal'));
                editCategoryModal.hide();
                
                // Recarregar categorias
                loadAdminCategories();
            })
            .catch(error => {
                console.error('Erro ao atualizar categoria:', error);
                showToast('Erro ao atualizar categoria', 'error');
            });
        });
    }
    
    // Formulário de atualização de status de pedido
    const updateStatusForm = document.getElementById('update-status-form');
    if (updateStatusForm) {
        updateStatusForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const orderId = document.getElementById('update-status-order-id').value;
            const status = document.getElementById('update-status-new').value;
            
            fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ status })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao atualizar status');
                }
                return response.json();
            })
            .then(data => {
                showToast('Status atualizado com sucesso', 'success');
                
                // Fechar modal
                const updateStatusModal = bootstrap.Modal.getInstance(document.getElementById('updateStatusModal'));
                updateStatusModal.hide();
                
                // Recarregar pedidos
                loadAdminOrders();
            })
            .catch(error => {
                console.error('Erro ao atualizar status:', error);
                showToast('Erro ao atualizar status', 'error');
            });
        });
    }
    
    // Formulário de configurações da loja
    const storeSettingsForm = document.getElementById('store-settings-form');
    if (storeSettingsForm) {
        storeSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Em uma implementação real, isso enviaria as configurações para o backend
            // Aqui apenas simulamos o envio
            
            showToast('Configurações salvas com sucesso', 'success');
        });
    }
}

// Exportar funções para uso global
window.adminFunctions = {
    loadAdminDashboardData,
    loadAdminProducts,
    loadAdminCategories,
    loadAdminOrders,
    loadAdminUsers,
    loadAdminSettings
};
