// Funcionalidades do carrinho de compras para Hortifruti Delivery PWA

// Referência ao estado da aplicação do app.js
// Esta separação permite melhor organização do código

// Funções do carrinho
function initCart() {
    // Verificar se há itens no carrinho salvos no localStorage
    loadCartFromStorage();
    
    // Configurar event listeners específicos do carrinho
    setupCartEventListeners();
    
    // Atualizar UI do carrinho
    updateCartUI();
}

// Configurar event listeners específicos do carrinho
function setupCartEventListeners() {
    // Botão de finalizar pedido
    document.getElementById('checkout-btn').addEventListener('click', proceedToCheckout);
    
    // Botão de limpar carrinho (se existir)
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
}

// Proceder para checkout
function proceedToCheckout() {
    if (!appState.user) {
        // Se usuário não estiver logado, mostrar modal de login
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
        showToast('Faça login para continuar com seu pedido', 'warning');
        return;
    }
    
    if (appState.cart.length === 0) {
        showToast('Seu carrinho está vazio', 'warning');
        return;
    }
    
    // Verificar se está offline
    if (appState.isOffline) {
        // Salvar pedido para sincronização posterior
        saveOrderForSync();
        showToast('Você está offline. Seu pedido será enviado quando você estiver online novamente.', 'info');
        return;
    }
    
    // Redirecionar para página de checkout ou mostrar modal de checkout
    showCheckoutModal();
}

// Mostrar modal de checkout
function showCheckoutModal() {
    // Verificar se o modal já existe
    let checkoutModal = document.getElementById('checkoutModal');
    
    if (!checkoutModal) {
        // Criar modal de checkout dinamicamente
        const modalHTML = `
            <div class="modal fade" id="checkoutModal" tabindex="-1" aria-labelledby="checkoutModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title" id="checkoutModalLabel">Finalizar Pedido</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-7">
                                    <h6 class="mb-3">Endereço de Entrega</h6>
                                    <form id="checkout-form">
                                        <div class="mb-3">
                                            <label for="checkout-address" class="form-label">Endereço completo</label>
                                            <input type="text" class="form-control" id="checkout-address" required>
                                        </div>
                                        <div class="row mb-3">
                                            <div class="col-md-6">
                                                <label for="checkout-number" class="form-label">Número</label>
                                                <input type="text" class="form-control" id="checkout-number" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="checkout-complement" class="form-label">Complemento</label>
                                                <input type="text" class="form-control" id="checkout-complement">
                                            </div>
                                        </div>
                                        <div class="row mb-3">
                                            <div class="col-md-6">
                                                <label for="checkout-neighborhood" class="form-label">Bairro</label>
                                                <input type="text" class="form-control" id="checkout-neighborhood" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="checkout-city" class="form-label">Cidade</label>
                                                <input type="text" class="form-control" id="checkout-city" required>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <label for="checkout-payment" class="form-label">Forma de Pagamento</label>
                                            <select class="form-select" id="checkout-payment" required>
                                                <option value="">Selecione...</option>
                                                <option value="money">Dinheiro</option>
                                                <option value="credit">Cartão de Crédito na Entrega</option>
                                                <option value="debit">Cartão de Débito na Entrega</option>
                                                <option value="pix">PIX</option>
                                            </select>
                                        </div>
                                        <div class="mb-3" id="change-container" style="display: none;">
                                            <label for="checkout-change" class="form-label">Troco para</label>
                                            <div class="input-group">
                                                <span class="input-group-text">R$</span>
                                                <input type="number" class="form-control" id="checkout-change" min="0" step="0.01">
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <label for="checkout-notes" class="form-label">Observações</label>
                                            <textarea class="form-control" id="checkout-notes" rows="2"></textarea>
                                        </div>
                                    </form>
                                </div>
                                <div class="col-md-5">
                                    <h6 class="mb-3">Resumo do Pedido</h6>
                                    <div class="card">
                                        <div class="card-body">
                                            <div id="checkout-items">
                                                <!-- Itens do pedido serão inseridos aqui -->
                                            </div>
                                            <hr>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Subtotal:</span>
                                                <span id="checkout-subtotal">R$ 0,00</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Taxa de entrega:</span>
                                                <span id="checkout-delivery">R$ 0,00</span>
                                            </div>
                                            <div class="d-flex justify-content-between fw-bold">
                                                <span>Total:</span>
                                                <span id="checkout-total">R$ 0,00</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-success" id="place-order-btn">Confirmar Pedido</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        checkoutModal = document.getElementById('checkoutModal');
        
        // Configurar event listeners do modal de checkout
        document.getElementById('checkout-payment').addEventListener('change', function(e) {
            const changeContainer = document.getElementById('change-container');
            if (e.target.value === 'money') {
                changeContainer.style.display = 'block';
            } else {
                changeContainer.style.display = 'none';
            }
        });
        
        document.getElementById('place-order-btn').addEventListener('click', placeOrder);
    }
    
    // Preencher dados do resumo do pedido
    updateCheckoutSummary();
    
    // Mostrar modal
    const modal = new bootstrap.Modal(checkoutModal);
    modal.show();
}

// Atualizar resumo do checkout
function updateCheckoutSummary() {
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutSubtotal = document.getElementById('checkout-subtotal');
    const checkoutDelivery = document.getElementById('checkout-delivery');
    const checkoutTotal = document.getElementById('checkout-total');
    
    if (!checkoutItems || !checkoutSubtotal || !checkoutDelivery || !checkoutTotal) return;
    
    // Renderizar itens do pedido
    const itemsHTML = appState.cart.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <span class="fw-bold">${item.quantity}x</span> ${item.product.name}
            </div>
            <div>
                R$ ${formatPrice(item.product.price * item.quantity)}
            </div>
        </div>
    `).join('');
    
    checkoutItems.innerHTML = itemsHTML;
    
    // Calcular valores
    const subtotal = calculateSubtotal();
    const delivery = subtotal > 0 ? 5.99 : 0;
    const total = subtotal + delivery;
    
    // Atualizar valores
    checkoutSubtotal.textContent = `R$ ${formatPrice(subtotal)}`;
    checkoutDelivery.textContent = `R$ ${formatPrice(delivery)}`;
    checkoutTotal.textContent = `R$ ${formatPrice(total)}`;
}

// Finalizar pedido
function placeOrder() {
    // Validar formulário
    const form = document.getElementById('checkout-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Coletar dados do formulário
    const address = document.getElementById('checkout-address').value;
    const number = document.getElementById('checkout-number').value;
    const complement = document.getElementById('checkout-complement').value;
    const neighborhood = document.getElementById('checkout-neighborhood').value;
    const city = document.getElementById('checkout-city').value;
    const paymentMethod = document.getElementById('checkout-payment').value;
    const change = document.getElementById('checkout-change').value;
    const notes = document.getElementById('checkout-notes').value;
    
    // Criar objeto de pedido
    const order = {
        user_id: appState.user.id,
        items: appState.cart.map(item => ({
            product_id: item.product.id,
            quantity: item.quantity,
            price: item.product.price
        })),
        delivery_address: {
            address,
            number,
            complement,
            neighborhood,
            city
        },
        payment: {
            method: paymentMethod,
            change: paymentMethod === 'money' ? parseFloat(change) : null
        },
        notes,
        subtotal: calculateSubtotal(),
        delivery_fee: 5.99,
        total: calculateSubtotal() + 5.99,
        status: 'pending',
        created_at: new Date().toISOString()
    };
    
    // Enviar pedido para o servidor
    submitOrder(order);
}

// Enviar pedido para o servidor
async function submitOrder(order) {
    try {
        // Mostrar loading
        document.getElementById('place-order-btn').disabled = true;
        document.getElementById('place-order-btn').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...';
        
        // Tentar enviar para o servidor
        const response = await fetchWithTimeout(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.user.token}`
            },
            body: JSON.stringify(order)
        });
        
        if (response.ok) {
            // Pedido enviado com sucesso
            orderSuccess(order);
        } else {
            // Simular sucesso para demonstração
            simulateOrderSuccess(order);
        }
    } catch (error) {
        console.error('Erro ao enviar pedido:', error);
        // Simular sucesso para demonstração
        simulateOrderSuccess(order);
    }
}

// Simular sucesso do pedido para demonstração
function simulateOrderSuccess(order) {
    // Gerar número de pedido aleatório
    const orderNumber = Math.floor(100000 + Math.random() * 900000);
    
    // Salvar pedido no localStorage para histórico
    saveOrderToHistory({
        ...order,
        id: orderNumber,
        status: 'pending'
    });
    
    // Limpar carrinho
    clearCart();
    
    // Fechar modal de checkout
    const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
    checkoutModal.hide();
    
    // Mostrar modal de sucesso
    showOrderSuccessModal(orderNumber);
}

// Função para caso de sucesso real
function orderSuccess(orderData) {
    // Salvar pedido no histórico
    saveOrderToHistory(orderData);
    
    // Limpar carrinho
    clearCart();
    
    // Fechar modal de checkout
    const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
    checkoutModal.hide();
    
    // Mostrar modal de sucesso
    showOrderSuccessModal(orderData.id);
}

// Mostrar modal de sucesso do pedido
function showOrderSuccessModal(orderNumber) {
    // Verificar se o modal já existe
    let successModal = document.getElementById('orderSuccessModal');
    
    if (!successModal) {
        // Criar modal de sucesso dinamicamente
        const modalHTML = `
            <div class="modal fade" id="orderSuccessModal" tabindex="-1" aria-labelledby="orderSuccessModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title" id="orderSuccessModalLabel">Pedido Realizado com Sucesso!</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <div class="mb-3">
                                <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
                            </div>
                            <h4>Obrigado pelo seu pedido!</h4>
                            <p class="mb-1">Seu pedido foi recebido e está sendo processado.</p>
                            <p class="mb-3">Número do pedido: <strong id="success-order-number"></strong></p>
                            <p>Você receberá atualizações sobre o status do seu pedido.</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success" data-bs-dismiss="modal">Continuar Comprando</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        successModal = document.getElementById('orderSuccessModal');
    }
    
    // Atualizar número do pedido
    document.getElementById('success-order-number').textContent = orderNumber;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(successModal);
    modal.show();
}

// Salvar pedido no histórico
function saveOrderToHistory(order) {
    try {
        // Obter histórico existente
        let orderHistory = JSON.parse(localStorage.getItem('hortifruti_order_history') || '[]');
        
        // Adicionar novo pedido
        orderHistory.push(order);
        
        // Salvar no localStorage
        localStorage.setItem('hortifruti_order_history', JSON.stringify(orderHistory));
    } catch (error) {
        console.error('Erro ao salvar histórico de pedidos:', error);
    }
}

// Salvar pedido para sincronização posterior (quando offline)
function saveOrderForSync() {
    try {
        // Obter pedidos pendentes
        let pendingOrders = JSON.parse(localStorage.getItem('hortifruti_pending_orders') || '[]');
        
        // Criar objeto de pedido
        const order = {
            user_id: appState.user ? appState.user.id : 'guest',
            items: appState.cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                price: item.product.price
            })),
            subtotal: calculateSubtotal(),
            delivery_fee: 5.99,
            total: calculateSubtotal() + 5.99,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        // Adicionar à lista de pendentes
        pendingOrders.push(order);
        
        // Salvar no localStorage
        localStorage.setItem('hortifruti_pending_orders', JSON.stringify(pendingOrders));
        
        // Registrar para sincronização quando online
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.sync.register('sync-pedidos');
            });
        }
        
        // Limpar carrinho
        clearCart();
        
        // Mostrar confirmação
        showToast('Seu pedido foi salvo e será enviado quando você estiver online novamente.', 'info');
    } catch (error) {
        console.error('Erro ao salvar pedido para sincronização:', error);
    }
}

// Limpar carrinho
function clearCart() {
    appState.cart = [];
    saveCartToStorage();
    updateUI();
}

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', initCart);
