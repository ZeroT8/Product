// Global variables
let currentUser = null;
let cart = [];
let currentLanguage = 'en';
let currentSlide = 0;
let autoSlideInterval;

// DOM elements
const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const languageSelect = document.getElementById('language-select');
const loginBtn = document.getElementById('login-btn');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const orderHistoryModal = document.getElementById('order-history-modal');
const productsGrid = document.getElementById('products-grid');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const checkoutBtn = document.getElementById('checkout-btn');
const sliderTrack = document.querySelector('.slider-track');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const shopBtn = document.getElementById('shop-btn');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

// Initialize the application
function init() {
    loadUserData();
    loadCart();
    loadTheme();
    loadLanguage();
    renderProducts();
    renderTopSoldProducts();
    updateCartDisplay();
    updateUI();
    startAutoSlide();
    setupNavigation();
}

// Load user data from localStorage
function loadUserData() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
    }
}

// Save user data to localStorage
function saveUserData() {
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
        localStorage.removeItem('currentUser');
    }
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load theme preference
function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        body.classList.add('dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Load language preference
function loadLanguage() {
    const lang = localStorage.getItem('language') || 'en';
    currentLanguage = lang;
    languageSelect.value = lang;
    updateLanguage();
}

// Update language
function updateLanguage() {
    const elements = document.querySelectorAll('[data-lang-key]');
    elements.forEach(element => {
        const key = element.getAttribute('data-lang-key');
        if (translations[currentLanguage][key]) {
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                element.placeholder = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
}

// Render products
function renderProducts(filter = '', category = 'all') {
    productsGrid.innerHTML = '';
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(filter.toLowerCase()) ||
                             product.description.toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = category === 'all' || product.category === category;
        return matchesSearch && matchesCategory;
    });

    filteredProducts.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.style.animationDelay = `${index * 0.1}s`;
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">$${product.price}</p>
                <button class="add-to-cart" data-product-id="${product.id}"><i class="fas fa-cart-plus"></i> Add to Cart</button>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });

    // Add event listeners to add-to-cart buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', addToCart);
    });
}

// Render top sold products slider
function renderTopSoldProducts() {
    if (!sliderTrack) return;

    sliderTrack.innerHTML = '';
    topSoldProducts.forEach(product => {
        const slideItem = document.createElement('div');
        slideItem.className = 'slider-item';
        slideItem.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="item-info">
                <h3>${product.name}</h3>
                <div class="rating">
                    ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
                    <span>(${product.sold} sold)</span>
                </div>
                <p class="price">$${product.price}</p>
                <button data-product-id="${product.id}"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
            </div>
        `;
        sliderTrack.appendChild(slideItem);
    });

    // Add event listeners to slider buttons
    document.querySelectorAll('.slider-item button').forEach(btn => {
        btn.addEventListener('click', addToCart);
    });

    updateSliderButtons();
}

// Update slider button states
function updateSliderButtons() {
    if (!prevBtn || !nextBtn) return;

    const maxSlides = Math.ceil(topSoldProducts.length / 3) - 1;
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === maxSlides;
}

// Move to next slide
function nextSlide() {
    const maxSlides = Math.ceil(topSoldProducts.length / 3) - 1;
    if (currentSlide < maxSlides) {
        currentSlide++;
        updateSlider();
    }
}

// Move to previous slide
function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateSlider();
    }
}

// Update slider position
function updateSlider() {
    const slideWidth = 280; // 260px width + 20px margin
    sliderTrack.style.transform = `translateX(-${currentSlide * slideWidth * 3}px)`;
    updateSliderButtons();
}

// Start auto slide
function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
        const maxSlides = Math.ceil(topSoldProducts.length / 3) - 1;
        currentSlide = (currentSlide + 1) % (maxSlides + 1);
        updateSlider();
    }, 4000); // Change slide every 4 seconds
}

// Stop auto slide
function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

// Add product to cart
function addToCart(event) {
    const productId = parseInt(event.target.getAttribute('data-product-id'));
    const product = products.find(p => p.id === productId);
    if (product) {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart();
        updateCartDisplay();
        showNotification(translations[currentLanguage]['add-to-cart'] + ': ' + product.name);
    }
}

// Update cart display
function updateCartDisplay() {
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
}

// Show cart modal
function showCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    cartItems.innerHTML = '';
    if (cart.length === 0) {
        cartItems.innerHTML = `<p data-lang-key="empty-cart">Your cart is empty</p>`;
    } else {
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <span>${item.name} (x${item.quantity})</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                <button class="remove-from-cart" data-product-id="${item.id}" data-lang-key="remove-from-cart">Remove</button>
            `;
            cartItems.appendChild(itemElement);
        });

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-from-cart').forEach(btn => {
            btn.addEventListener('click', removeFromCart);
        });
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartTotal.textContent = total.toFixed(2);

    cartModal.style.display = 'block';
}

// Remove item from cart
function removeFromCart(event) {
    const productId = parseInt(event.target.getAttribute('data-product-id'));
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartDisplay();
    showCart();
}

// Checkout
function checkout() {
    if (!currentUser) {
        showNotification(translations[currentLanguage]['login']);
        showLogin();
        return;
    }

    if (cart.length === 0) {
        showNotification(translations[currentLanguage]['empty-cart']);
        return;
    }

    // Save order to user's order history
    const order = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: [...cart],
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };

    const orders = JSON.parse(localStorage.getItem(`orders_${currentUser.email}`) || '[]');
    orders.push(order);
    localStorage.setItem(`orders_${currentUser.email}`, JSON.stringify(orders));

    // Clear cart
    cart = [];
    saveCart();
    updateCartDisplay();
    cartModal.style.display = 'none';
    showNotification(translations[currentLanguage]['order-placed']);
}

// Show login modal
function showLogin() {
    loginModal.style.display = 'block';
}

// Show register modal
function showRegister() {
    registerModal.style.display = 'block';
}

// Login
function login(email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = user;
        saveUserData();
        updateUI();
        loginModal.style.display = 'none';
        showNotification(translations[currentLanguage]['login-success']);
    } else {
        showNotification(translations[currentLanguage]['invalid-credentials'], 'error');
    }
}

// Register
function register(name, email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        showNotification(translations[currentLanguage]['user-exists'], 'error');
        return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = newUser;
    saveUserData();
    updateUI();
    registerModal.style.display = 'none';
    showNotification(translations[currentLanguage]['register-success']);
}

// Logout
function logout() {
    currentUser = null;
    saveUserData();
    updateUI();
    showNotification(translations[currentLanguage]['logout-success']);
}

// Update UI based on login status
function updateUI() {
    if (currentUser) {
        loginBtn.textContent = translations[currentLanguage]['logout'];
        loginBtn.setAttribute('data-lang-key', 'logout');
        // Add order history button
        if (!document.getElementById('order-history-btn')) {
            const orderHistoryBtn = document.createElement('button');
            orderHistoryBtn.id = 'order-history-btn';
            orderHistoryBtn.textContent = translations[currentLanguage]['view-order-history'];
            orderHistoryBtn.setAttribute('data-lang-key', 'view-order-history');
            orderHistoryBtn.addEventListener('click', showOrderHistory);
            document.querySelector('.header-actions').insertBefore(orderHistoryBtn, cartBtn);
        }
    } else {
        loginBtn.textContent = translations[currentLanguage]['login'];
        loginBtn.setAttribute('data-lang-key', 'login');
        const orderHistoryBtn = document.getElementById('order-history-btn');
        if (orderHistoryBtn) {
            orderHistoryBtn.remove();
        }
    }
}

// Show order history
function showOrderHistory() {
    const orders = JSON.parse(localStorage.getItem(`orders_${currentUser.email}`) || '[]');
    const orderHistoryContent = document.getElementById('order-history-content');

    orderHistoryContent.innerHTML = '';
    if (orders.length === 0) {
        orderHistoryContent.innerHTML = '<p>No orders found.</p>';
    } else {
        orders.forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            orderElement.innerHTML = `
                <h3>Order #${order.id}</h3>
                <p>Date: ${new Date(order.date).toLocaleDateString()}</p>
                <p>Total: $${order.total.toFixed(2)}</p>
                <ul>
                    ${order.items.map(item => `<li>${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</li>`).join('')}
                </ul>
            `;
            orderHistoryContent.appendChild(orderElement);
        });
    }

    orderHistoryModal.style.display = 'block';
}

// Show notification
function showNotification(message, type = 'success') {
    // Simple notification - in a real app, you'd use a proper notification library
    alert(message);
}

// Event listeners
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    localStorage.setItem('language', currentLanguage);
    updateLanguage();
    updateUI();
});

loginBtn.addEventListener('click', () => {
    if (currentUser) {
        logout();
    } else {
        showLogin();
    }
});

cartBtn.addEventListener('click', showCart);

searchInput.addEventListener('input', () => {
    renderProducts(searchInput.value, categoryFilter.value);
});

categoryFilter.addEventListener('change', () => {
    renderProducts(searchInput.value, categoryFilter.value);
});

// Shop Now button scrolls to products
const shopNowBtn = document.querySelector('[data-lang-key="shop-now"]');
if (shopNowBtn) {
    shopNowBtn.addEventListener('click', () => {
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Highlight products tab if using bottom nav
            const productsTab = document.querySelector('.app-tab[data-target="products"]');
            if (productsTab) {
                productsTab.click();
            }
        }
    });
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (email && password) {
        login(email, password);
        loginForm.reset();
    } else {
        showNotification(translations[currentLanguage]['fill-all-fields'], 'error');
    }
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    if (name && email && password) {
        register(name, email, password);
        registerForm.reset();
    } else {
        showNotification(translations[currentLanguage]['fill-all-fields'], 'error');
    }
});

document.getElementById('register-link').addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'none';
    showRegister();
});

checkoutBtn.addEventListener('click', checkout);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.style.display = 'none';
    }
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (e.target === registerModal) {
        registerModal.style.display = 'none';
    }
    if (e.target === orderHistoryModal) {
        orderHistoryModal.style.display = 'none';
    }
});

// Close modals with close button
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        cartModal.style.display = 'none';
        loginModal.style.display = 'none';
        registerModal.style.display = 'none';
        orderHistoryModal.style.display = 'none';
    });
});

// Slider event listeners
if (prevBtn) prevBtn.addEventListener('click', prevSlide);
if (nextBtn) nextBtn.addEventListener('click', nextSlide);

// Pause auto slide on hover
if (sliderTrack) {
    sliderTrack.addEventListener('mouseenter', stopAutoSlide);
    sliderTrack.addEventListener('mouseleave', startAutoSlide);
}

// Setup navigation for header links and shop button
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    if (shopBtn) {
        shopBtn.addEventListener('click', () => {
            const productsSection = document.getElementById('products');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
}

// Initialize the app
init();