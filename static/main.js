// ============================================================================
// CORE UTILITIES
// ============================================================================

function showLoadingScreen() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoadingScreen() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// ============================================================================
// INITIALIZATION AND EVENT LISTENERS
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeLoadingHandlers();
    initializeDarkMode();
    initializeFormValidation();
    initializeCurrencyFilters();
    initializeYearSelect();
    initializePageSpecificFeatures();
    
    // Clean up any mobile menu artifacts on page load
    cleanupMobileMenuState();
});

// ============================================================================
// LOADING HANDLERS
// ============================================================================

function initializeLoadingHandlers() {
    // Show loading on form submission
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', showLoadingScreen);
    });
    
    // Hide loading on page load
    window.addEventListener('load', hideLoadingScreen);
    
    // Show loading when navigating away
    window.addEventListener('beforeunload', showLoadingScreen);
    
    // Handle page show (back/forward navigation)
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            showLoadingScreen();
            setTimeout(hideLoadingScreen, 100);
        }
    });
}

// ============================================================================
// DARK MODE FUNCTIONALITY
// ============================================================================

function initializeDarkMode() {
    const toggleButton = document.getElementById('toggleDarkMode');
    if (!toggleButton) return;
    
    // Load saved preference
    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
        updateDarkModeIcon(toggleButton, true);
        applyDarkModeToNavigation();
    }
    
    // Toggle functionality
    toggleButton.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('dark-mode', isDarkMode ? 'enabled' : 'disabled');
        updateDarkModeIcon(toggleButton, isDarkMode);
        
        if (isDarkMode) {
            applyDarkModeToNavigation();
        } else {
            removeDarkModeFromNavigation();
        }
    });
    
    // Observe navigation changes for dynamic dark mode application
    observeNavigationChanges();
}

function updateDarkModeIcon(button, isDarkMode) {
    const icon = button.querySelector('i');
    if (!icon) return;
    
    icon.classList.remove('fa-moon', 'fa-sun');
    icon.classList.add(isDarkMode ? 'fa-sun' : 'fa-moon');
}

function applyDarkModeToNavigation() {
    // Apply to navigation bar
    const nav = document.querySelector('nav');
    if (nav) nav.style.backgroundColor = '#2f5a5a';
    
    // Apply to dropdowns
    applyDarkModeToDropdowns();
    
    // Apply to mobile menu
    applyDarkModeToMobileMenu();
    
    // Apply to cards and forms
    applyDarkModeToComponents();
}

function applyDarkModeToDropdowns() {
    const dropdowns = document.querySelectorAll('.group div[class*="absolute"]');
    dropdowns.forEach(dropdown => {
        dropdown.style.backgroundColor = '#2f5a5a';
        dropdown.style.borderColor = '#428a89';
        dropdown.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
        
        dropdown.querySelectorAll('a').forEach(link => {
            link.style.color = '#ccfffe';
            
            link.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#376e6d';
                this.style.color = '#51adac';
            });
            
            link.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
                this.style.color = '#ccfffe';
            });
        });
    });
}

function applyDarkModeToMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (!mobileMenu) return;
    
    mobileMenu.style.backgroundColor = '#2f5a5a';
    mobileMenu.style.borderColor = '#428a89';
    
    const container = mobileMenu.querySelector('.px-2');
    if (container) container.style.backgroundColor = '#2f5a5a';
    
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.style.color = '#ccfffe';
        
        link.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#376e6d';
            this.style.color = '#51adac';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
            this.style.color = '#ccfffe';
        });
    });
    
    // Apply to text elements
    mobileMenu.querySelectorAll('.text-gray-500, .text-gray-700, .text-gray-800').forEach(element => {
        if (element.classList.contains('text-gray-500')) {
            element.style.color = '#99fffc';
        } else if (element.classList.contains('text-gray-700')) {
            element.style.color = '#ccfffe';
        } else if (element.classList.contains('text-gray-800')) {
            element.style.color = '#f0fffe';
        }
    });
    
    // Apply to borders
    mobileMenu.querySelectorAll('.border-gray-200').forEach(border => {
        border.style.borderColor = '#428a89';
    });
}

function applyDarkModeToComponents() {
    // Apply to cards
    const cards = document.querySelectorAll('.metric-card, .gradient-card, .score-card, .bg-white');
    cards.forEach(card => {
        if (!card.classList.contains('fixed')) {
            card.style.background = 'linear-gradient(135deg, #2f5a5a 0%, #376e6d 100%)';
            card.style.borderColor = '#428a89';
            card.style.color = '#ffffff';
        }
    });
    
    // Apply to form elements
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        element.style.backgroundColor = '#376e6d';
        element.style.borderColor = '#428a89';
        element.style.color = '#ffffff';
        
        element.addEventListener('focus', function() {
            this.style.borderColor = '#51adac';
            this.style.boxShadow = '0 0 0 3px rgba(81, 173, 172, 0.3)';
        });
        
        element.addEventListener('blur', function() {
            this.style.borderColor = '#428a89';
            this.style.boxShadow = '';
        });
    });
}

function removeDarkModeFromNavigation() {
    // Reset navigation
    const nav = document.querySelector('nav');
    if (nav) nav.style.backgroundColor = '';
    
    // Reset dropdowns and mobile menu
    const elementsToReset = [
        ...document.querySelectorAll('.group div[class*="absolute"]'),
        document.getElementById('mobile-menu')
    ].filter(Boolean);
    
    elementsToReset.forEach(element => {
        element.style.backgroundColor = '';
        element.style.borderColor = '';
        element.style.boxShadow = '';
        
        element.querySelectorAll('a').forEach(link => {
            link.style.color = '';
            link.style.backgroundColor = '';
        });
        
        element.querySelectorAll('.text-gray-500, .text-gray-700, .text-gray-800').forEach(textEl => {
            textEl.style.color = '';
        });
        
        element.querySelectorAll('.border-gray-200').forEach(border => {
            border.style.borderColor = '';
        });
    });
    
    // Reset cards and forms
    document.querySelectorAll('.metric-card, .gradient-card, .score-card, .bg-white, input, select, textarea').forEach(element => {
        if (!element.classList.contains('fixed')) {
            element.style.background = '';
            element.style.backgroundColor = '';
            element.style.borderColor = '';
            element.style.color = '';
            element.style.boxShadow = '';
        }
    });
}

function observeNavigationChanges() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && document.body.classList.contains('dark-mode')) {
                setTimeout(applyDarkModeToNavigation, 10);
            }
        });
    });
    
    observer.observe(nav, { childList: true, subtree: true });
    
    // Re-apply on dropdown hover
    document.querySelectorAll('.group > button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            if (document.body.classList.contains('dark-mode')) {
                setTimeout(applyDarkModeToNavigation, 10);
            }
        });
    });
    
    // Re-apply on mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            if (document.body.classList.contains('dark-mode')) {
                setTimeout(applyDarkModeToNavigation, 100);
            }
        });
    }
}

// ============================================================================
// FORM VALIDATION AND UTILITIES
// ============================================================================

function initializeFormValidation() {
    // Password visibility toggle
    window.togglePasswordVisibility = function() {
        const passwordInput = document.getElementById("password");
        const toggleIcon = document.getElementById("password-toggle-icon");
        
        if (passwordInput && toggleIcon) {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                toggleIcon.classList.replace("fa-eye", "fa-eye-slash");
            } else {
                passwordInput.type = "password";
                toggleIcon.classList.replace("fa-eye-slash", "fa-eye");
            }
        }
    };
    
    // Password confirmation validation
    window.validatePassword = function() {
        const password = document.getElementById("password")?.value;
        const confirmPassword = document.getElementById("confirm_password")?.value;
        
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return false;
        }
        return true;
    };
    
    // Toggle all password visibility
    window.togglePasswordVisibility_all = function() {
        const passwordInputs = [
            document.getElementById("password"),
            document.getElementById("confirm_password")
        ].filter(Boolean);
        
        passwordInputs.forEach(input => {
            input.type = input.type === "password" ? "text" : "password";
        });
    };
}

// ============================================================================
// CURRENCY AND DROPDOWN FILTERS
// ============================================================================

function initializeCurrencyFilters() {
    const searchInput = document.getElementById('searchInput1');
    const currencySelect = document.getElementById('CurrencySelect1');
    
    if (searchInput && currencySelect) {
        const originalOptions = [...currencySelect.options];
        
        searchInput.addEventListener('input', function() {
            filterOptions(searchInput, currencySelect, originalOptions);
        });
        
        // Set favorite currency if available
        const favoriteCurrency = window.favoriteCurrency || "USD";
        preselectCurrency('CurrencySelect1', favoriteCurrency);
    }
}

function filterOptions(searchInput, currencySelect, originalOptions) {
    const searchText = searchInput.value.toLowerCase();
    currencySelect.innerHTML = '';
    
    const filteredOptions = originalOptions.filter(option => 
        option.textContent.toLowerCase().includes(searchText)
    );
    
    if (filteredOptions.length === 0) {
        const noMatchOption = document.createElement('option');
        noMatchOption.disabled = true;
        noMatchOption.selected = true;
        noMatchOption.textContent = 'No Match';
        currencySelect.appendChild(noMatchOption);
    } else {
        filteredOptions.forEach(option => currencySelect.appendChild(option));
    }
}

function preselectCurrency(selectElementId, favoriteCurrency) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) return;
    
    const options = selectElement.options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === favoriteCurrency) {
            options[i].selected = true;
            break;
        }
    }
}

// ============================================================================
// YEAR SELECT INITIALIZATION
// ============================================================================

function initializeYearSelect() {
    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 50;
    const endYear = currentYear + 50;
    
    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }
}

// ============================================================================
// PAGE-SPECIFIC FEATURES
// ============================================================================

function initializePageSpecificFeatures() {
    const currentPath = window.location.pathname;
    
    // Landing page features
    if (currentPath === '/' || currentPath === '/before_sign') {
        initializeLandingPageFeatures();
    }
    
    // Scores history page
    if (currentPath === '/show_scores_history') {
        initializeScoresHistory();
    }
    
    // Deposit/Income page
    if (currentPath === '/deposit') {
        initializeDepositPage();
    }
    
    // Withdraw/Expense page
    if (currentPath === '/withdraw') {
        initializeWithdrawPage();
    }
    
    // Transaction History page
    if (currentPath === '/show_trans') {
        initializeTransactionHistoryPage();
    }
    
    // Set today's date for date inputs
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function initializeLandingPageFeatures() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Intersection Observer for animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    document.querySelectorAll('.animate-on-scroll, .bg-white.rounded-xl').forEach(el => {
        observer.observe(el);
    });
}

// ============================================================================
// SCORES HISTORY FUNCTIONALITY
// ============================================================================

function initializeScoresHistory() {
    animateScoreCards();
    addScoreCardInteractions();
    addScoresSortingFeature();
    calculatePerformanceMetrics();
    handleMobileResponsiveness();
    addMobileTouchInteractions();
}

function animateScoreCards() {
    const cards = document.querySelectorAll('.score-card, .metric-card, .gradient-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function addScoreCardInteractions() {
    const scoreCards = document.querySelectorAll('.score-card');
    scoreCards.forEach(card => {
        const score = parseFloat(card.getAttribute('data-score')) || 0;
        
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            
            if (score > 0) {
                this.style.boxShadow = '0 25px 50px -12px rgba(34, 197, 94, 0.3)';
            } else if (score < 0) {
                this.style.boxShadow = '0 25px 50px -12px rgba(239, 68, 68, 0.3)';
            } else {
                this.style.boxShadow = '0 25px 50px -12px rgba(234, 179, 8, 0.3)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 15px 25px -5px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // Add loading to pagination links
    document.querySelectorAll('a[href*="page="]').forEach(link => {
        link.addEventListener('click', showLoadingScreen);
    });
}

function addScoresSortingFeature() {
    const scoreCards = document.querySelectorAll('.score-card[data-score]');
    if (scoreCards.length <= 1) return;
    
    const sortContainer = document.querySelector('.flex.items-center.justify-between.mb-6');
    if (!sortContainer) return;
    
    const sortControls = document.createElement('div');
    sortControls.className = 'flex items-center space-x-2 text-sm';
    sortControls.innerHTML = `
        <span class="text-gray-500">Sort by:</span>
        <select id="scoresSort" class="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-imhotep-500 focus:border-imhotep-500">
            <option value="default">Default (Newest)</option>
            <option value="score-high">Score (High to Low)</option>
            <option value="score-low">Score (Low to High)</option>
            <option value="target-high">Target (High to Low)</option>
            <option value="target-low">Target (Low to High)</option>
        </select>
    `;
    
    sortContainer.appendChild(sortControls);
    
    const sortSelect = document.getElementById('scoresSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortScoreCards(this.value);
        });
    }
}

function sortScoreCards(sortBy) {
    const container = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    if (!container) return;
    
    const cards = Array.from(container.querySelectorAll('.score-card[data-score]'));
    
    cards.sort((a, b) => {
        const scoreA = parseFloat(a.getAttribute('data-score')) || 0;
        const scoreB = parseFloat(b.getAttribute('data-score')) || 0;
        
        switch (sortBy) {
            case 'score-high': return scoreB - scoreA;
            case 'score-low': return scoreA - scoreB;
            case 'target-high':
            case 'target-low':
                const targetA = extractTargetFromCard(a);
                const targetB = extractTargetFromCard(b);
                return sortBy === 'target-high' ? targetB - targetA : targetA - targetB;
            default: return 0;
        }
    });
    
    // Animate reordering
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            container.appendChild(card);
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

function extractTargetFromCard(card) {
    const targetElement = card.querySelector('[class*="Target:"]');
    if (targetElement) {
        const targetMatch = targetElement.textContent.match(/[\d,]+/);
        return targetMatch ? parseFloat(targetMatch[0].replace(/,/g, '')) : 0;
    }
    return 0;
}

function calculatePerformanceMetrics() {
    const scoreCards = document.querySelectorAll('.score-card[data-score]');
    if (scoreCards.length === 0) return;
    
    const scores = Array.from(scoreCards).map(card => 
        parseFloat(card.getAttribute('data-score')) || 0
    );
    
    const positiveScores = scores.filter(score => score > 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const headerSection = document.querySelector('.max-w-7xl.mx-auto.px-4.sm\\:px-6.lg\\:px-8.py-8 > .mb-8');
    if (headerSection && scores.length > 3) {
        const performanceSummary = document.createElement('div');
        performanceSummary.className = 'mt-4 grid grid-cols-2 md:grid-cols-4 gap-4';
        performanceSummary.innerHTML = `
            <div class="bg-white rounded-lg p-3 border border-gray-200">
                <div class="text-xs text-gray-500 uppercase tracking-wide">Success Rate</div>
                <div class="text-lg font-bold text-green-600">${Math.round((positiveScores.length / scores.length) * 100)}%</div>
            </div>
            <div class="bg-white rounded-lg p-3 border border-gray-200">
                <div class="text-xs text-gray-500 uppercase tracking-wide">Average Score</div>
                <div class="text-lg font-bold ${averageScore >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${averageScore >= 0 ? '+' : ''}${averageScore.toFixed(0)}
                </div>
            </div>
            <div class="bg-white rounded-lg p-3 border border-gray-200">
                <div class="text-xs text-gray-500 uppercase tracking-wide">Best Month</div>
                <div class="text-lg font-bold text-green-600">+${Math.max(...scores).toFixed(0)}</div>
            </div>
            <div class="bg-white rounded-lg p-3 border border-gray-200">
                <div class="text-xs text-gray-500 uppercase tracking-wide">Total Months</div>
                <div class="text-lg font-bold text-gray-900">${scores.length}</div>
            </div>
        `;
        
        headerSection.appendChild(performanceSummary);
    }
}

function handleMobileResponsiveness() {
    function adjustForMobile() {
        const isMobile = window.innerWidth < 768;
        const scoreCards = document.querySelectorAll('.score-card');
        
        scoreCards.forEach(card => {
            if (isMobile) {
                card.classList.add('mobile-responsive-card');
                card.querySelectorAll('.text-lg, .text-xl').forEach(el => 
                    el.classList.add('mobile-responsive-text')
                );
            } else {
                card.classList.remove('mobile-responsive-card');
                card.querySelectorAll('.text-lg, .text-xl').forEach(el => 
                    el.classList.remove('mobile-responsive-text')
                );
            }
        });
        
        const gridContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
        if (gridContainer) {
            gridContainer.classList.toggle('mobile-responsive-grid', isMobile);
        }
    }
    
    adjustForMobile();
    
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(adjustForMobile, 250);
    });
    
    window.addEventListener('orientationchange', function() {
        setTimeout(adjustForMobile, 300);
    });
}

function addMobileTouchInteractions() {
    const scoreCards = document.querySelectorAll('.score-card');
    
    scoreCards.forEach(card => {
        card.addEventListener('touchstart', function() {
            this.style.transform = 'translateY(-2px) scale(0.98)';
            this.style.transition = 'all 0.1s ease';
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('touchcancel', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.transition = 'all 0.3s ease';
        });
    });
}

// ============================================================================
// MOBILE MENU STATE CLEANUP
// ============================================================================

function cleanupMobileMenuState() {
    const body = document.body;
    body.classList.remove('mobile-menu-open');
    body.style.overflow = '';
    body.style.position = '';
    body.style.top = '';
    
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.style.visibility = 'visible';
    }
}

// ============================================================================
// LEGACY SUPPORT AND UTILITY FUNCTIONS
// ============================================================================

// Auto-hide messages after 5 seconds
setTimeout(function() {
    document.querySelectorAll('.done-message, .error-message').forEach(message => {
        if (message) message.style.display = 'none';
    });
}, 5000);

// Online/Offline status handling
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
    if (!navigator.onLine) {
        document.body.innerHTML = '<h1>You are offline</h1><p>Database connection is unavailable. Please check your internet connection.</p>';
    } else {
        location.reload();
    }
}

// Page navigation cleanup
window.addEventListener('beforeunload', cleanupMobileMenuState);
window.addEventListener('pageshow', cleanupMobileMenuState);
window.addEventListener('popstate', cleanupMobileMenuState);

// Touch events for better mobile interaction
const touchElements = document.querySelectorAll('button, a, .cursor-pointer');
touchElements.forEach(element => {
    element.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.95)';
    });
    
    element.addEventListener('touchend', function() {
        this.style.transform = '';
    });
    
    element.addEventListener('touchcancel', function() {
        this.style.transform = '';
    });
});

// Focus handling for accessibility
document.addEventListener('focusin', function(e) {
    if (e.target.matches('input, textarea, select')) {
        e.target.style.outline = '2px solid #51adac';
    }
});

document.addEventListener('focusout', function(e) {
    if (e.target.matches('input, textarea, select')) {
        e.target.style.outline = '';
    }
});

// Ensure viewport meta tag exists for mobile
if (!document.querySelector('meta[name="viewport"]')) {
    const metaViewport = document.createElement('meta');
    metaViewport.name = 'viewport';
    metaViewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
    document.head.appendChild(metaViewport);
}

// ============================================================================
// WITHDRAW PAGE FUNCTIONALITY
// ============================================================================

function initializeWithdrawPage() {
    // Add form animations
    animateFormElements();
    
    // Add amount input formatting
    setupAmountInput();
    
    // Add quick expense buttons
    addQuickExpenseButtons();
    
    // Add expense category suggestions
    addExpenseCategorySuggestions();
    
    // Add balance validation
    setupBalanceValidation();
}

function addQuickExpenseButtons() {
    const amountInput = document.querySelector('input[name="amount"]');
    if (!amountInput) return;
    
    // Create quick amount buttons container for common expenses
    const quickAmountContainer = document.createElement('div');
    quickAmountContainer.className = 'flex flex-wrap gap-2 mt-2';
    quickAmountContainer.innerHTML = `
        <button type="button" class="quick-amount-btn px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors" data-amount="5">+5</button>
        <button type="button" class="quick-amount-btn px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors" data-amount="10">+10</button>
        <button type="button" class="quick-amount-btn px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors" data-amount="25">+25</button>
        <button type="button" class="quick-amount-btn px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors" data-amount="50">+50</button>
        <button type="button" class="quick-amount-btn px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-lg transition-colors" onclick="document.querySelector('input[name=\\'amount\\']').value = ''">Clear</button>
    `;
    
    // Insert after amount input
    const amountContainer = amountInput.closest('.space-y-2');
    if (amountContainer) {
        amountContainer.appendChild(quickAmountContainer);
        
        // Add click handlers
        quickAmountContainer.querySelectorAll('.quick-amount-btn[data-amount]').forEach(btn => {
            btn.addEventListener('click', function() {
                const amount = parseFloat(this.dataset.amount);
                const currentAmount = parseFloat(amountInput.value) || 0;
                amountInput.value = (currentAmount + amount).toFixed(2);
                amountInput.dispatchEvent(new Event('input'));
                amountInput.dispatchEvent(new Event('blur'));
            });
        });
    }
}

function addExpenseCategorySuggestions() {
    const descriptionInput = document.querySelector('textarea[name="trans_details"]');
    if (!descriptionInput) return;
    
    const categories = [
        'Groceries', 'Transportation', 'Entertainment', 'Dining Out', 'Utilities',
        'Rent/Mortgage', 'Insurance', 'Healthcare', 'Shopping', 'Gas/Fuel',
        'Internet/Phone', 'Gym/Fitness', 'Subscriptions', 'Education', 'Travel'
    ];
    
    // Create suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'flex flex-wrap gap-2 mt-2';
    suggestionsContainer.innerHTML = categories.map(category => 
        `<button type="button" class="category-btn px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm rounded-lg transition-colors" data-category="${category}">${category}</button>`
    ).join('');
    
    // Insert after description input
    const descriptionContainer = descriptionInput.closest('.space-y-2');
    if (descriptionContainer) {
        descriptionContainer.appendChild(suggestionsContainer);
        
        // Add click handlers
        suggestionsContainer.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                descriptionInput.value = this.dataset.category;
                descriptionInput.focus();
                
                // Highlight selected category
                suggestionsContainer.querySelectorAll('.category-btn').forEach(b => {
                    b.classList.remove('bg-blue-500', 'text-white');
                    b.classList.add('bg-blue-100', 'text-blue-700');
                });
                this.classList.remove('bg-blue-100', 'text-blue-700');
                this.classList.add('bg-blue-500', 'text-white');
            });
        });
    }
}

function setupBalanceValidation() {
    const amountInput = document.querySelector('input[name="amount"]');
    const currencySelect = document.querySelector('select[name="currency"]');
    
    if (!amountInput || !currencySelect) return;
    
    function validateBalance() {
        const amount = parseFloat(amountInput.value);
        const selectedCurrency = currencySelect.value;
        
        if (amount && selectedCurrency) {
            const selectedOption = currencySelect.options[currencySelect.selectedIndex];
            if (selectedOption.text.includes(' - ')) {
                const balanceText = selectedOption.text.split(' - ')[1].replace(' Available', '');
                const availableBalance = parseFloat(balanceText);
                
                if (amount > availableBalance) {
                    amountInput.classList.add('border-red-400');
                    amountInput.classList.remove('border-green-400');
                    
                    // Show warning message
                    showBalanceWarning('Amount exceeds available balance');
                } else {
                    amountInput.classList.remove('border-red-400');
                    amountInput.classList.add('border-green-400');
                    hideBalanceWarning();
                }
            }
        }
    }
    
    function showBalanceWarning(message) {
        let warningDiv = document.getElementById('balance-warning');
        if (!warningDiv) {
            warningDiv = document.createElement('div');
            warningDiv.id = 'balance-warning';
            warningDiv.className = 'mt-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2';
            warningDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>${message}</span>`;
            amountInput.parentNode.appendChild(warningDiv);
        }
    }
    
    function hideBalanceWarning() {
        const warningDiv = document.getElementById('balance-warning');
        if (warningDiv) {
            warningDiv.remove();
        }
    }
    
    amountInput.addEventListener('input', validateBalance);
    currencySelect.addEventListener('change', validateBalance);
}

// ============================================================================
// TRANSACTION HISTORY PAGE FUNCTIONALITY
// ============================================================================

function initializeTransactionHistoryPage() {
    // Animate elements on load
    animateTransactionElements();
    
    // Initialize responsive table handling
    handleResponsiveTable();
    
    // Initialize advanced filtering
    initializeAdvancedFiltering();
    
    // Initialize bulk actions
    initializeBulkActions();
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
}

function animateTransactionElements() {
    const cards = document.querySelectorAll('.metric-card, .bg-white');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Animate transaction rows/cards with staggered effect
    const transactions = document.querySelectorAll('.transaction-row, .transaction-card');
    transactions.forEach((transaction, index) => {
        transaction.style.opacity = '0';
        transaction.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            transaction.style.transition = 'all 0.4s ease';
            transaction.style.opacity = '1';
            transaction.style.transform = 'translateY(0)';
        }, 300 + (index * 30)); // Faster stagger for many items
    });
}

function handleResponsiveTable() {
    function adjustForMobile() {
        const isMobile = window.innerWidth < 768;
        const desktopTable = document.querySelector('.desktop-table');
        const mobileCards = document.querySelector('.mobile-card');
        
        if (desktopTable && mobileCards) {
            if (isMobile) {
                desktopTable.style.display = 'none';
                mobileCards.style.display = 'block';
            } else {
                desktopTable.style.display = 'block';
                mobileCards.style.display = 'none';
            }
        }
    }
    
    // Initial check
    adjustForMobile();
    
    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(adjustForMobile, 250);
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(adjustForMobile, 300);
    });
}

function initializeAdvancedFiltering() {
    // Add currency filter
    addCurrencyFilter();
    
    // Add amount range filter
    addAmountRangeFilter();
    
    // Enhanced search with debouncing
    enhanceSearchFunctionality();
}

function addCurrencyFilter() {
    const transactions = document.querySelectorAll('.transaction-row, .transaction-card');
    const currencies = new Set();
    
    transactions.forEach(transaction => {
        const currencyCell = transaction.querySelector('td:nth-child(4)');
        if (currencyCell) {
            currencies.add(currencyCell.textContent.trim());
        } else {
            // For mobile cards, extract currency from amount text
            const amountText = transaction.querySelector('.text-lg')?.textContent;
            if (amountText) {
                const currency = amountText.match(/[A-Z]{3}$/);
                if (currency) currencies.add(currency[0]);
            }
        }
    });
    
    if (currencies.size > 1) {
        // Add currency filter to filter section
        const filterGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3.lg\\:grid-cols-5');
        if (filterGrid) {
            const currencyFilter = document.createElement('div');
            currencyFilter.className = 'space-y-1';
            currencyFilter.innerHTML = `
                <label class="block text-sm font-medium text-gray-700">Currency</label>
                <select id="currencyFilter" class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-gray-900 text-sm">
                    <option value="">All Currencies</option>
                    ${Array.from(currencies).map(currency => `<option value="${currency}">${currency}</option>`).join('')}
                </select>
            `;
            
            // Insert after search field
            const searchField = filterGrid.children[3];
            filterGrid.insertBefore(currencyFilter, searchField.nextSibling);
            
            // Add event listener
            document.getElementById('currencyFilter').addEventListener('change', applyAllFilters);
        }
    }
}

function addAmountRangeFilter() {
    // Add amount range inputs to advanced filters
    const filtersSection = document.querySelector('.p-6');
    if (filtersSection) {
        const advancedFilters = document.createElement('div');
        advancedFilters.className = 'mt-4 pt-4 border-t border-gray-200';
        advancedFilters.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-medium text-gray-700">Advanced Filters</h4>
                <button type="button" id="toggleAdvanced" class="text-indigo-600 hover:text-indigo-800 text-sm">
                    <i class="fas fa-chevron-down mr-1"></i>Show
                </button>
            </div>
            <div id="advancedFiltersContent" class="hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                    <label class="block text-sm font-medium text-gray-700">Min Amount</label>
                    <input type="number" id="minAmount" step="0.01" placeholder="0.00" 
                           class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-gray-900 text-sm">
                </div>
                <div class="space-y-1">
                    <label class="block text-sm font-medium text-gray-700">Max Amount</label>
                    <input type="number" id="maxAmount" step="0.01" placeholder="999999.99"
                           class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-gray-900 text-sm">
                </div>
            </div>
        `;
        
        filtersSection.appendChild(advancedFilters);
        
        // Toggle advanced filters
        document.getElementById('toggleAdvanced').addEventListener('click', function() {
            const content = document.getElementById('advancedFiltersContent');
            const isHidden = content.classList.contains('hidden');
            
            content.classList.toggle('hidden');
            this.innerHTML = isHidden 
                ? '<i class="fas fa-chevron-up mr-1"></i>Hide'
                : '<i class="fas fa-chevron-down mr-1"></i>Show';
        });
        
        // Add event listeners for amount filters
        document.getElementById('minAmount').addEventListener('input', debounce(applyAllFilters, 300));
        document.getElementById('maxAmount').addEventListener('input', debounce(applyAllFilters, 300));
    }
}

function enhanceSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Remove existing event listeners and add debounced version
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        newSearchInput.addEventListener('input', debounce(applyAllFilters, 300));
        
        // Add search suggestions
        addSearchSuggestions(newSearchInput);
    }
}

function addSearchSuggestions(searchInput) {
    const transactions = document.querySelectorAll('.transaction-row, .transaction-card');
    const descriptions = new Set();
    
    transactions.forEach(transaction => {
        const description = transaction.dataset.description;
        if (description && description.trim()) {
            descriptions.add(description.trim());
        }
    });
    
    // Create datalist for search suggestions
    const datalist = document.createElement('datalist');
    datalist.id = 'searchSuggestions';
    descriptions.forEach(desc => {
        const option = document.createElement('option');
        option.value = desc;
        datalist.appendChild(option);
    });
    
    document.body.appendChild(datalist);
    searchInput.setAttribute('list', 'searchSuggestions');
}

function applyAllFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const typeFilter = document.querySelector('select[name="trans_type"]')?.value || '';
    const currencyFilter = document.getElementById('currencyFilter')?.value || '';
    const minAmount = parseFloat(document.getElementById('minAmount')?.value) || 0;
    const maxAmount = parseFloat(document.getElementById('maxAmount')?.value) || Infinity;
    
    const transactions = document.querySelectorAll('.transaction-row, .transaction-card');
    let visibleCount = 0;
    
    transactions.forEach(transaction => {
        const description = transaction.dataset.description.toLowerCase();
        const type = transaction.dataset.type;
        const amount = parseFloat(transaction.dataset.amount);
        
        // Get currency for this transaction
        let currency = '';
        if (transaction.classList.contains('transaction-row')) {
            currency = transaction.querySelector('td:nth-child(4)')?.textContent.trim() || '';
        } else {
            const amountText = transaction.querySelector('.text-lg')?.textContent;
            const currencyMatch = amountText?.match(/[A-Z]{3}$/);
            currency = currencyMatch ? currencyMatch[0] : '';
        }
        
        const matchesSearch = description.includes(searchTerm);
        const matchesType = !typeFilter || type === typeFilter;
        const matchesCurrency = !currencyFilter || currency === currencyFilter;
        const matchesAmount = amount >= minAmount && amount <= maxAmount;
        
        const isVisible = matchesSearch && matchesType && matchesCurrency && matchesAmount;
        
        if (transaction.classList.contains('transaction-row')) {
            transaction.style.display = isVisible ? '' : 'none';
        } else {
            transaction.style.display = isVisible ? 'block' : 'none';
        }
        
        if (isVisible) visibleCount++;
    });
    
    // Update stats for visible transactions
    calculateVisibleTransactionStats();
    
    // Show/hide empty state
    updateEmptyState(visibleCount);
}

function updateEmptyState(visibleCount) {
    let emptyState = document.getElementById('filterEmptyState');
    
    if (visibleCount === 0) {
        if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.id = 'filterEmptyState';
            emptyState.className = 'p-8 text-center border-t border-gray-200';
            emptyState.innerHTML = `
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-search text-gray-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">No transactions match your filters</h3>
                <p class="text-gray-600 mb-4">Try adjusting your search criteria or clearing some filters.</p>
                <button onclick="clearAllFilters()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Clear All Filters
                </button>
            `;
            
            const tableContainer = document.querySelector('.bg-white.rounded-2xl.shadow-lg');
            if (tableContainer) {
                tableContainer.appendChild(emptyState);
            }
        }
        emptyState.style.display = 'block';
    } else if (emptyState) {
        emptyState.style.display = 'none';
    }
}

function clearAllFilters() {
    // Clear all filter inputs
    document.getElementById('searchInput').value = '';
    const typeFilter = document.querySelector('select[name="trans_type"]');
    if (typeFilter) typeFilter.value = '';
    const currencyFilter = document.getElementById('currencyFilter');
    if (currencyFilter) currencyFilter.value = '';
    const minAmount = document.getElementById('minAmount');
    if (minAmount) minAmount.value = '';
    const maxAmount = document.getElementById('maxAmount');
    if (maxAmount) maxAmount.value = '';
    
    // Reapply filters (which will show all transactions)
    applyAllFilters();
}

function initializeBulkActions() {
    // Add select all functionality for bulk operations
    const tableHeader = document.querySelector('thead tr');
    if (tableHeader) {
        const selectAllTh = document.createElement('th');
        selectAllTh.className = 'px-6 py-4 text-left';
        selectAllTh.innerHTML = `
            <input type="checkbox" id="selectAll" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
        `;
        tableHeader.insertBefore(selectAllTh, tableHeader.firstChild);
        
        // Add checkboxes to each row
        const rows = document.querySelectorAll('.transaction-row');
        rows.forEach(row => {
            const selectTd = document.createElement('td');
            selectTd.className = 'px-6 py-4';
            selectTd.innerHTML = `
                <input type="checkbox" class="transaction-checkbox rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" value="${row.querySelector('input[name="trans_key"]')?.value || ''}">
            `;
            row.insertBefore(selectTd, row.firstChild);
        });
        
        // Add bulk actions bar
        addBulkActionsBar();
        
        // Handle select all
        document.getElementById('selectAll').addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.transaction-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateBulkActionsBar();
        });
        
        // Handle individual checkboxes
        document.querySelectorAll('.transaction-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateBulkActionsBar);
        });
    }
}

function addBulkActionsBar() {
    const bulkBar = document.createElement('div');
    bulkBar.id = 'bulkActionsBar';
    bulkBar.className = 'hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-xl rounded-lg border border-gray-200 px-6 py-3 z-50';
    bulkBar.innerHTML = `
        <div class="flex items-center space-x-4">
            <span id="selectedCount" class="text-sm text-gray-600">0 selected</span>
            <button onclick="bulkDelete()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                <i class="fas fa-trash mr-1"></i>Delete Selected
            </button>
            <button onclick="clearSelection()" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
                Clear
            </button>
        </div>
    `;
    document.body.appendChild(bulkBar);
}

function updateBulkActionsBar() {
    const selectedCheckboxes = document.querySelectorAll('.transaction-checkbox:checked');
    const bulkBar = document.getElementById('bulkActionsBar');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedCheckboxes.length > 0) {
        bulkBar.classList.remove('hidden');
        selectedCount.textContent = `${selectedCheckboxes.length} selected`;
    } else {
        bulkBar.classList.add('hidden');
    }
}

function clearSelection() {
    document.querySelectorAll('.transaction-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('selectAll').checked = false;
    updateBulkActionsBar();
}

function bulkDelete() {
    const selectedCheckboxes = document.querySelectorAll('.transaction-checkbox:checked');
    if (selectedCheckboxes.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedCheckboxes.length} transaction(s)?`)) {
        // Here you would implement the bulk delete functionality
        // For now, just show a message
        alert('Bulk delete functionality would be implemented here');
    }
}

function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Only if not typing in an input
        if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
            return;
        }
        
        switch (e.key) {
            case '/':
                e.preventDefault();
                document.getElementById('searchInput')?.focus();
                break;
            case 'n':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    window.location.href = '/deposit';
                }
                break;
            case 'e':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    window.location.href = '/withdraw';
                }
                break;
            case 'Escape':
                clearAllFilters();
                break;
        }
    });
    
    // Add keyboard shortcut hints
    addKeyboardShortcutHints();
}

function addKeyboardShortcutHints() {
    const hintsContainer = document.createElement('div');
    hintsContainer.className = 'fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 text-xs text-gray-600 border border-gray-200 z-40';
    hintsContainer.innerHTML = `
        <div class="font-medium mb-2">Keyboard Shortcuts:</div>
        <div>/ - Focus search</div>
        <div>Ctrl+N - Add income</div>
        <div>Ctrl+E - Add expense</div>
        <div>Esc - Clear filters</div>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hintsContainer.style.opacity = '0.3';
    }, 5000);
    
    document.body.appendChild(hintsContainer);
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
