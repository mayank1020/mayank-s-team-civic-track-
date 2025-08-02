// Initialize variables
let map;
let userLocation = null;
let issues = [];
let markers = [];
let selectedCategory = null;
let isAnonymous = false;
let currentUser = null;
let isAdmin = false;
let photoCount = 0;
let issueIdCounter = 1;
let users = [];
let currentAuthTab = 'login';
let locationPermissionAsked = false;
let settings = {
    defaultRadius: 3,
    autoLocation: true,
    notifications: {
        issueUpdates: true,
        newIssues: true,
        communityMessages: false
    },
    display: {
        darkMode: false,
        compactView: false
    }
};
let activeFilters = {
    status: 'all',
    category: 'all',
    distance: 'all'
};
let lastRenderedIssues = [];
let liveIssuesUpdateInterval;
let externalIssues = [];

// DOM Elements
const mapElement = document.getElementById('map');
const locationText = document.getElementById('locationText');
const radiusSelect = document.getElementById('radiusSelect');
const locationSearch = document.getElementById('locationSearch');
const searchLocationBtn = document.getElementById('searchLocationBtn');
const refreshLocationBtn = document.getElementById('refreshLocationBtn');
const manualLocationBtn = document.getElementById('manualLocationBtn');
const reportForm = document.getElementById('reportForm');
const issueTitle = document.getElementById('issueTitle');
const issueDescription = document.getElementById('issueDescription');
const anonymousToggle = document.getElementById('anonymousToggle');
const addPhotoBtn = document.getElementById('addPhotoBtn');
const photoInput = document.getElementById('photoInput');
const issuesGrid = document.getElementById('issuesGrid');
const issueModal = document.getElementById('issueModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const issueDetail = document.getElementById('issueDetail');
const notification = document.getElementById('notification');
const notificationClose = document.getElementById('notificationClose');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const adminBtn = document.getElementById('adminBtn');
const userAvatar = document.getElementById('userAvatar');
const adminPanel = document.getElementById('adminPanel');
const refreshDataBtn = document.getElementById('refreshDataBtn');

// Live Issues Feed Elements
const liveIssuesFeed = document.getElementById('liveIssuesFeed');
const refreshLiveIssuesBtn = document.getElementById('refreshLiveIssuesBtn');
const fetchExternalBtn = document.getElementById('fetchExternalBtn');

// Permission Modal Elements
const permissionModal = document.getElementById('permissionModal');
const allowLocationBtn = document.getElementById('allowLocationBtn');
const denyLocationBtn = document.getElementById('denyLocationBtn');

// Settings Modal Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsModalClose = document.getElementById('settingsModalClose');
const settingsForm = document.getElementById('settingsForm');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const defaultRadius = document.getElementById('defaultRadius');
const autoLocationToggle = document.getElementById('autoLocationToggle');
const issueUpdatesToggle = document.getElementById('issueUpdatesToggle');
const newIssuesToggle = document.getElementById('newIssuesToggle');
const communityMessagesToggle = document.getElementById('communityMessagesToggle');
const darkModeToggle = document.getElementById('darkModeToggle');
const compactViewToggle = document.getElementById('compactViewToggle');

// Change Password Elements
const changePasswordSection = document.getElementById('changePasswordSection');
const currentPassword = document.getElementById('currentPassword');
const newPassword = document.getElementById('newPassword');
const confirmNewPassword = document.getElementById('confirmNewPassword');
const changePasswordBtn = document.getElementById('changePasswordBtn');

// Auth Modal Elements
const authModal = document.getElementById('authModal');
const authModalClose = document.getElementById('authModalClose');
const authModalTitle = document.getElementById('authModalTitle');
const authTabs = document.querySelectorAll('.auth-tab');
const loginPanel = document.getElementById('loginPanel');
const signupPanel = document.getElementById('signupPanel');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotForm = document.getElementById('forgotForm');
const forgotEmail = document.getElementById('forgotEmail');
const backToLoginLink = document.getElementById('backToLoginLink');

// Email Modal Elements
const emailModal = document.getElementById('emailModal');
const emailPassword = document.getElementById('emailPassword');
const emailLoginBtn = document.getElementById('emailLoginBtn');

// Admin Panel Elements
const adminTabs = document.querySelectorAll('.admin-tab');
const dashboardTab = document.getElementById('dashboard-tab');
const issuesTab = document.getElementById('issues-tab');
const usersTab = document.getElementById('users-tab');
const allIssuesTable = document.getElementById('allIssuesTable');
const userSearchInput = document.getElementById('userSearchInput');
const searchUserBtn = document.getElementById('searchUserBtn');
const usersList = document.getElementById('usersList');

// Filter buttons
const filterBtns = document.querySelectorAll('.filter-btn');

// Initialize the application
function init() {
    // Initialize map
    map = L.map('map').setView([40.7128, -74.0060], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add a marker for the default location
    const defaultMarker = L.marker([40.7128, -74.0060]).addTo(map)
        .bindPopup('New York City')
        .openPopup();
    
    // Load data from localStorage
    loadDataFromStorage();
    
    // Apply settings
    applySettings();
    
    // Check if we need to ask for location permission
    if (settings.autoLocation && !locationPermissionAsked) {
        showLocationPermissionModal();
    } else if (settings.autoLocation) {
        getUserLocation();
    } else {
        locationText.textContent = 'Location detection disabled. Set location manually.';
        userLocation = { lat: 40.7128, lng: -74.0060 };
        filterIssuesByLocation();
        renderLiveIssues();
    }
    
    // Load sample data if no data exists
    if (issues.length === 0) {
        loadSampleData();
        saveDataToStorage();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Render issues
    renderIssues();
    renderLiveIssues();
    
    // Start live issues update interval
    startLiveIssuesUpdateInterval();
}

// Start live issues update interval
function startLiveIssuesUpdateInterval() {
    // Update live issues every 30 seconds
    liveIssuesUpdateInterval = setInterval(() => {
        if (userLocation) {
            renderLiveIssues();
        }
    }, 30000);
}

// Load data from localStorage
function loadDataFromStorage() {
    const storedIssues = localStorage.getItem('civictrack_issues');
    const storedUsers = localStorage.getItem('civictrack_users');
    const storedIssueIdCounter = localStorage.getItem('civictrack_issueIdCounter');
    const storedSettings = localStorage.getItem('civictrack_settings');
    const storedLocationPermissionAsked = localStorage.getItem('civictrack_locationPermissionAsked');
    
    if (storedIssues) {
        issues = JSON.parse(storedIssues);
    }
    
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    }
    
    if (storedIssueIdCounter) {
        issueIdCounter = parseInt(storedIssueIdCounter);
    }
    
    if (storedSettings) {
        settings = { ...settings, ...JSON.parse(storedSettings) };
    }
    
    if (storedLocationPermissionAsked) {
        locationPermissionAsked = storedLocationPermissionAsked === 'true';
    }
}

// Save data to localStorage
function saveDataToStorage() {
    localStorage.setItem('civictrack_issues', JSON.stringify(issues));
    localStorage.setItem('civictrack_users', JSON.stringify(users));
    localStorage.setItem('civictrack_issueIdCounter', issueIdCounter.toString());
    localStorage.setItem('civictrack_settings', JSON.stringify(settings));
    localStorage.setItem('civictrack_locationPermissionAsked', locationPermissionAsked.toString());
}

// Apply settings
function applySettings() {
    // Apply default radius
    radiusSelect.value = settings.defaultRadius;
    
    // Apply auto location toggle
    if (settings.autoLocation) {
        autoLocationToggle.classList.add('active');
    } else {
        autoLocationToggle.classList.remove('active');
    }
    
    // Apply notification toggles
    if (settings.notifications.issueUpdates) {
        issueUpdatesToggle.classList.add('active');
    } else {
        issueUpdatesToggle.classList.remove('active');
    }
    
    if (settings.notifications.newIssues) {
        newIssuesToggle.classList.add('active');
    } else {
        newIssuesToggle.classList.remove('active');
    }
    
    if (settings.notifications.communityMessages) {
        communityMessagesToggle.classList.add('active');
    } else {
        communityMessagesToggle.classList.remove('active');
    }
    
    // Apply display toggles
    if (settings.display.darkMode) {
        darkModeToggle.classList.add('active');
        document.body.classList.add('dark-mode');
    } else {
        darkModeToggle.classList.remove('active');
        document.body.classList.remove('dark-mode');
    }
    
    if (settings.display.compactView) {
        compactViewToggle.classList.add('active');
        document.body.classList.add('compact-view');
    } else {
        compactViewToggle.classList.remove('active');
        document.body.classList.remove('compact-view');
    }
}

// Show location permission modal
function showLocationPermissionModal() {
    const modal = new bootstrap.Modal(permissionModal);
    modal.show();
}

// Get user location
function getUserLocation() {
    if (navigator.geolocation) {
        locationText.textContent = 'Getting your location...';
        
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setView([userLocation.lat, userLocation.lng], 14);
                
                // Add user location marker
                L.marker([userLocation.lat, userLocation.lng])
                    .addTo(map)
                    .bindPopup('Your Location')
                    .openPopup();
                
                locationText.textContent = `Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}`;
                
                // Filter issues based on location
                filterIssuesByLocation();
                renderLiveIssues();
                
                // Mark that we've asked for permission
                locationPermissionAsked = true;
                saveDataToStorage();
            },
            error => {
                console.error('Error getting location:', error);
                locationText.textContent = 'Location access denied. Set location manually.';
                // Default to New York City
                userLocation = { lat: 40.7128, lng: -74.0060 };
                filterIssuesByLocation();
                renderLiveIssues();
            }
        );
    } else {
        locationText.textContent = 'Geolocation not supported. Set location manually.';
        userLocation = { lat: 40.7128, lng: -74.0060 };
        filterIssuesByLocation();
        renderLiveIssues();
    }
}

// Search for location
function searchLocation() {
    const query = locationSearch.value.trim();
    if (!query) {
        showNotification('Please enter a location to search', 'warning');
        return;
    }
    
    // Use Nominatim API for geocoding
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                
                userLocation = { lat, lng };
                map.setView([lat, lng], 14);
                
                // Add location marker
                L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup(result.display_name)
                    .openPopup();
                
                locationText.textContent = result.display_name;
                
                // Filter issues based on location
                filterIssuesByLocation();
                renderLiveIssues();
                
                showNotification('Location found successfully', 'success');
            } else {
                showNotification('Location not found. Please try a different search term.', 'error');
            }
        })
        .catch(error => {
            console.error('Error searching location:', error);
            showNotification('Error searching for location. Please try again.', 'error');
        });
}

// Set manual location
function setManualLocation() {
    const lat = prompt('Enter latitude:');
    const lng = prompt('Enter longitude:');
    
    if (lat && lng) {
        userLocation = {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        };
        
        map.setView([userLocation.lat, userLocation.lng], 14);
        
        // Add user location marker
        L.marker([userLocation.lat, userLocation.lng])
            .addTo(map)
            .bindPopup('Your Location')
            .openPopup();
        
        locationText.textContent = `Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)} (Manual)`;
        
        // Filter issues based on location
        filterIssuesByLocation();
        renderLiveIssues();
        
        showNotification('Location set manually', 'success');
    }
}

// Load sample data
function loadSampleData() {
    issues = [
        {
            id: 1,
            title: 'Streetlight not working',
            description: 'Street light not working for past week, causing safety concerns for pedestrians at night',
            category: 'lighting',
            status: 'in-progress',
            location: { lat: 40.7120, lng: -74.0055 },
            photos: ['https://picsum.photos/seed/light1/600/400.jpg', 'https://picsum.photos/seed/light2/600/400.jpg'],
            reporter: 'Jane Smith',
            reporterId: 2,
            anonymous: false,
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            flags: 1,
            timeline: [
                { status: 'reported', date: new Date(Date.now() - 172800000).toISOString(), note: 'Issue reported' },
                { status: 'in-progress', date: new Date(Date.now() - 43200000).toISOString(), note: 'Maintenance team assigned' }
            ]
        },
        {
            id: 2,
            title: 'Pothole on main road',
            description: 'Large pothole causing traffic issues and potential damage to vehicles',
            category: 'roads',
            status: 'reported',
            location: { lat: 40.7135, lng: -74.0072 },
            photos: ['https://picsum.photos/seed/pothole1/600/400.jpg'],
            reporter: 'John Doe',
            reporterId: 1,
            anonymous: false,
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            flags: 0,
            timeline: [
                { status: 'reported', date: new Date(Date.now() - 86400000).toISOString(), note: 'Issue reported' }
            ]
        },
        {
            id: 3,
            title: 'Garbage not collected',
            description: 'Public garbage bin overflowing and attracting pests, creating health hazard',
            category: 'cleanliness',
            status: 'reported',
            location: { lat: 40.7115, lng: -74.0065 },
            photos: ['https://picsum.photos/seed/trash1/600/400.jpg'],
            reporter: 'Mike Johnson',
            reporterId: 3,
            anonymous: false,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            flags: 2,
            timeline: [
                { status: 'reported', date: new Date(Date.now() - 3600000).toISOString(), note: 'Issue reported' }
            ]
        },
        {
            id: 4,
            title: 'Fallen tree blocking sidewalk',
            description: 'Large tree fell during storm and is blocking pedestrian path, forcing people onto the street',
            category: 'obstructions',
            status: 'in-progress',
            location: { lat: 40.7125, lng: -74.0045 },
            photos: ['https://picsum.photos/seed/tree1/600/400.jpg', 'https://picsum.photos/seed/tree2/600/400.jpg', 'https://picsum.photos/seed/tree3/600/400.jpg'],
            reporter: 'Sarah Williams',
            reporterId: 4,
            anonymous: false,
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            flags: 0,
            timeline: [
                { status: 'reported', date: new Date(Date.now() - 7200000).toISOString(), note: 'Issue reported' },
                { status: 'in-progress', date: new Date(Date.now() - 3600000).toISOString(), note: 'Cleanup crew dispatched' }
            ]
        },
        {
            id: 5,
            title: 'Water leak',
            description: 'Significant water leak near the park, wasting water and creating slippery surfaces',
            category: 'water',
            status: 'resolved',
            location: { lat: 40.7140, lng: -74.0080 },
            photos: ['https://picsum.photos/seed/water1/600/400.jpg'],
            reporter: 'Anonymous User',
            reporterId: null,
            anonymous: true,
            timestamp: new Date(Date.now() - 259200000).toISOString(),
            flags: 0,
            timeline: [
                { status: 'reported', date: new Date(Date.now() - 259200000).toISOString(), note: 'Issue reported' },
                { status: 'in-progress', date: new Date(Date.now() - 216000000).toISOString(), note: 'Repair team dispatched' },
                { status: 'resolved', date: new Date(Date.now() - 86400000).toISOString(), note: 'Issue resolved' }
            ]
        }
    ];
    
    users = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            isAdmin: false,
            banned: false,
            joinDate: new Date(Date.now() - 604800000).toISOString()
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            password: 'password123',
            isAdmin: false,
            banned: false,
            joinDate: new Date(Date.now() - 432000000).toISOString()
        },
        {
            id: 3,
            name: 'Mike Johnson',
            email: 'mike@example.com',
            password: 'password123',
            isAdmin: false,
            banned: false,
            joinDate: new Date(Date.now() - 259200000).toISOString()
        },
        {
            id: 4,
            name: 'Sarah Williams',
            email: 'sarah@example.com',
            password: 'password123',
            isAdmin: false,
            banned: false,
            joinDate: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: 5,
            name: 'Admin User',
            email: 'admin@civictrack.com',
            password: 'admin123',
            isAdmin: true,
            banned: false,
            joinDate: new Date(Date.now() - 864000000).toISOString()
        }
    ];
    
    issueIdCounter = 6;
}

// Setup event listeners
function setupEventListeners() {
    // Radius selector
    radiusSelect.addEventListener('change', () => {
        filterIssuesByLocation();
        renderLiveIssues();
    });
    
    // Location search
    searchLocationBtn.addEventListener('click', searchLocation);
    locationSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });
    
    // Location buttons
    refreshLocationBtn.addEventListener('click', () => {
        if (settings.autoLocation) {
            getUserLocation();
            showNotification('Location refreshed', 'success');
        } else {
            showNotification('Automatic location is disabled', 'warning');
        }
    });
    
    manualLocationBtn.addEventListener('click', setManualLocation);
    
    // Category selection
    document.querySelectorAll('.category-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById(`cat-${this.dataset.category}`).checked = true;
            selectedCategory = this.dataset.category;
        });
    });
    
    // Anonymous toggle
    anonymousToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        isAnonymous = !isAnonymous;
    });
    
    // Photo upload
    addPhotoBtn.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', handlePhotoUpload);
    
    // Remove photo buttons
    document.querySelectorAll('.remove-photo').forEach(btn => {
        btn.addEventListener('click', function() {
            const previewNum = this.dataset.preview;
            document.getElementById(`photoPreview${previewNum}`).style.display = 'none';
            photoCount--;
            updatePhotoUploadButton();
        });
    });
    
    // Report form submission
    reportForm.addEventListener('submit', handleReportSubmission);
    
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filterType = this.dataset.type;
            const filterValue = this.dataset.filter;
            
            // Update active state for this filter type
            document.querySelectorAll(`.filter-btn[data-type="${filterType}"]`).forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update active filters
            activeFilters[filterType] = filterValue;
            
            // Re-render issues
            renderIssues();
        });
    });
    
    // Notification close
    notificationClose.addEventListener('click', () => {
        notification.classList.remove('show');
    });
    
    // Permission modal
    allowLocationBtn.addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(permissionModal);
        modal.hide();
        getUserLocation();
    });
    
    denyLocationBtn.addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(permissionModal);
        modal.hide();
        locationPermissionAsked = true;
        saveDataToStorage();
        locationText.textContent = 'Location access denied. Set location manually.';
        userLocation = { lat: 40.7128, lng: -74.0060 };
        filterIssuesByLocation();
        renderLiveIssues();
    });
    
    // Settings modal
    settingsBtn.addEventListener('click', () => {
        const modal = new bootstrap.Modal(settingsModal);
        modal.show();
    });
    
    // Settings toggles
    autoLocationToggle.addEventListener('click', function() {
        this.classList.toggle('active');
    });
    
    issueUpdatesToggle.addEventListener('click', function() {
        this.classList.toggle('active');
    });
    
    newIssuesToggle.addEventListener('click', function() {
        this.classList.toggle('active');
    });
    
    communityMessagesToggle.addEventListener('click', function() {
        this.classList.toggle('active');
    });
    
    darkModeToggle.addEventListener('click', function() {
        this.classList.toggle('active');
    });
    
    compactViewToggle.addEventListener('click', function() {
        this.classList.toggle('active');
    });
    
    // Settings form
    cancelSettingsBtn.addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(settingsModal);
        modal.hide();
        applySettings(); // Reset to saved settings
    });
    
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Change password
    changePasswordBtn.addEventListener('click', handleChangePassword);
    
    // Auth modal
    loginBtn.addEventListener('click', function() {
        if (currentUser) {
            handleLogout();
        } else {
            currentAuthTab = 'login';
            const modal = new bootstrap.Modal(authModal);
            modal.show();
        }
    });
    
    signupBtn.addEventListener('click', () => {
        currentAuthTab = 'signup';
        const modal = new bootstrap.Modal(authModal);
        modal.show();
    });
    
    // Back to login link
    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-tab').click();
    });
    
    // Email login button
    emailLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const emailModalInstance = bootstrap.Modal.getInstance(emailModal);
        emailModalInstance.hide();
        
        const authModalInstance = new bootstrap.Modal(authModal);
        authModalInstance.show();
        document.getElementById('login-tab').click();
    });
    
    // Auth forms
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    forgotForm.addEventListener('submit', handleForgotPassword);
    
    // Admin button
    adminBtn.addEventListener('click', () => {
        adminPanel.style.display = adminPanel.style.display === 'none' ? 'block' : 'none';
        if (adminPanel.style.display === 'block') {
            updateAdminStats();
            renderAllIssues();
            renderUsers();
        }
    });
    
    // Refresh data button
    refreshDataBtn.addEventListener('click', () => {
        updateAdminStats();
        renderAllIssues();
        renderUsers();
        showNotification('Data refreshed successfully', 'success');
    });
    
    // Live issues refresh button
    refreshLiveIssuesBtn.addEventListener('click', () => {
        renderLiveIssues();
        showNotification('Live issues refreshed', 'success');
    });
    
    // Fetch external issues button
    fetchExternalBtn.addEventListener('click', fetchExternalIssues);
    
    // User search
    searchUserBtn.addEventListener('click', searchUsers);
    userSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchUsers();
        }
    });
}

// Generate random password
function generateRandomPassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Handle forgot password
function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = forgotEmail.value.trim();
    
    // Find user by email
    const user = users.find(u => u.email === email && !u.banned);
    
    if (user) {
        // Generate a temporary password
        const tempPassword = generateRandomPassword();
        
        // Update user's password
        user.password = tempPassword;
        saveDataToStorage();
        
        // Show email modal with the temporary password
        emailPassword.textContent = tempPassword;
        const emailModalInstance = new bootstrap.Modal(emailModal);
        emailModalInstance.show();
        
        // Reset form
        forgotForm.reset();
    } else {
        showNotification('Email not found in our system', 'error');
    }
}

// Handle change password
function handleChangePassword() {
    const current = currentPassword.value;
    const newPass = newPassword.value;
    const confirmPass = confirmNewPassword.value;
    
    // Validate inputs
    if (!current || !newPass || !confirmPass) {
        showNotification('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPass !== confirmPass) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPass.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Check current password
    if (current !== currentUser.password) {
        showNotification('Current password is incorrect', 'error');
        return;
    }
    
    // Update password
    currentUser.password = newPass;
    saveDataToStorage();
    
    // Clear form and show notification
    currentPassword.value = '';
    newPassword.value = '';
    confirmNewPassword.value = '';
    
    showNotification('Password changed successfully', 'success');
}

// Fetch external issues from various sources
function fetchExternalIssues() {
    showNotification('Fetching external issues...', 'info');
    
    // Simulate fetching from external sources
    setTimeout(() => {
        // Generate sample external issues
        const sampleExternalIssues = [
            {
                id: `ext-${Date.now()}`,
                title: 'Traffic signal malfunction at downtown intersection',
                description: 'Traffic light not working properly causing traffic congestion',
                category: 'roads',
                status: 'reported',
                location: { 
                    lat: userLocation.lat + (Math.random() - 0.5) * 0.01, 
                    lng: userLocation.lng + (Math.random() - 0.5) * 0.01 
                },
                reporter: 'External Source',
                source: 'City 311',
                timestamp: new Date().toISOString(),
                flags: 0,
                isExternal: true
            },
            {
                id: `ext-${Date.now() + 1}`,
                title: 'Broken sidewalk panel near city park',
                description: 'Concrete panel broken creating tripping hazard for pedestrians',
                category: 'safety',
                status: 'reported',
                location: { 
                    lat: userLocation.lat + (Math.random() - 0.5) * 0.01, 
                    lng: userLocation.lng + (Math.random() - 0.5) * 0.01 
                },
                reporter: 'External Source',
                source: 'Community Report',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                flags: 0,
                isExternal: true
            },
            {
                id: `ext-${Date.now() + 2}`,
                title: 'Overflowing public trash bin',
                description: 'Trash bin overflowing, needs immediate attention',
                category: 'cleanliness',
                status: 'in-progress',
                location: { 
                    lat: userLocation.lat + (Math.random() - 0.5) * 0.01, 
                    lng: userLocation.lng + (Math.random() - 0.5) * 0.01 
                },
                reporter: 'External Source',
                source: 'Social Media',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                flags: 0,
                isExternal: true
            }
        ];
        
        // Add external issues to the main issues array
        externalIssues = [...externalIssues, ...sampleExternalIssues];
        
        // Update the live issues feed
        renderLiveIssues();
        
        showNotification(`Fetched ${sampleExternalIssues.length} external issues`, 'success');
    }, 1500);
}

// Save settings
function saveSettings() {
    settings.defaultRadius = parseInt(defaultRadius.value);
    settings.autoLocation = autoLocationToggle.classList.contains('active');
    settings.notifications.issueUpdates = issueUpdatesToggle.classList.contains('active');
    settings.notifications.newIssues = newIssuesToggle.classList.contains('active');
    settings.notifications.communityMessages = communityMessagesToggle.classList.contains('active');
    settings.display.darkMode = darkModeToggle.classList.contains('active');
    settings.display.compactView = compactViewToggle.classList.contains('active');
    
    saveDataToStorage();
    applySettings();
    const modal = bootstrap.Modal.getInstance(settingsModal);
    modal.hide();
    
    showNotification('Settings saved successfully', 'success');
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Find user
    const user = users.find(u => u.email === email && u.password === password && !u.banned);
    
    if (user) {
        currentUser = user;
        isAdmin = user.isAdmin;
        
        // Update UI
        updateAuthUI();
        const modal = bootstrap.Modal.getInstance(authModal);
        modal.hide();
        loginForm.reset();
        
        showNotification(`Welcome back, ${user.name}!`, 'success');
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

// Handle signup
function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
        showNotification('Email already registered', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        name,
        email,
        password,
        isAdmin: false,
        banned: false,
        joinDate: new Date().toISOString()
    };
    
    users.push(newUser);
    saveDataToStorage();
    
    // Auto login
    currentUser = newUser;
    isAdmin = false;
    
    // Update UI
    updateAuthUI();
    const modal = bootstrap.Modal.getInstance(authModal);
    modal.hide();
    signupForm.reset();
    
    showNotification(`Welcome to CivicTrack, ${name}!`, 'success');
}

// Update auth UI
function updateAuthUI() {
    if (currentUser) {
        loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Logout</span>';
        signupBtn.style.display = 'none';
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        userAvatar.style.display = 'flex';
        changePasswordSection.style.display = 'block';
        
        if (isAdmin) {
            adminBtn.style.display = 'flex';
        } else {
            adminBtn.style.display = 'none';
        }
    } else {
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Login</span>';
        signupBtn.style.display = 'flex';
        userAvatar.style.display = 'none';
        changePasswordSection.style.display = 'none';
        adminBtn.style.display = 'none';
        adminPanel.style.display = 'none';
    }
}

// Handle logout
function handleLogout() {
    currentUser = null;
    isAdmin = false;
    updateAuthUI();
    
    // Clear password fields
    currentPassword.value = '';
    newPassword.value = '';
    confirmNewPassword.value = '';
    
    showNotification('Logged out successfully', 'success');
}

// Handle photo upload
function handlePhotoUpload(e) {
    if (photoCount >= 3) {
        showNotification('Maximum 3 photos allowed', 'warning');
        return;
    }
    
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            photoCount++;
            const previewNum = photoCount;
            const preview = document.getElementById(`photoPreview${previewNum}`);
            preview.querySelector('img').src = event.target.result;
            preview.style.display = 'flex';
            updatePhotoUploadButton();
        };
        reader.readAsDataURL(file);
    }
    
    // Reset file input
    e.target.value = '';
}

// Update photo upload button visibility
function updatePhotoUploadButton() {
    addPhotoBtn.style.display = photoCount >= 3 ? 'none' : 'flex';
}

// Handle report submission
function handleReportSubmission(e) {
    e.preventDefault();
    
    if (!selectedCategory) {
        showNotification('Please select a category', 'error');
        return;
    }
    
    if (!userLocation) {
        showNotification('Unable to determine your location', 'error');
        return;
    }
    
    // Create new issue
    const newIssue = {
        id: issueIdCounter++,
        title: issueTitle.value,
        description: issueDescription.value,
        category: selectedCategory,
        status: 'reported',
        location: { ...userLocation },
        photos: [],
        reporter: isAnonymous ? 'Anonymous User' : currentUser.name,
        reporterId: isAnonymous ? null : currentUser.id,
        anonymous: isAnonymous,
        timestamp: new Date().toISOString(),
        flags: 0,
        timeline: [
            { status: 'reported', date: new Date().toISOString(), note: 'Issue reported' }
        ]
    };
    
    // Add photos
    for (let i = 1; i <= photoCount; i++) {
        const preview = document.getElementById(`photoPreview${i}`);
        if (preview.style.display !== 'none') {
            newIssue.photos.push(preview.querySelector('img').src);
        }
    }
    
    // Add to issues array
    issues.push(newIssue);
    saveDataToStorage();
    
    // Reset form
    reportForm.reset();
    document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('selected'));
    selectedCategory = null;
    isAnonymous = false;
    anonymousToggle.classList.remove('active');
    
    // Reset photo previews
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`photoPreview${i}`).style.display = 'none';
    }
    photoCount = 0;
    updatePhotoUploadButton();
    
    // Update UI
    renderIssues();
    renderLiveIssues();
    addIssueToMap(newIssue);
    
    // Show notification
    showNotification('Issue reported successfully!', 'success');
}

// Filter issues by location
function filterIssuesByLocation() {
    if (!userLocation) return;
    
    const radius = parseFloat(radiusSelect.value);
    
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Add markers for issues within radius
    issues.forEach(issue => {
        const distance = calculateDistance(userLocation, issue.location);
        if (distance <= radius) {
            addIssueToMap(issue);
        }
    });
    
    renderIssues();
}

// Calculate distance between two points
function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

// Add issue to map
function addIssueToMap(issue) {
    const icon = getIssueIcon(issue.category);
    
    const marker = L.marker([issue.location.lat, issue.location.lng], { icon })
        .addTo(map)
        .bindPopup(`
            <div>
                <h4>${issue.title}</h4>
                <p><strong>Category:</strong> ${getCategoryName(issue.category)}</p>
                <p><strong>Status:</strong> ${getIssueStatus(issue.status)}</p>
                <button class="btn btn-primary btn-sm" onclick="showIssueDetail(${issue.id})">View Details</button>
            </div>
        `);
    
    markers.push(marker);
}

// Get issue icon
function getIssueIcon(category) {
    const icons = {
        roads: 'fa-road',
        lighting: 'fa-lightbulb',
        water: 'fa-tint',
        cleanliness: 'fa-trash',
        safety: 'fa-hard-hat',
        obstructions: 'fa-tree'
    };
    
    return L.divIcon({
        html: `<i class="fas ${icons[category]}"></i>`,
        iconSize: [20, 20],
        className: 'issue-marker'
    });
}

// Get category name
function getCategoryName(category) {
    const names = {
        roads: 'Roads',
        lighting: 'Lighting',
        water: 'Water Supply',
        cleanliness: 'Cleanliness',
        safety: 'Public Safety',
        obstructions: 'Obstructions'
    };
    return names[category] || category;
}

// Get issue status
function getIssueStatus(status) {
    const statuses = {
        'reported': 'Reported',
        'in-progress': 'In Progress',
        'resolved': 'Resolved'
    };
    return statuses[status] || status;
}

// Render issues grid
function renderIssues() {
    let filteredIssues = issues;
    
    // Filter by status
    if (activeFilters.status !== 'all') {
        filteredIssues = filteredIssues.filter(issue => issue.status === activeFilters.status);
    }
    
    // Filter by category
    if (activeFilters.category !== 'all') {
        filteredIssues = filteredIssues.filter(issue => issue.category === activeFilters.category);
    }
    
    // Filter by distance
    if (activeFilters.distance !== 'all' && userLocation) {
        const radius = parseFloat(activeFilters.distance);
        filteredIssues = filteredIssues.filter(issue => {
            const distance = calculateDistance(userLocation, issue.location);
            return distance <= radius;
        });
    }
    
    // Clear issues grid
    issuesGrid.innerHTML = '';
    
    if (filteredIssues.length === 0) {
        issuesGrid.innerHTML = `
            <div class="no-issues">
                <i class="fas fa-inbox"></i>
                <h3>No Issues Found</h3>
                <p>No issues match your current filters. Try adjusting your filter criteria.</p>
            </div>
        `;
        return;
    }
    
    // Add issues to grid
    filteredIssues.forEach(issue => {
        const distance = userLocation ? calculateDistance(userLocation, issue.location).toFixed(2) : 'N/A';
        
        const issueCard = document.createElement('div');
        issueCard.className = `issue-card ${issue.category}`;
        issueCard.innerHTML = `
            <div class="issue-image">
                <img src="${issue.photos && issue.photos.length > 0 ? issue.photos[0] : `https://picsum.photos/seed/${issue.category}${issue.id}/600/400.jpg`}" alt="${issue.title}">
                <div class="issue-status-badge status-${issue.status}">${getIssueStatus(issue.status)}</div>
            </div>
            <div class="issue-content">
                <h3 class="issue-title">${issue.title}</h3>
                <p class="issue-description">${issue.description}</p>
                <div class="issue-meta">
                    <div class="issue-category">
                        <i class="fas ${getIssueIcon(issue.category).options.html.replace(/<[^>]*>/g, '')}"></i>
                        <span>${getCategoryName(issue.category)}</span>
                    </div>
                    <div class="issue-details">
                        <div class="issue-distance">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${distance} km</span>
                        </div>
                        <div class="issue-reporter">
                            <i class="fas fa-user"></i>
                            <span>By ${issue.reporter}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        issueCard.addEventListener('click', () => showIssueDetail(issue.id));
        issuesGrid.appendChild(issueCard);
    });
}

// Render live issues feed
function renderLiveIssues() {
    if (!userLocation) {
        liveIssuesFeed.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-map-marker-alt text-muted"></i>
                <p class="text-muted mt-2">Location not available</p>
            </div>
        `;
        return;
    }
    
    const radius = parseFloat(radiusSelect.value);
    
    // Combine local and external issues
    const allIssues = [...issues, ...externalIssues];
    
    // Filter issues within radius
    const nearbyIssues = allIssues.filter(issue => {
        const distance = calculateDistance(userLocation, issue.location);
        return distance <= radius;
    });
    
    // Sort by distance (closest first)
    nearbyIssues.sort((a, b) => {
        const distanceA = calculateDistance(userLocation, a.location);
        const distanceB = calculateDistance(userLocation, b.location);
        return distanceA - distanceB;
    });
    
    // Clear live issues feed
    liveIssuesFeed.innerHTML = '';
    
    if (nearbyIssues.length === 0) {
        liveIssuesFeed.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-check-circle text-success"></i>
                <p class="text-muted mt-2">No issues in your area</p>
            </div>
        `;
        return;
    }
    
    // Check for new issues since last render
    const newIssues = nearbyIssues.filter(issue => {
        return !lastRenderedIssues.some(lastIssue => lastIssue.id === issue.id);
    });
    
    // Add issues to live feed
    nearbyIssues.forEach(issue => {
        const distance = calculateDistance(userLocation, issue.location).toFixed(2);
        const isNew = newIssues.some(newIssue => newIssue.id === issue.id);
        const issueTime = new Date(issue.timestamp);
        const timeDiff = Date.now() - issueTime.getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutesAgo = Math.floor(timeDiff / (1000 * 60));
        
        let timeString;
        if (hoursAgo > 0) {
            timeString = `${hoursAgo}h ago`;
        } else if (minutesAgo > 0) {
            timeString = `${minutesAgo}m ago`;
        } else {
            timeString = 'Just now';
        }
        
        const liveIssueItem = document.createElement('div');
        liveIssueItem.className = `live-issue-item ${isNew ? 'live-issue-new' : ''} ${issue.isExternal ? 'live-issue-external' : ''}`;
        liveIssueItem.innerHTML = `
            <div class="live-issue-title">${issue.title}</div>
            <div class="live-issue-meta">
                <div class="live-issue-category">
                    <i class="fas ${getIssueIcon(issue.category).options.html.replace(/<[^>]*>/g, '')}"></i>
                    <span>${getCategoryName(issue.category)}</span>
                </div>
                <div class="live-issue-distance">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${distance} km</span>
                </div>
            </div>
            <div class="live-issue-status status-${issue.status}">${getIssueStatus(issue.status)}</div>
            <div class="live-issue-time">${timeString}</div>
            ${issue.isExternal ? `<div class="live-issue-source">Source: ${issue.source}</div>` : ''}
            ${isNew ? '<div class="live-issue-pulse"></div>' : ''}
        `;
        
        liveIssueItem.addEventListener('click', () => {
            if (issue.isExternal) {
                showNotification('This is an external issue. Details are limited.', 'info');
            } else {
                showIssueDetail(issue.id);
            }
        });
        
        liveIssuesFeed.appendChild(liveIssueItem);
    });
    
    // Update last rendered issues
    lastRenderedIssues = nearbyIssues;
}

// Show issue detail
function showIssueDetail(issueId) {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;
    
    const modal = new bootstrap.Modal(issueModal);
    modal.show();
    
    // Populate modal with issue details
    const distance = userLocation ? calculateDistance(userLocation, issue.location).toFixed(2) : 'N/A';
    
    issueDetail.innerHTML = `
        <div class="issue-photos">
            ${issue.photos && issue.photos.length > 0 
                ? issue.photos.map(photo => `
                    <div class="issue-photo">
                        <img src="${photo}" alt="Issue photo">
                    </div>
                `).join('')
                : `<div class="issue-photo">
                    <img src="https://picsum.photos/seed/${issue.category}${issue.id}/600/400.jpg" alt="Issue photo">
                </div>`
            }
        </div>
        <h3>${issue.title}</h3>
        <div class="issue-meta">
            <div class="issue-category">
                <i class="fas ${getIssueIcon(issue.category).options.html.replace(/<[^>]*>/g, '')}"></i>
                <span>${getCategoryName(issue.category)}</span>
            </div>
            <div class="issue-distance">
                <i class="fas fa-map-marker-alt"></i>
                <span>${distance} km away</span>
            </div>
            <div class="issue-reporter">
                <i class="fas fa-user"></i>
                <span>Reported by ${issue.reporter}</span>
            </div>
        </div>
        <div class="issue-description">${issue.description}</div>
        <div class="issue-timeline">
            <h4>Timeline</h4>
            ${issue.timeline.map(item => `
                <div class="timeline-item">
                    <div class="timeline-icon">
                        <i class="fas ${getTimelineIcon(item.status)}"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-date">${formatDate(item.date)}</div>
                        <div class="timeline-status">${getIssueStatus(item.status)}</div>
                        <div class="timeline-note">${item.note}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="issue-actions">
            ${currentUser && !isAdmin ? `
                <button class="btn btn-flag" onclick="flagIssue(${issue.id})">
                    <i class="fas fa-flag"></i>
                    Flag Issue
                </button>
            ` : ''}
            ${isAdmin ? `
                <button class="btn btn-primary" onclick="updateIssueStatus(${issue.id}, 'in-progress')">
                    <i class="fas fa-tools"></i>
                    Mark In Progress
                </button>
                <button class="btn btn-success" onclick="updateIssueStatus(${issue.id}, 'resolved')">
                    <i class="fas fa-check-circle"></i>
                    Mark Resolved
                </button>
            ` : ''}
        </div>
    `;
}

// Get timeline icon
function getTimelineIcon(status) {
    const icons = {
        'reported': 'fa-exclamation-circle',
        'in-progress': 'fa-tools',
        'resolved': 'fa-check-circle'
    };
    return icons[status] || 'fa-circle';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Flag issue
function flagIssue(issueId) {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;
    
    issue.flags++;
    saveDataToStorage();
    
    showNotification('Issue has been flagged for review', 'success');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(issueModal);
    modal.hide();
    
    // Update UI
    renderIssues();
    renderLiveIssues();
    
    if (adminPanel.style.display === 'block') {
        updateAdminStats();
        renderAllIssues();
    }
}

// Update issue status
function updateIssueStatus(issueId, newStatus) {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;
    
    issue.status = newStatus;
    issue.timeline.push({
        status: newStatus,
        date: new Date().toISOString(),
        note: `Status updated to ${getIssueStatus(newStatus)}`
    });
    
    saveDataToStorage();
    
    showNotification(`Issue status updated to ${getIssueStatus(newStatus)}`, 'success');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(issueModal);
    modal.hide();
    
    // Update UI
    renderIssues();
    renderLiveIssues();
    filterIssuesByLocation();
    
    if (adminPanel.style.display === 'block') {
        updateAdminStats();
        renderAllIssues();
    }
}

// Update admin stats
function updateAdminStats() {
    const totalIssues = issues.length;
    const reportedIssues = issues.filter(i => i.status === 'reported').length;
    const inProgressIssues = issues.filter(i => i.status === 'in-progress').length;
    const resolvedIssues = issues.filter(i => i.status === 'resolved').length;
    const flaggedIssues = issues.filter(i => i.flags > 0).length;
    const totalUsers = users.length;
    
    document.getElementById('totalIssues').textContent = totalIssues;
    document.getElementById('reportedIssues').textContent = reportedIssues;
    document.getElementById('inProgressIssues').textContent = inProgressIssues;
    document.getElementById('resolvedIssues').textContent = resolvedIssues;
    document.getElementById('flaggedIssues').textContent = flaggedIssues;
    document.getElementById('totalUsers').textContent = totalUsers;
}

// Render all issues in admin panel
function renderAllIssues() {
    allIssuesTable.innerHTML = '';
    
    if (issues.length === 0) {
        allIssuesTable.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No issues found</td>
            </tr>
        `;
        return;
    }
    
    issues.forEach(issue => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${issue.id}</td>
            <td>${issue.title}</td>
            <td>${getCategoryName(issue.category)}</td>
            <td><span class="badge bg-${getStatusColor(issue.status)}">${getIssueStatus(issue.status)}</span></td>
            <td>${issue.reporter}</td>
            <td>${issue.flags}</td>
            <td>
                <div class="admin-actions">
                    <button class="btn btn-primary btn-sm" onclick="showIssueDetail(${issue.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="updateIssueStatus(${issue.id}, 'in-progress')">
                        <i class="fas fa-tools"></i>
                    </button>
                    <button class="btn btn-success btn-sm" onclick="updateIssueStatus(${issue.id}, 'resolved')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteIssue(${issue.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        allIssuesTable.appendChild(row);
    });
}

// Get status color for badge
function getStatusColor(status) {
    const colors = {
        'reported': 'primary',
        'in-progress': 'warning',
        'resolved': 'success'
    };
    return colors[status] || 'secondary';
}

// Delete issue
function deleteIssue(issueId) {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    
    issues = issues.filter(i => i.id !== issueId);
    saveDataToStorage();
    
    showNotification('Issue deleted successfully', 'success');
    
    // Update UI
    renderIssues();
    renderLiveIssues();
    filterIssuesByLocation();
    
    if (adminPanel.style.display === 'block') {
        updateAdminStats();
        renderAllIssues();
    }
}

// Render users in admin panel
function renderUsers() {
    usersList.innerHTML = '';
    
    if (users.length === 0) {
        usersList.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-users text-muted"></i>
                <p class="text-muted mt-2">No users found</p>
            </div>
        `;
        return;
    }
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <div class="user-avatar-large">${user.name.charAt(0).toUpperCase()}</div>
            <div class="user-info">
                <div class="user-name">${user.name}</div>
                <div class="user-email">${user.email}</div>
                <div class="user-status ${user.banned ? 'banned' : ''}">
                    ${user.isAdmin ? 'Admin' : user.banned ? 'Banned' : 'Active User'}
                </div>
            </div>
            <div class="admin-actions">
                ${!user.banned ? `
                    <button class="btn btn-warning btn-sm" onclick="banUser(${user.id})">
                        <i class="fas fa-ban"></i>
                    </button>
                ` : `
                    <button class="btn btn-success btn-sm" onclick="unbanUser(${user.id})">
                        <i class="fas fa-check"></i>
                    </button>
                `}
                ${!user.isAdmin ? `
                    <button class="btn btn-primary btn-sm" onclick="makeAdmin(${user.id})">
                        <i class="fas fa-user-shield"></i>
                    </button>
                ` : `
                    <button class="btn btn-secondary btn-sm" onclick="removeAdmin(${user.id})">
                        <i class="fas fa-user"></i>
                    </button>
                `}
            </div>
        `;
        usersList.appendChild(userCard);
    });
}

// Search users
function searchUsers() {
    const query = userSearchInput.value.toLowerCase().trim();
    
    if (!query) {
        renderUsers();
        return;
    }
    
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
    );
    
    usersList.innerHTML = '';
    
    if (filteredUsers.length === 0) {
        usersList.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-search text-muted"></i>
                <p class="text-muted mt-2">No users match your search</p>
            </div>
        `;
        return;
    }
    
    filteredUsers.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <div class="user-avatar-large">${user.name.charAt(0).toUpperCase()}</div>
            <div class="user-info">
                <div class="user-name">${user.name}</div>
                <div class="user-email">${user.email}</div>
                <div class="user-status ${user.banned ? 'banned' : ''}">
                    ${user.isAdmin ? 'Admin' : user.banned ? 'Banned' : 'Active User'}
                </div>
            </div>
            <div class="admin-actions">
                ${!user.banned ? `
                    <button class="btn btn-warning btn-sm" onclick="banUser(${user.id})">
                        <i class="fas fa-ban"></i>
                    </button>
                ` : `
                    <button class="btn btn-success btn-sm" onclick="unbanUser(${user.id})">
                        <i class="fas fa-check"></i>
                    </button>
                `}
                ${!user.isAdmin ? `
                    <button class="btn btn-primary btn-sm" onclick="makeAdmin(${user.id})">
                        <i class="fas fa-user-shield"></i>
                    </button>
                ` : `
                    <button class="btn btn-secondary btn-sm" onclick="removeAdmin(${user.id})">
                        <i class="fas fa-user"></i>
                    </button>
                `}
            </div>
        `;
        usersList.appendChild(userCard);
    });
}

// Ban user
function banUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (!confirm(`Are you sure you want to ban ${user.name}?`)) return;
    
    user.banned = true;
    saveDataToStorage();
    
    showNotification(`${user.name} has been banned`, 'success');
    
    // Update UI
    renderUsers();
}

// Unban user
function unbanUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (!confirm(`Are you sure you want to unban ${user.name}?`)) return;
    
    user.banned = false;
    saveDataToStorage();
    
    showNotification(`${user.name} has been unbanned`, 'success');
    
    // Update UI
    renderUsers();
}

// Make admin
function makeAdmin(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (!confirm(`Are you sure you want to make ${user.name} an admin?`)) return;
    
    user.isAdmin = true;
    saveDataToStorage();
    
    showNotification(`${user.name} is now an admin`, 'success');
    
    // Update UI
    renderUsers();
}

// Remove admin
function removeAdmin(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (!confirm(`Are you sure you want to remove admin privileges from ${user.name}?`)) return;
    
    user.isAdmin = false;
    saveDataToStorage();
    
    showNotification(`${user.name} is no longer an admin`, 'success');
    
    // Update UI
    renderUsers();
}

// Show notification
function showNotification(message, type = 'success') {
    const notificationEl = document.getElementById('notification');
    const notificationTitle = notificationEl.querySelector('.notification-title');
    const notificationMessage = notificationEl.querySelector('.notification-message');
    const notificationIcon = notificationEl.querySelector('.notification-icon i');
    
    // Set notification content
    notificationTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    notificationMessage.textContent = message;
    
    // Set notification icon and color
    notificationEl.className = 'notification';
    notificationEl.classList.add(type);
    
    switch(type) {
        case 'success':
            notificationIcon.className = 'fas fa-check-circle';
            break;
        case 'error':
            notificationIcon.className = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            notificationIcon.className = 'fas fa-exclamation-triangle';
            break;
        case 'info':
            notificationIcon.className = 'fas fa-info-circle';
            break;
    }
    
    // Show notification
    notificationEl.classList.add('show');
    
    // Hide notification after 5 seconds
    setTimeout(() => {
        notificationEl.classList.remove('show');
    }, 5000);
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);