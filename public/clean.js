document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ CleanPro sayti yuklandi!');
    
    initializeCleanSite();
});

function initializeCleanSite() {
    // Mobile menu
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('nav ul');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => navMenu.classList.toggle('show'));
    }
    
    // Forms
    initializeForms();
    
    // Load reviews
    loadPublicReviews();
    
    // Set default dates
    setTodayDate();
    
    // Scroll to top
    initScrollToTop();
    
    // Service buttons
    document.querySelectorAll('.service-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.service-card');
            const serviceName = card.querySelector('h3').textContent;
            
            // Scroll to form
            document.querySelector('.hero').scrollIntoView({ behavior: 'smooth' });
            
            // Auto-select service
            setTimeout(() => {
                const serviceSelect = document.querySelector('#main-order-form select[name="service"]');
                if (serviceSelect) serviceSelect.value = serviceName;
            }, 600);
        });
    });
    
    // Check API connection
    checkAPIConnection();
}

function initializeForms() {
    // Hero order form (bosh sahifadagi asosiy forma)
    const heroForm = document.getElementById('hero-order-form');
    if (heroForm) {
        heroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitOrderForm(heroForm);
        });
    }
    
    // Tezkor buyurtma formasi (aloqa bo'limidagi)
    const quickForm = document.getElementById('main-order-form');
    if (quickForm) {
        quickForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitQuickOrderForm(quickForm);
        });
    }
    
    // Review form
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitReviewForm(reviewForm);
        });
    }
}
// 🔄 BUYURTMA YUBORISH (Asosiy forma)
// 🔄 ASOSIY BUYURTMA
async function submitOrderForm(form) {
    console.log('🚀 Main buyurtma yuborilmoqda...');
    
    const formData = new FormData(form);
    const orderData = {
        name: formData.get('name')?.trim(),
        phone: formData.get('phone')?.trim(), // Avtomatik +998 bor
        service_type: formData.get('service')?.trim(),
        date: formData.get('date'),
        notes: ''
    };
    
    console.log('📋 Yuborilayotgan ma\'lumot:', orderData);

    if (!orderData.name || !orderData.phone || !orderData.service_type || !orderData.date) {
        showNotification('⚠️ Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }

    showLoading(true);
    
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        console.log('📡 Server javobi:', result);
        
        if (result.success) {
            showNotification('✅ Buyurtma qabul qilindi!', 'success');
            form.reset();
            setTodayDate();
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Xatolik:', error);
        showNotification('❌ Server bilan bog\'lanishda xatolik!', 'error');
    } finally {
        showLoading(false);
    }
}

// 🔄 TEZ BUYURTMA
async function submitQuickOrderForm(form) {
    const formData = new FormData(form);
    const orderData = {
        name: formData.get('name')?.trim(),
        phone: formatPhone(formData.get('phone')?.trim()),
        service_type: formData.get('service')?.trim(),
        date: new Date().toISOString().split('T')[0], // Bugungi sana
        notes: formData.get('note')?.trim() || ''
    };
    
    // Validation
    if (!orderData.name || !orderData.phone || !orderData.service_type) {
        showNotification('⚠️ Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }
    
    if (!orderData.phone.match(/^\+998\d{9}$/)) {
        showNotification('☎️ Telefon formati: +998901234567', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Tezkor buyurtma qabul qilindi!', 'success');
            form.reset();
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Quick order error:', error);
        showNotification('❌ Server bilan bog\'lanishda xatolik!', 'error');
    } finally {
        showLoading(false);
    }
}
// 🔄 TEZ BUYURTMA YUBORISH
async function submitQuickOrderForm(form) {
    console.log('🚀 Quick buyurtma yuborilmoqda...');
    
    const formData = new FormData(form);
    const orderData = {
        name: formData.get('name')?.trim(),
        phone: formatPhone(formData.get('phone')?.trim()),
        service_type: formData.get('service')?.trim(),
        date: new Date().toISOString().split('T')[0],
        notes: formData.get('note')?.trim() || ''
    };
    
    console.log('📋 Yuborilayotgan ma\'lumot:', orderData); // Debug

    if (!orderData.name || !orderData.phone || !orderData.service_type) {
        showNotification('⚠️ Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }

    if (!orderData.phone.match(/^\+998\d{9}$/)) {
        showNotification('☎️ Telefon formati: +998901234567', 'error');
        return;
    }

    showLoading(true);
    
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        console.log('📡 Server javobi:', result);
        
        if (result.success) {
            showNotification('✅ Tezkor buyurtma qabul qilindi!', 'success');
            form.reset();
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Xatolik:', error);
        showNotification('❌ Server bilan bog\'lanishda xatolik!', 'error');
    } finally {
        showLoading(false);
    }
}
async function submitOrderForm(form) {
    console.log('🚀 Form yuborilmoqda...'); // Debug
    
    const formData = new FormData(form);
    const orderData = {
        name: formData.get('name')?.trim(),
        phone: formData.get('phone')?.trim(), // formatPhone o'chirildi
        service_type: formData.get('service')?.trim(),
        date: formData.get('date'),
        notes: ''
    };
    
    console.log('📋 Ma\'lumot:', orderData); // Debug

    if (!orderData.name || !orderData.phone || !orderData.service_type || !orderData.date) {
        alert('Barcha maydonlarni to\'ldiring!');
        return;
    }

    if (!orderData.phone.match(/^\+998\d{9}$/)) {
        alert('Telefon: +998901234567 formatida');
        return;
    }
    
    await fetch('/api/orders', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(orderData)
    }).then(r => r.json()).then(data => alert(data.message));
}
    
    // Validation
    if (!reviewData.user_name || !reviewData.rating || !reviewData.review_text) {
        showNotification('⚠️ Barcha maydonlarni to\'ldiring va reyting bering!', 'error');
        return;
    }
    
    if (reviewData.review_text.length < 10) {
        showNotification('✍️ Fikr kamida 10 ta belgidan iborat bo\'lishi kerak!', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Fikringiz uchun rahmat! U tez orada saytga joylanadi.', 'success');
            form.reset();
            loadPublicReviews(); // Reload
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Review error:', error);
        showNotification('❌ Xatolik yuz berdi!', 'error');
    } finally {
        showLoading(false);
    }


// Utility functions
function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    
    // Faqat +9989XXXXXXXX formatda qaytaring
    if (cleaned.length >= 9) {
        return '+998' + cleaned.slice(-9);
    }
    return '+998' + cleaned;
}

async function submitReviewForm(form) {
    console.log('📝 Fikr yuborilmoqda...');
    
    const formData = new FormData(form);
    const reviewData = {
        user_name: formData.get('name')?.trim(),
        rating: formData.get('rating'),
        review_text: formData.get('review_text')?.trim()
    };
    
    console.log('📋 Yuborilayotgan fikr:', reviewData); // Debug uchun

    if (!reviewData.user_name || !reviewData.rating || !reviewData.review_text) {
        showNotification('⚠️ Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }

    if (reviewData.review_text.length < 10) {
        showNotification('✍️ Kamida 10 ta belgi!', 'error');
        return;
    }

    showLoading(true);
    
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        
        const result = await response.json();
        console.log('📡 Server javobi:', result);
        
        if (result.success) {
            showNotification('✅ Fikringiz uchun rahmat!', 'success');
            form.reset();
            loadPublicReviews();
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Xatolik:', error);
        showNotification('❌ Server bilan bog\'lanishda xatolik!', 'error');
    } finally {
        showLoading(false);
    }
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.min = today;
        if (!input.value) input.value = today;
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function showLoading(show) {
    const loader = document.createElement('div');
    loader.id = 'loadingOverlay';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: ${show ? 'flex' : 'none'};
        justify-content: center;
        align-items: center;
        z-index: 9998;
    `;
    loader.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 15px; text-align: center;">
            <div style="width: 60px; height: 60px; border: 6px solid #f3f3f3; border-top: 6px solid #2E8B57; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p style="font-size: 1.2rem; color: #2E8B57; font-weight: 600;">Iltimos kuting...</p>
        </div>
    `;
    
    if (show) {
        document.body.appendChild(loader);
        if (!document.querySelector('#spinStyle')) {
            const style = document.createElement('style');
            style.id = 'spinStyle';
            style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }
    } else {
        const existing = document.getElementById('loadingOverlay');
        if (existing) existing.remove();
    }
}

async function loadPublicReviews() {
    try {
        const response = await fetch('/api/reviews');
        const result = await response.json();
        
        if (result.success && result.reviews.length > 0) {
            displayReviews(result.reviews);
        } else {
            const container = document.getElementById('reviews-container');
            if (container) {
                container.innerHTML = '<p style="text-align:center; color:#999; padding:40px; font-size:1.1rem;">Hozircha fikrlar yo\'q. Birinchi bo\'lib fikr qoldiring!</p>';
            }
        }
    } catch (error) {
        console.error('Load reviews error:', error);
    }
}

function displayReviews(reviews) {
    const container = document.getElementById('reviews-container');
    if (!container) return;
    
    container.innerHTML = reviews.slice(0, 6).map(review => {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const date = new Date(review.created_at).toLocaleDateString('uz-UZ');
        
        return `
            <div class="testimonial-card">
                <div class="testimonial-text">${review.review_text}</div>
                <div class="testimonial-author">
                    <div class="author-avatar"><i class="fas fa-user"></i></div>
                    <div class="author-info">
                        <h4>${review.user_name}</h4>
                        <div class="rating-stars">${stars}</div>
                        <div class="author-email">${date}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function initScrollToTop() {
    const btn = document.getElementById('scrollToTop');
    if (!btn) return;
    
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function checkAPIConnection() {
    fetch('/api/health')
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Serverga ulanish muvaffaqiyatli!');
            } else {
                console.warn('⚠️ Server ishlamayapti:', data.message);
            }
        })
        .catch(error => {
            console.error('❌ Serverga ulanib bo\'lmadi:', error);
            showNotification('❌ Serverga ulanib bo\'lmadi. Serverni tekshiring!', 'error');
        });
}