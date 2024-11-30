function showLoadingScreen() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoadingScreen() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// Show loading screen on form submission
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            showLoadingScreen();
        });
    });
});

// Handle page load and unload
window.addEventListener('load', function() {
    hideLoadingScreen(); // Ensure loading screen is hidden after initial load
});

window.addEventListener('beforeunload', function() {
    showLoadingScreen(); // Show loading screen when navigating away
});

// Show loading screen when navigating back
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        showLoadingScreen();
        setTimeout(function() {
            hideLoadingScreen();
        }, 100); // Adjust delay if necessary
    }
});

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
    if (!navigator.onLine) {
        document.body.innerHTML = '<h1>You are offline</h1><p>Database connection is unavailable. Please check your internet connection.</p>';
    } else {
        location.reload();  // Reload when back online
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Toggle dark mode on button click
    const toggleDarkMode = document.getElementById('toggleDarkMode');
    if (toggleDarkMode) {  // Check if the element exists
        toggleDarkMode.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            // Save user preference in localStorage
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('dark-mode', 'enabled');
            } else {
                localStorage.setItem('dark-mode', 'disabled');
            }
        });
    }

    // Check localStorage for user preference
    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }
});


function updatePage() {
    showLoadingScreen(); // Show loading screen immediately
    const page = document.getElementById("page-selector").value;
    const allowedPages = ['home', 'about', 'contact']; // Add allowed values here
    
    if (allowedPages.includes(page)) {
        // Redirect after a brief delay to ensure loading screen is visible
        setTimeout(function() {
            window.location.href = `${page}`;
        }, 500); // Adjust delay if needed
    } else {
        console.error('Invalid page selection');
    }
}

setTimeout(function() {
    var doneMessage = document.querySelector('.done-message');
    var errorMessage = document.querySelector('.error-message');

    if (doneMessage) {
        doneMessage.style.display = 'none';
    }

    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}, 5000); // 5000 milliseconds = 5 seconds

function submitForm() {
    document.getElementById("upload-form").submit();
}

function validatePassword() {
    var password = document.getElementById("password").value;
    var confirmPassword = document.getElementById("confirm_password").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return false;
    }
    return true;
}

function togglePasswordVisibility_all() {
var passwordInput = document.getElementById("password");
var confirm_passwordInput = document.getElementById("confirm_password");
if (passwordInput.type === "password") {
passwordInput.type = "text";
} else {
passwordInput.type = "password";
}

if (confirm_passwordInput.type === "password") {
confirm_passwordInput.type = "text";
} else {
confirm_passwordInput.type = "password";
}
}

document.addEventListener('DOMContentLoaded', function() {
    // Populate the year select options
    const yearSelect = document.getElementById('yearSelect');
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 50;
    const endYear = currentYear + 50;

    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }

    // Handle currency search and filtering
    const searchInput1 = document.getElementById('searchInput1');
    const currencySelect1 = document.getElementById('CurrencySelect1');
    const originalOptions1 = [...currencySelect1.options];

    searchInput1.addEventListener('input', function() {
        filterOptions(searchInput1, currencySelect1, originalOptions1);
    });

    function filterOptions(searchInput, currencySelect, originalOptions) {
        const searchText = searchInput.value.toLowerCase();
        currencySelect.innerHTML = '';

        const filteredOptions = originalOptions.filter(option => {
            const optionText = option.textContent.toLowerCase();
            return optionText.includes(searchText);
        });

        filteredOptions.forEach(option => {
            currencySelect.appendChild(option);
        });

        if (filteredOptions.length === 0) {
            const defaultOption = document.createElement('option');
            defaultOption.disabled = true;
            defaultOption.selected = true;
            defaultOption.textContent = 'No Match';
            currencySelect.appendChild(defaultOption);
        }
    }

    // Set the favorite currency if available
    const doctorCategory = "{{ favorite_currency }}";
    const selectElement = document.getElementById("CurrencySelect1");
    const options = selectElement.options;

    for (let i = 0; i < options.length; i++) {
        if (options[i].value === doctorCategory) {
            options[i].selected = true;
            break;
        }
    }

    // Show the loading overlay on form submission
    document.getElementById('submit-form').addEventListener('submit', function() {
        document.getElementById('loading-overlay').style.display = 'flex';
    });
});

// Function to filter the select dropdown based on input
function filterOptions(searchInput, currencySelect, originalOptions) {
    const searchText = searchInput.value.toLowerCase();
    currencySelect.innerHTML = '';

    // Filter from original options
    const filteredOptions = originalOptions.filter(option => {
        const optionText = option.textContent.toLowerCase();
        return optionText.includes(searchText);
    });

    // Add filtered options to the select dropdown
    filteredOptions.forEach(option => {
        currencySelect.appendChild(option);
    });

    // If no options match the filter, add a 'No Match' option
    if (filteredOptions.length === 0) {
        const defaultOption = document.createElement('option');
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.textContent = 'No Match';
        currencySelect.appendChild(defaultOption);
    }
}

// Setting the date input to today's date
function setTodayDate(dateInputId) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById(dateInputId).value = today;
}

// Pre-select favorite currency in the dropdown
function preselectCurrency(selectElementId, favoriteCurrency) {
    const selectElement = document.getElementById(selectElementId);
    const options = selectElement.options;
    
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === favoriteCurrency) {
            options[i].selected = true;
            break;
        }
    }
}

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
    const favoriteCurrency = "{{ favorite_currency }}"; // Assuming this is passed in the template

    const searchInput1 = document.getElementById('searchInput1');
    const currencySelect1 = document.getElementById('CurrencySelect1');
    const originalOptions1 = [...currencySelect1.options];

    // Filter options on search input
    searchInput1.addEventListener('input', () => {
        filterOptions(searchInput1, currencySelect1, originalOptions1);
    });

    // Set default date
    setTodayDate('dateInput');

    // Pre-select favorite currency
    preselectCurrency('CurrencySelect1', favoriteCurrency);
});


// Pre-select a value in a dropdown based on a value passed from the server
function preSelectValue(selectElement, value) {
    const options = selectElement.options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === value) {
            options[i].selected = true;
            break;
        }
    }
}

// Add event listener to submit form on select change
function autoSubmitOnChange(selectElement, formId) {
    selectElement.addEventListener("change", function () {
        document.getElementById(formId).submit();
    });
}

// General initialization function
function initializeDropdown(searchInputId, selectElementId, serverValue, formId) {
    const searchInput = document.getElementById(searchInputId);
    const selectElement = document.getElementById(selectElementId);
    const originalOptions = [...selectElement.options];

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterOptions(searchInput, selectElement, originalOptions);
        });
    }

    if (serverValue) {
        preSelectValue(selectElement, serverValue);
    }

    if (formId) {
        autoSubmitOnChange(selectElement, formId);
    }
}
