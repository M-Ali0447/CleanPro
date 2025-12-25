document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ CleanPro sayti yuklandi!');
    
    // Initialize language first
    initializeLanguage();
    
    // Then initialize site
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

    document.querySelectorAll('.service-card').forEach(card => {
        card.style.display = 'block';
    });
}

function initializeForms() {
    const mainForm = document.getElementById('main-order-form');
    if (mainForm) {
        mainForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitOrderForm(mainForm);
        });
    }

    const quickForm = document.getElementById('quick-order-form');
    if (quickForm) {
        quickForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitOrderForm(quickForm);
        });
    }

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitReviewForm(reviewForm);
        });
    }
}

async function submitOrderForm(form) {
    console.log('🚀 Buyurtma yuborilmoqda...');

    const formData = new FormData(form);
    const orderData = {
        name: formData.get('name')?.trim(),
        phone: formatPhone(formData.get('phone')?.trim()),
        service_type: formData.get('service')?.trim(),
        date: formData.get('date') || new Date().toISOString().split('T')[0],
        notes: formData.get('note')?.trim() || ''
    };

    console.log('📋 Buyurtma ma\'lumotlari:', orderData);

    if (!orderData.name || !orderData.phone || !orderData.service_type || !orderData.date) {
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
            showNotification('✅ Buyurtma qabul qilindi! Operatorlar tez orada siz bilan bog\'lanadi.', 'success');
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

async function submitReviewForm(form) {
    const formData = new FormData(form);
    const reviewData = {
        user_name: formData.get('name')?.trim(),
        rating: formData.get('rating'),
        review_text: formData.get('review_text')?.trim()
    };
    
    // Validation
    if (!reviewData.user_name || !reviewData.rating || !reviewData.review_text) {
        showNotification('⚠️ Barcha maydonlarni to\'ldiring va reyting bering!', 'error');
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
}

function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length >= 9) {
        return '+998' + cleaned.slice(-9);
    }
    return '+998' + cleaned;
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

// clean.js fayliga qo'shing:

// Barcha fikrlarni yuklash va ko'rsatish
async function loadAllReviews() {
    try {
        showLoading(true);
        const response = await fetch('/api/reviews');
        const result = await response.json();
        
        if (result.success && result.reviews.length > 0) {
            displayAllReviews(result.reviews);
        } else {
            showNotification('⚠️ Hozircha fikrlar yo\'q', 'info');
        }
    } catch (error) {
        console.error('Load all reviews error:', error);
        showNotification('❌ Xatolik yuz berdi!', 'error');
    } finally {
        showLoading(false);
    }
}

// Barcha fikrlarni chiqarish
function displayAllReviews(reviews) {
    // Get current language and translations
    const currentLang = getCurrentLanguage();
    const t = translations[currentLang] || translations['uz_latn'];

    // Modal yaratish
    const modal = document.createElement('div');
    modal.className = 'reviews-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            width: 100%;
            max-width: 800px;
            max-height: 80vh;
            border-radius: 15px;
            padding: 30px;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            position: relative;
        ">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 2px solid #2E8B57;
            ">
                <h2 style="color: #2E8B57; font-size: 24px;">
                    <i class="fas fa-comments"></i> ${t.allReviews} (${reviews.length})
                </h2>
                <button class="close-modal-btn" style="
                    background: #e53e3e;
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div id="allReviewsList" style="display: grid; gap: 20px;">
                ${reviews.map(review => {
                    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    const date = new Date(review.created_at).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'uz-UZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    return `
                        <div style="
                            background: #f8f9fa;
                            border-radius: 10px;
                            padding: 20px;
                            border-left: 4px solid #2E8B57;
                            transition: all 0.3s;
                        ">
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: flex-start;
                                margin-bottom: 15px;
                            ">
                                <div>
                                    <h4 style="color: #333; margin-bottom: 5px; font-size: 18px;">
                                        <i class="fas fa-user" style="color: #2E8B57; margin-right: 10px;"></i>
                                        ${review.user_name}
                                    </h4>
                                    <div style="color: #FFD700; font-size: 20px;">
                                        ${stars}
                                    </div>
                                </div>
                                <div style="color: #666; font-size: 14px;">
                                    <i class="fas fa-calendar" style="margin-right: 5px;"></i>
                                    ${date}
                                </div>
                            </div>
                            <p style="
                                color: #333;
                                line-height: 1.6;
                                font-size: 16px;
                                margin: 0;
                                padding: 15px;
                                background: white;
                                border-radius: 8px;
                                border: 1px solid #e0e0e0;
                            ">
                                <i class="fas fa-quote-left" style="color: #2E8B57; margin-right: 5px;"></i>
                                ${review.review_text}
                                <i class="fas fa-quote-right" style="color: #2E8B57; margin-left: 5px;"></i>
                            </p>
                        </div>
                    `;
                }).join('')}
            </div>

            <div style="
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                text-align: center;
            ">
                <button onclick="document.querySelector('.reviews-modal').remove()" style="
                    background: #2E8B57;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <i class="fas fa-times"></i> ${t.closeButton}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Modalni yopish uchun event listener
    modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.remove());
    
    // Tashqi bosganda yopish
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Fikr qoldirish formasi
function initializeReviewForm() {
    const reviewForm = document.getElementById('review-form');
    if (!reviewForm) return;
    
    // Rating stars
    const stars = reviewForm.querySelectorAll('.rating input');
    const starLabels = reviewForm.querySelectorAll('.rating label');
    
    starLabels.forEach((label, index) => {
        label.addEventListener('mouseenter', () => {
            // Hover effekti
            for (let i = 0; i <= index; i++) {
                starLabels[i].style.color = '#FFD700';
            }
        });
        
        label.addEventListener('mouseleave', () => {
            // Reset effekti
            const checkedStar = reviewForm.querySelector('input[name="rating"]:checked');
            if (checkedStar) {
                const checkedIndex = parseInt(checkedStar.value) - 1;
                starLabels.forEach((l, i) => {
                    l.style.color = i <= checkedIndex ? '#FFD700' : '#ddd';
                });
            } else {
                starLabels.forEach(l => l.style.color = '#ddd');
            }
        });
        
        label.addEventListener('click', () => {
            // Click effekti
            starLabels.forEach((l, i) => {
                l.style.color = i <= index ? '#FFD700' : '#ddd';
            });
        });
    });
}

// DOMContentLoaded funksiyasiga qo'shing:
document.addEventListener('DOMContentLoaded', function() {
    // ... mavjud kod ...
    
    // Fikr formasi
    initializeReviewForm();
    
    // "Barcha fikrlarni ko'rish" tugmasi
    const viewMoreBtn = document.querySelector('.view-more-btn');
    if (viewMoreBtn) {
        viewMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadAllReviews();
        });
    }
});

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

// ========== LANGUAGE FUNCTIONS ==========
function getCurrentLanguage() {
    return localStorage.getItem('language') || 'uz_latn';
}

function setLanguage(lang) {
    localStorage.setItem('language', lang);
    changeLanguage(lang);
}

function initializeLanguage() {
    const currentLang = getCurrentLanguage();
    changeLanguage(currentLang);
    
    // Setup language switcher
    setupLanguageSwitcher();
}

function setupLanguageSwitcher() {
    const langBtn = document.getElementById('langBtn');
    const langOptions = document.getElementById('langOptions');
    
    if (langBtn && langOptions) {
        langBtn.onclick = function(e) {
            e.stopPropagation();
            e.preventDefault();
            const isOpen = langOptions.style.display === 'block' || langOptions.classList.contains('show');
            
            // Close all dropdowns
            document.querySelectorAll('.lang-options').forEach(opt => {
                opt.style.display = 'none';
                opt.classList.remove('show');
            });
            
            // Toggle current
            if (isOpen) {
                langOptions.style.display = 'none';
                langOptions.classList.remove('show');
            } else {
                langOptions.style.display = 'block';
                langOptions.classList.add('show');
            }
        };
        
        // Language option clicks
        document.querySelectorAll('.lang-option').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                const newLang = this.dataset.lang;
                if (newLang) {
                    changeLanguage(newLang);
                    langOptions.style.display = 'none';
                    langOptions.classList.remove('show');
                }
            };
        });
        
        // Close on outside click
        document.addEventListener('click', function(e) {
            if (!langBtn.contains(e.target) && !langOptions.contains(e.target)) {
                langOptions.style.display = 'none';
                langOptions.classList.remove('show');
            }
        });
    }
}

function changeLanguage(lang) {
    if (typeof translations === 'undefined') {
        console.error('translations.js not loaded!');
        return;
    }
    
    const t = translations[lang] || translations['uz_latn'];
    
    // Update language button text
    const langText = document.getElementById('langText');
    if (langText) {
        if (lang === 'uz_latn') langText.textContent = 'UZ';
        else if (lang === 'uz_cyrl') langText.textContent = 'ЎЗ';
        else if (lang === 'ru') langText.textContent = 'RU';
    }
    
    // Mark active language
    document.querySelectorAll('.lang-option').forEach(btn => {
        const checkIcon = btn.querySelector('i.fa-check');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
            if (checkIcon) checkIcon.style.display = 'inline';
        } else {
            btn.classList.remove('active');
            if (checkIcon) checkIcon.style.display = 'none';
        }
    });
    
    // Translate page
    translatePage(t);
}

function translatePage(t) {
    // Перевод всех элементов с атрибутом data-translate-key
    document.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.getAttribute('data-translate-key');
        if (t[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = t[key];
            } else if (el.tagName === 'OPTION') {
                el.textContent = t[key];
            } else if (el.tagName === 'BUTTON') {
                el.textContent = t[key];
            } else {
                el.innerHTML = t[key];
            }
        }
    });

    // Обновляем заголовок страницы
    document.title = 'CleanPro - ' + t.heroTitle.replace(/<[^>]*>/g, '');

    // Переводим placeholder'ы в формах
    const nameInputs = document.querySelectorAll('input[name="name"]');
    nameInputs.forEach(input => input.placeholder = t.yourNamePlaceholder || '👤 ' + t.yourName);

    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => input.placeholder = t.phonePlaceholder || '📞 +998901234567');

    const serviceSelects = document.querySelectorAll('select[name="service"]');
    serviceSelects.forEach(select => {
        if (select.options[0]) select.options[0].textContent = '-- ' + t.selectService + ' --';
    });

    const noteTextareas = document.querySelectorAll('textarea[name="note"]');
    noteTextareas.forEach(textarea => textarea.placeholder = t.notesPlaceholder || '📝 ' + t.additionalNote);

    const reviewTextarea = document.querySelector('textarea[name="review_text"]');
    if (reviewTextarea) reviewTextarea.placeholder = '✍️ ' + t.reviewText;

    const reviewNameInput = document.querySelector('#review-form input[name="name"]');
    if (reviewNameInput) reviewNameInput.placeholder = '👤 ' + t.yourName;
}

// clean.js fayliga qo'shing:

function initializeTestimonialSlider() {
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const indicators = document.querySelectorAll('.indicator');
    
    if (testimonialCards.length === 0) return;
    
    let currentIndex = 0;
    
    // Fikrni ko'rsatish funksiyasi
    function showTestimonial(index) {
        // Barcha fikrlarni yashirish
        testimonialCards.forEach(card => {
            card.classList.remove('active');
        });
        
        // Faqat tanlangan fikrni ko'rsatish
        if (testimonialCards[index]) {
            testimonialCards[index].classList.add('active');
        }
        
        // Indikatorlarni yangilash
        indicators.forEach(indicator => {
            indicator.classList.remove('active');
        });
        
        if (indicators[index]) {
            indicators[index].classList.add('active');
        }
        
        currentIndex = index;
    }
    
    // Keyingi fikrga o'tish
    function nextTestimonial() {
        let nextIndex = currentIndex + 1;
        if (nextIndex >= testimonialCards.length) {
            nextIndex = 0;
        }
        showTestimonial(nextIndex);
    }
    
    // Oldingi fikrga o'tish
    function prevTestimonial() {
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
            prevIndex = testimonialCards.length - 1;
        }
        showTestimonial(prevIndex);
    }
    
    // Tugmalarga hodisalarni qo'shish
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            prevTestimonial();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            nextTestimonial();
        });
    }
    
    // Indikatorlarga hodisalarni qo'shish
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', function(e) {
            e.preventDefault();
            showTestimonial(index);
        });
    });
    
    // Boshlang'ich holatni ko'rsatish
    showTestimonial(0);
}

// DOMContentLoaded funksiyasiga qo'shing:
document.addEventListener('DOMContentLoaded', function() {
    // ... boshqa kodlar ...
    
    // Testimonial slider ni ishga tushirish
    setTimeout(() => {
        initializeTestimonialSlider();
    }, 100);
});