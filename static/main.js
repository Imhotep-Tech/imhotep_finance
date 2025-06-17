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
    initializePageSpecificFeatures();
    
    // Clean up any mobile menu artifacts on page load
    cleanupMobileMenuState();
});

// ============================================================================
// LOADING HANDLERS
// ============================================================================

function initializeLoadingHandlers() {
    // Show loading on form submission (but exclude year filter forms)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Skip year filter forms to avoid conflicts
        if (form.action.includes('filter_year_wishlist') || 
            form.action.includes('filter_year') ||
            form.querySelector('select[name="year"]')) {
            return; // Skip this form
        }
        
        form.addEventListener('submit', showLoadingScreen);
    });
    
    // Handle export links separately
    initializeExportHandlers();
    
    // Hide loading on page load
    window.addEventListener('load', hideLoadingScreen);
    
    // Show loading when navigating away (but not for downloads)
    window.addEventListener('beforeunload', function(event) {
        // Don't show loading if it's a download request
        if (!event.target.activeElement || !event.target.activeElement.href || !event.target.activeElement.href.includes('export_trans')) {
            showLoadingScreen();
        }
    });
    
    // Handle page show (back/forward navigation)
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            showLoadingScreen();
            setTimeout(hideLoadingScreen, 100);
        }
    });
}

function initializeExportHandlers() {
    // Handle export links with special download detection
    const exportLinks = document.querySelectorAll('a[href*="export_trans"]');
    
    exportLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            showLoadingScreen();
            
            // Create a hidden iframe to handle the download
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = this.href;
            document.body.appendChild(iframe);
            
            // Prevent default navigation
            e.preventDefault();
            
            // Hide loading after a short delay (download should start immediately)
            setTimeout(() => {
                hideLoadingScreen();
                // Remove the iframe after download
                document.body.removeChild(iframe);
            }, 2000); // 2 seconds should be enough for the download to start
            
            // Alternative method: Use fetch to detect when response is received
            fetch(this.href)
                .then(response => {
                    if (response.ok) {
                        return response.blob();
                    }
                    throw new Error('Download failed');
                })
                .then(blob => {
                    // Create download link
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = getFilenameFromUrl(this.href);
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    // Hide loading screen
                    hideLoadingScreen();
                })
                .catch(error => {
                    console.error('Export failed:', error);
                    hideLoadingScreen();
                    // You could show an error message here
                    alert('Export failed. Please try again.');
                });
        });
    });
}

function getFilenameFromUrl(url) {
    // Extract filename from URL parameters or create a default one
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const fromDate = urlParams.get('from_date') || 'all';
    const toDate = urlParams.get('to_date') || 'all';
    return `transactions_${fromDate}_to_${toDate}.csv`;
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
    const cards = document.querySelectorAll('.metric-card, .gradient-card, .score-card, .currency-card, .bg-white');
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
    document.querySelectorAll('.metric-card, .gradient-card, .score-card, .currency-card, .bg-white, input, select, textarea').forEach(element => {
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
    
    // Trash page
    if (currentPath === '/trash_trans') {
        initializeTrashPage();
    }
    
    // Wishlist page
    if (currentPath.includes('wishlist') || currentPath.includes('filter_year_wishlist')) {
        initializeWishlistPage();
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
// DEPOSIT PAGE FUNCTIONALITY
// ============================================================================

function initializeDepositPage() {
    // Add form animations
    animateFormElements();
    
    // Add income category suggestions
    addIncomeCategorySuggestions();
}

function animateFormElements() {
    const formElements = document.querySelectorAll('.space-y-2, .bg-white');
    formElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function addIncomeCategorySuggestions() {
    const descriptionInput = document.querySelector('textarea[name="category"]');
    if (!descriptionInput) return;
    
    // Check if suggestions already exist to prevent duplicates
    if (descriptionInput.closest('.space-y-2').querySelector('.category-suggestions')) {
        return;
    }
    
    // Get user categories from template data
    const userCategoriesElement = document.getElementById('user-categories-data');
    let userCategories = [];
    
    if (userCategoriesElement && userCategoriesElement.textContent.trim()) {
        try {
            userCategories = JSON.parse(userCategoriesElement.textContent);
        } catch (e) {
            userCategories = [];
        }
    }
    
    // Default income categories as fallback
    const defaultCategories = [
        'Salary', 'Freelance', 'Business Income', 'Investment Returns', 'Rental Income',
        'Side Hustle', 'Bonus', 'Commission', 'Dividend', 'Interest',
        'Gift/Donation', 'Tax Refund', 'Insurance Claim', 'Other Income'
    ];
    
    // Use user categories first, then fill with defaults if needed
    const categories = [...userCategories];
    defaultCategories.forEach(cat => {
        if (!categories.includes(cat) && categories.length < 15) {
            categories.push(cat);
        }
    });
    
    addCategorySuggestions(descriptionInput, categories, 'income');
}

function addCategorySuggestions(descriptionInput, categories, type) {
    const colorClasses = type === 'income' 
        ? { bg: 'bg-green-100', hover: 'hover:bg-green-200', text: 'text-green-700', selected: 'bg-green-500', selectedText: 'text-white' }
        : { bg: 'bg-blue-100', hover: 'hover:bg-blue-200', text: 'text-blue-700', selected: 'bg-blue-500', selectedText: 'text-white' };
    
    // Create suggestions container with unique class to prevent duplicates
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'category-suggestions flex flex-wrap gap-2 mt-2';
    suggestionsContainer.innerHTML = categories.map(category => 
        `<button type="button" class="category-btn px-3 py-1 ${colorClasses.bg} ${colorClasses.hover} ${colorClasses.text} text-sm rounded-lg transition-colors" data-category="${category}">${category}</button>`
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
                    b.classList.remove(colorClasses.selected, colorClasses.selectedText);
                    b.classList.add(colorClasses.bg, colorClasses.text);
                });
                this.classList.remove(colorClasses.bg, colorClasses.text);
                this.classList.add(colorClasses.selected, colorClasses.selectedText);
            });
        });
    }
}

// ============================================================================
// WITHDRAW PAGE FUNCTIONALITY
// ============================================================================

function initializeWithdrawPage() {
    // Add form animations
    animateFormElements();
    
    // Add expense category suggestions
    addExpenseCategorySuggestions();
    
    // Add balance validation
    setupBalanceValidation();
}

function animateFormElements() {
    const formElements = document.querySelectorAll('.space-y-2, .bg-white');
    formElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function addExpenseCategorySuggestions() {
    const descriptionInput = document.querySelector('textarea[name="category"]');
    if (!descriptionInput) return;
    
    // Check if suggestions already exist to prevent duplicates
    if (descriptionInput.closest('.space-y-2').querySelector('.category-suggestions')) {
        return;
    }
    
    // Get user categories from template data
    const userCategoriesElement = document.getElementById('user-categories-data');
    let userCategories = [];
    
    if (userCategoriesElement && userCategoriesElement.textContent.trim()) {
        try {
            userCategories = JSON.parse(userCategoriesElement.textContent);
        } catch (e) {
            userCategories = [];
        }
    }
    
    // Default expense categories as fallback
    const defaultCategories = [
        'Groceries', 'Transportation', 'Entertainment', 'Dining Out', 'Utilities',
        'Rent/Mortgage', 'Insurance', 'Healthcare', 'Shopping', 'Gas/Fuel',
        'Internet/Phone', 'Gym/Fitness', 'Subscriptions', 'Education', 'Travel'
    ];
    
    // Use user categories first, then fill with defaults if needed
    const categories = [...userCategories];
    defaultCategories.forEach(cat => {
        if (!categories.includes(cat) && categories.length < 15) {
            categories.push(cat);
        }
    });
    
    addCategorySuggestions(descriptionInput, categories, 'expense');
}

function setupBalanceValidation() {
    const amountInput = document.querySelector('input[name="amount"]');
    const currencySelect = document.querySelector('select[name="currency"]');
    
    if (!amountInput || !currencySelect) return;
    
    // Add real-time balance checking (NO formatting to preserve natural input)
    function checkBalance() {
        const amount = parseFloat(amountInput.value) || 0;
        const currency = currencySelect.value;
        
        if (amount > 0 && currency) {
            // Just visual feedback, no input manipulation
            amountInput.style.borderColor = amount > 0 ? '#10b981' : '#ef4444';
        }
    }
    
    currencySelect.addEventListener('change', checkBalance);
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
}

function animateTransactionElements() {
    const rows = document.querySelectorAll('.transaction-row, .transaction-card');
    rows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            row.style.transition = 'all 0.6s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function handleResponsiveTable() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
}

function initializeAdvancedFiltering() {
    // Only initialize if the filter form exists
    const filterForm = document.getElementById('filterForm');
    if (!filterForm) return;
    
    // Show loading on form submission
    filterForm.addEventListener('submit', showLoadingScreen);
    
    // Year filter functionality
    const yearSelect = document.getElementById('YearSelect');
    if (yearSelect) {
        const originalOptions = [...yearSelect.options];
        
        // Filter years based on search input
        const searchInput = document.getElementById('searchInput1');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchText = this.value.toLowerCase();
                yearSelect.innerHTML = '';
                
                // Add the default option
                const defaultOption = document.createElement('option');
                defaultOption.disabled = true;
                defaultOption.selected = true;
                defaultOption.textContent = 'Years';
                yearSelect.appendChild(defaultOption);
                
                const filteredOptions = originalOptions.filter(option => {
                    // Skip the default "Years" option
                    return !option.disabled && option.textContent.toLowerCase().includes(searchText);
                });
                
                if (filteredOptions.length === 0) {
                    const noMatchOption = document.createElement('option');
                    noMatchOption.disabled = true;
                    noMatchOption.textContent = 'No Match';
                    yearSelect.appendChild(noMatchOption);
                } else {
                    filteredOptions.forEach(option => {
                        const newOption = option.cloneNode(true);
                        yearSelect.appendChild(newOption);
                    });
                }
            });
        }
    }
}

// ============================================================================
// WISHLIST PAGE FUNCTIONALITY
// ============================================================================

function initializeWishlistPage() {
    // Animate wishlist cards on load
    animateWishlistCards();
    
    // Initialize mobile interactions
    addMobileWishlistInteractions();
    
    // Initialize form submissions with loading
    setupWishlistFormHandlers();
    
    // Initialize responsive behavior
    handleWishlistResponsiveness();
    
    // Remove the status filter initialization as it's not needed for wishlist
    // initializeStatusFilter();
}

function animateWishlistCards() {
    const cards = document.querySelectorAll('.wishlist-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function addMobileWishlistInteractions() {
    const wishlistCards = document.querySelectorAll('.wishlist-card');
    
    wishlistCards.forEach(card => {
        // Touch interactions for mobile
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
        
        // Enhanced hover effects for desktop
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });
}

function setupWishlistFormHandlers() {
    // Only handle wishlist action forms (mark as purchased/pending, delete) 
    // DO NOT handle year filter forms - let them work with pure HTML
    const wishlistActionForms = document.querySelectorAll('form[action*="check_wish"], form[action*="delete_wish"]');
    
    wishlistActionForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const button = form.querySelector('button[type="submit"]');
            if (!button) return;
            
            const originalText = button.innerHTML;
            
            // Show loading state
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
            
            // Show loading overlay
            showLoadingScreen();
            
        });
    });
    
    // Set up year filter functionality
    setupYearFilterForWishlist();
}

function setupYearFilterForWishlist() {
    const searchInput = document.getElementById('searchInput1');
    const yearSelect = document.getElementById('YearSelect');
    
    if (searchInput && yearSelect) {
        const originalOptions = [...yearSelect.options];
        
        // Filter years based on search input
        searchInput.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            yearSelect.innerHTML = '';
            
            // Add the default option
            const defaultOption = document.createElement('option');
            defaultOption.disabled = true;
            defaultOption.selected = true;
            defaultOption.textContent = 'Years';
            yearSelect.appendChild(defaultOption);
            
            const filteredOptions = originalOptions.filter(option => {
                // Skip the default "Years" option
                return !option.disabled && option.textContent.toLowerCase().includes(searchText);
            });
            
            if (filteredOptions.length === 0) {
                const noMatchOption = document.createElement('option');
                noMatchOption.disabled = true;
                noMatchOption.textContent = 'No Match';
                yearSelect.appendChild(noMatchOption);
            } else {
                filteredOptions.forEach(option => {
                    const newOption = option.cloneNode(true);
                    yearSelect.appendChild(newOption);
                });
            }
        });
        
        // Handle form submission with loading
        const filterForm = document.getElementById('filterForm');
        if (filterForm) {
            filterForm.addEventListener('submit', function(e) {
                showLoadingScreen();
            });
        }
    }
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

// Monthly Reports Pie Chart
function initExpenseChart() {
    const canvas = document.getElementById('expenseChart');
    if (!canvas || !window.chartData || !window.chartData.expenses || !window.chartData.expenses.labels.length) {
        console.log('Expense chart: canvas or data not available');
        return;
    }
    
    drawPieChart(canvas, window.chartData.expenses, 'expense');
}

function initIncomeChart() {
    const canvas = document.getElementById('incomeChart');
    if (!canvas || !window.chartData || !window.chartData.income || !window.chartData.income.labels.length) {
        console.log('Income chart: canvas or data not available');
        return;
    }
    
    drawPieChart(canvas, window.chartData.income, 'income');
}

function initBothExpenseChart() {
    const canvas = document.getElementById('bothExpenseChart');
    if (!canvas || !window.chartData || !window.chartData.expenses || !window.chartData.expenses.labels.length) {
        console.log('Both expense chart: canvas or data not available');
        return;
    }
    
    drawPieChart(canvas, window.chartData.expenses, 'expense');
}

function initBothIncomeChart() {
    const canvas = document.getElementById('bothIncomeChart');
    if (!canvas || !window.chartData || !window.chartData.income || !window.chartData.income.labels.length) {
        console.log('Both income chart: canvas or data not available');
        return;
    }
    
    drawPieChart(canvas, window.chartData.income, 'income');
}

function updateSummaryStats() {
    try {
        const totalExpensesEl = document.getElementById('total-expenses');
        const totalIncomeEl = document.getElementById('total-income');
        
        if (totalExpensesEl && window.chartData && window.chartData.expenses && window.chartData.expenses.data.length) {
            const totalExpenses = window.chartData.expenses.data.reduce((sum, value) => sum + parseFloat(value || 0), 0);
            totalExpensesEl.textContent = totalExpenses.toFixed(0) + ' ' + (window.chartData.currency || '');
        }
        
        if (totalIncomeEl && window.chartData && window.chartData.income && window.chartData.income.data.length) {
            const totalIncome = window.chartData.income.data.reduce((sum, value) => sum + parseFloat(value || 0), 0);
            totalIncomeEl.textContent = totalIncome.toFixed(0) + ' ' + (window.chartData.currency || '');
        }
    } catch (error) {
        console.error('Error updating summary stats:', error);
    }
}

// Monthly Reports Chart Functions - Updated for PythonAnywhere compatibility
function initMonthlyReportsCharts() {
    // Add delay to ensure DOM is fully loaded
    setTimeout(function() {
        if (!window.chartData) {
            console.log('Chart data not available');
            return;
        }
        
        // Initialize tab switching
        initTabSwitching();
        
        // Initialize charts with error handling
        try {
            if (document.getElementById('expenseChart')) {
                initExpenseChart();
            }
            
            if (document.getElementById('incomeChart')) {
                initIncomeChart();
            }
            
            if (document.getElementById('bothExpenseChart')) {
                initBothExpenseChart();
            }
            
            if (document.getElementById('bothIncomeChart')) {
                initBothIncomeChart();
            }
            
            // Update summary stats
            updateSummaryStats();
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }, 100);
}

function initTabSwitching() {
    const expenseTab = document.getElementById('expenseTab');
    const incomeTab = document.getElementById('incomeTab');
    const bothTab = document.getElementById('bothTab');
    
    const expenseSection = document.getElementById('expenseSection');
    const incomeSection = document.getElementById('incomeSection');
    const bothSection = document.getElementById('bothSection');
    
    if (!expenseTab || !incomeTab || !bothTab) {
        console.log('Tab elements not found');
        return;
    }
    
    function switchTab(activeTab, activeSection) {
        try {
            // Reset all tabs
            [expenseTab, incomeTab, bothTab].forEach(tab => {
                if (tab) {
                    tab.classList.remove('active');
                    tab.classList.add('text-gray-700');
                    tab.style.backgroundColor = '';
                    tab.style.color = '';
                }
            });
            
            // Reset all sections
            [expenseSection, incomeSection, bothSection].forEach(section => {
                if (section) section.classList.add('hidden');
            });
            
            // Activate selected tab and section
            if (activeTab) {
                activeTab.classList.add('active');
                activeTab.classList.remove('text-gray-700');
                
                // Set active styles based on tab type
                if (activeTab.id === 'expenseTab') {
                    activeTab.style.backgroundColor = '#ef4444';
                    activeTab.style.color = 'white';
                } else if (activeTab.id === 'incomeTab') {
                    activeTab.style.backgroundColor = '#10b981';
                    activeTab.style.color = 'white';
                } else if (activeTab.id === 'bothTab') {
                    activeTab.style.backgroundColor = '#51adac';
                    activeTab.style.color = 'white';
                }
            }
            
            if (activeSection) activeSection.classList.remove('hidden');
            
            // Redraw charts with delay to ensure visibility
            setTimeout(() => {
                handleChartResize();
            }, 200);
        } catch (error) {
            console.error('Error switching tabs:', error);
        }
    }
    
    // Add event listeners with error handling
    if (expenseTab) {
        expenseTab.addEventListener('click', () => switchTab(expenseTab, expenseSection));
    }
    if (incomeTab) {
        incomeTab.addEventListener('click', () => switchTab(incomeTab, incomeSection));
    }
    if (bothTab) {
        bothTab.addEventListener('click', () => switchTab(bothTab, bothSection));
    }
}

function drawPieChart(canvas, data, colorPrefix) {
    try {
        const ctx = canvas.getContext('2d');
        const labels = data.labels || [];
        const values = data.data || [];
        
        if (!labels.length || !values.length) {
            console.log('No data available for chart');
            return;
        }
        
        // Clear any existing content
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Make canvas responsive
        const container = canvas.parentElement;
        const containerWidth = container ? container.clientWidth : 300;
        const isMobile = window.innerWidth < 768;
        
        // Set responsive canvas size
        const canvasSize = isMobile ? Math.min(containerWidth - 40, 280) : Math.min(containerWidth - 40, 300);
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        // Set CSS size to match canvas size for crisp rendering
        canvas.style.width = canvasSize + 'px';
        canvas.style.height = canvasSize + 'px';
        
        // Calculate total and percentages
        const total = values.reduce((sum, value) => sum + parseFloat(value || 0), 0);
        
        if (total === 0) {
            console.log('Total is zero, no chart to draw');
            return;
        }
        
        // Generate colors based on prefix
        const colors = labels.map((_, index) => {
            if (colorPrefix === 'expense') {
                return 'hsl(' + (0 + (index * 15)) + ', 70%, ' + (50 + (index * 2)) + '%)';
            } else {
                return 'hsl(' + (120 + (index * 15)) + ', 70%, ' + (50 + (index * 2)) + '%)';
            }
        });
        
        // Update percentage displays
        labels.forEach((_, index) => {
            const percentage = ((values[index] / total) * 100).toFixed(1);
            const percentageElement = document.getElementById(colorPrefix + '-percentage-' + index);
            if (percentageElement) {
                percentageElement.textContent = percentage + '%';
            }
        });
        
        // Draw pie chart with responsive sizing
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - (isMobile ? 15 : 20);
        
        let currentAngle = -Math.PI / 2; // Start from top
        
        values.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = isMobile ? 1 : 2;
            ctx.stroke();
            
            // Add labels for larger slices (only on desktop or larger slices)
            if (!isMobile && (value / total) > 0.08) {
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelRadius = radius * 0.7;
                const labelX = centerX + Math.cos(labelAngle) * labelRadius;
                const labelY = centerY + Math.sin(labelAngle) * labelRadius;
                
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(((value / total) * 100).toFixed(0) + '%', labelX, labelY);
            }
            
            currentAngle += sliceAngle;
        });
    } catch (error) {
        console.error('Error drawing pie chart:', error);
    }
}

// Enhanced resize handler for multiple charts
function handleChartResize() {
    const charts = ['expenseChart', 'incomeChart', 'bothExpenseChart', 'bothIncomeChart'];
    
    charts.forEach(chartId => {
        const canvas = document.getElementById(chartId);
        if (canvas && window.chartData) {
            try {
                // Clear the canvas
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Redraw based on chart type
                if (chartId.includes('expense')) {
                    drawPieChart(canvas, window.chartData.expenses, 'expense');
                } else if (chartId.includes('income')) {
                    drawPieChart(canvas, window.chartData.income, 'income');
                }
            } catch (error) {
                console.error('Error resizing chart ' + chartId + ':', error);
            }
        }
    });
}

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize monthly reports charts if on monthly reports page
    if (document.getElementById('expenseChart') || document.getElementById('incomeChart')) {
        console.log('Initializing monthly reports charts');
        initMonthlyReportsCharts();
        
        // Add resize event listener for responsiveness
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleChartResize, 250);
        });
        
        // Handle orientation change on mobile
        window.addEventListener('orientationchange', function() {
            setTimeout(handleChartResize, 300);
        });
    }
});

// Fallback initialization for slow loading
window.addEventListener('load', function() {
    if (document.getElementById('expenseChart') || document.getElementById('incomeChart')) {
        setTimeout(function() {
            if (!window.chartsInitialized) {
                console.log('Fallback chart initialization');
                initMonthlyReportsCharts();
                window.chartsInitialized = true;
            }
        }, 500);
    }
});
