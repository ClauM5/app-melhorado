// Funcionalidades do carrinho de compras para Hortifruti Delivery

// Funções do carrinho já estão implementadas no app.js principal
// Este arquivo serve como complemento para funcionalidades específicas do carrinho

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar eventos específicos do carrinho
    setupCartEvents();
});

// Configurar eventos específicos do carrinho
function setupCartEvents() {
    // Botão para limpar carrinho
    const clearCartButton = document.getElementById('clear-cart');
    if (clearCartButton) {
        clearCartButton.addEventListener('click', () => {
            clearCart();
        });
    }
    
    // Botão para aplicar cupom (simulado)
    const applyCouponButton = document.getElementById('apply-coupon');
    if (applyCouponButton) {
        applyCouponButton.addEventListener('click', () => {
            const couponInput = document.getElementById('coupon-code');
            if (couponInput && couponInput.value) {
                applyCoupon(couponInput.value);
            } else {
                showToast('Digite um código de cupom válido', 'warning');
            }
        });
    }
}

// Limpar carrinho
function clearCart() {
    if (confirm('Tem certeza que deseja limpar o carrinho?')) {
        // Limpar estado do carrinho
        state.cart = [];
        localStorage.setItem('cart', JSON.stringify(state.cart));
        
        // Atualizar UI
        updateCartCount();
        updateCartUI();
        
        showToast('Carrinho limpo com sucesso!', 'success');
    }
}

// Aplicar cupom (simulado)
function applyCoupon(code) {
    // Simulação de cupons
    const validCoupons = {
        'FRUTAS10': {
            discount: 0.1,
            message: '10% de desconto aplicado!'
        },
        'FRETE': {
            discount: 5.99,
            message: 'Frete grátis aplicado!'
        },
        'NOVO20': {
            discount: 0.2,
            message: '20% de desconto para novos clientes!'
        }
    };
    
    const coupon = validCoupons[code.toUpperCase()];
    
    if (coupon) {
        showToast(coupon.message, 'success');
        
        // Em uma implementação real, o desconto seria aplicado ao total
        // Aqui apenas simulamos a mensagem de sucesso
        
        // Limpar campo de cupom
        const couponInput = document.getElementById('coupon-code');
        if (couponInput) {
            couponInput.value = '';
        }
    } else {
        showToast('Cupom inválido ou expirado', 'error');
    }
}

// Calcular frete (simulado)
function calculateShipping(zipcode) {
    // Em uma implementação real, isso faria uma chamada à API
    // para calcular o frete com base no CEP
    
    // Aqui apenas retornamos um valor fixo para simulação
    return 5.99;
}

// Verificar disponibilidade de entrega (simulado)
function checkDeliveryAvailability(zipcode) {
    // Em uma implementação real, isso verificaria se o CEP está
    // dentro da área de entrega
    
    // Aqui apenas simulamos que alguns CEPs não são atendidos
    const unavailableZipcodes = ['00000-000', '11111-111', '22222-222'];
    
    return !unavailableZipcodes.includes(zipcode);
}

// Exportar funções para uso global
window.cartFunctions = {
    clearCart,
    applyCoupon,
    calculateShipping,
    checkDeliveryAvailability
};
