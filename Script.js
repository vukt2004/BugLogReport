// script.js

// Global variables
let bugData = []; // Will be loaded from JSON file
let currentData = [];
let currentTab = 'all';

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const statusSort = document.getElementById('statusSort');
const typeSort = document.getElementById('typeSort');
const bugTableBody = document.getElementById('bugTableBody');
const tabButtons = document.querySelectorAll('.tab-button');
const noResults = document.getElementById('noResults');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    showLoading();
    loadDataFromJSON()
        .then(() => {
            hideLoading();
            renderTable(currentData);
            setupEventListeners();
        })
        .catch(error => {
            hideLoading();
            showError('Không thể tải dữ liệu: ' + error.message);
        });
});

// Load data from JSON file
async function loadDataFromJSON() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        bugData = jsonData.bugData || jsonData; // Support both formats
        currentData = [...bugData];
        
        // Update tabs based on available cases
        updateTabsFromData();
        
        console.log('Data loaded successfully:', bugData.length + ' records');
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to sample data if JSON file is not available
        bugData = getSampleData();
        currentData = [...bugData];
        throw error;
    }
}

// Fallback sample data
function getSampleData() {
    return [
        {
            id: "B01",
            testid: "TC-UI2",
            description: "Login Test - Đăng nhập vào hệ thống thông qua email/password không đúng",
            reason: "Thông báo trả về không đúng",
            type: "Thông báo",
            source: "TC01-05.png",
            status: "Bug",
            date: "21/05/2025",
            case: "Login",
            devFix: false
        },
        {
            id: "B02",
            testid: "TC-UI3",
            description: "UI Test - Giao diện không responsive trên mobile",
            reason: "Layout bị vỡ khi thu nhỏ màn hình",
            type: "UI/UX",
            source: "TC02-01.png",
            status: "Fixed",
            date: "20/05/2025",
            case: "UI",
            devFix: true
        },
        {
            id: "B03",
            testid: "TC-PERF1",
            description: "Performance Test - Trang web load chậm",
            reason: "Database query không được optimize",
            type: "Performance",
            source: "PERF-01.mp4",
            status: "In Progress",
            date: "19/05/2025",
            case: "Performance",
            devFix: false
        }
    ];
}

// Update tabs and sort options based on available data
function updateTabsFromData() {
    const cases = [...new Set(bugData.map(bug => bug.case))];
    const types = [...new Set(bugData.map(bug => bug.type))];
    const statuses = [...new Set(bugData.map(bug => bug.status))];
    
    // Update tabs
    const tabsContainer = document.querySelector('.tabs');
    tabsContainer.innerHTML = '<button class="tab-button active" data-case="all">Tất cả</button>';
    
    cases.forEach(caseType => {
        const button = document.createElement('button');
        button.className = 'tab-button';
        button.setAttribute('data-case', caseType);
        button.textContent = caseType;
        tabsContainer.appendChild(button);
    });
    
    // Update Type sort options
    const typeSort = document.getElementById('typeSort');
    typeSort.innerHTML = '<option value="">Sắp xếp theo Type</option>';
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSort.appendChild(option);
    });
    
    // Update Status sort options
    const statusSort = document.getElementById('statusSort');
    statusSort.innerHTML = '<option value="">Sắp xếp theo Status</option>';
    statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        statusSort.appendChild(option);
    });
    
    // Re-attach event listeners for new tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', handleTabClick);
    });
}

// Show loading indicator
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.innerHTML = `
        <div style="text-align: center; padding: 40px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 15px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">
            <div class="loading"></div>
            <p style="margin-top: 20px; color: #64748b; font-size: 16px;">Đang tải dữ liệu...</p>
        </div>
    `;
    document.querySelector('.container').appendChild(loadingDiv);
}

// Hide loading indicator
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.remove();
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="text-align: center; padding: 40px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 15px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); border-left: 4px solid #ef4444;">
            <h3 style="color: #ef4444; margin-bottom: 10px;">❌ Lỗi tải dữ liệu</h3>
            <p style="color: #64748b; font-size: 16px;">${message}</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 10px;">Vui lòng kiểm tra file data.json và thử lại.</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer;">Thử lại</button>
        </div>
    `;
    document.querySelector('.container').appendChild(errorDiv);
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    searchBtn.addEventListener('click', handleSearch);
    
    // Sort functionality
    statusSort.addEventListener('change', handleSort);
    typeSort.addEventListener('change', handleSort);
    
    // Tab functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabClick);
    });
    
    // Enter key for search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// Handle search functionality
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    let filteredData = bugData.filter(bug => {
        return (
            bug.id.toLowerCase().includes(searchTerm) ||
            bug.testid.toLowerCase().includes(searchTerm) ||
            bug.description.toLowerCase().includes(searchTerm) ||
            bug.reason.toLowerCase().includes(searchTerm) ||
            bug.type.toLowerCase().includes(searchTerm) ||
            bug.status.toLowerCase().includes(searchTerm) ||
            bug.case.toLowerCase().includes(searchTerm)
        );
    });
    
    // Apply current tab filter
    if (currentTab !== 'all') {
        filteredData = filteredData.filter(bug => bug.case === currentTab);
    }
    
    currentData = filteredData;
    renderTable(currentData);
}

// Handle sorting
function handleSort() {
    const statusValue = statusSort.value;
    const typeValue = typeSort.value;
    
    let sortedData = [...currentData];
    
    if (statusValue) {
        sortedData = sortedData.filter(bug => bug.status === statusValue);
    }
    
    if (typeValue) {
        sortedData = sortedData.filter(bug => bug.type === typeValue);
    }
    
    renderTable(sortedData);
}

// Handle tab clicks
function handleTabClick(e) {
    const selectedCase = e.target.getAttribute('data-case');
    
    // Update active tab
    tabButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    currentTab = selectedCase;
    
    // Filter data based on selected tab
    let filteredData = bugData;
    
    if (selectedCase !== 'all') {
        filteredData = bugData.filter(bug => bug.case === selectedCase);
    }
    
    // Apply search filter if exists
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filteredData = filteredData.filter(bug => {
            return (
                bug.id.toLowerCase().includes(searchTerm) ||
                bug.testid.toLowerCase().includes(searchTerm) ||
                bug.description.toLowerCase().includes(searchTerm) ||
                bug.reason.toLowerCase().includes(searchTerm) ||
                bug.type.toLowerCase().includes(searchTerm) ||
                bug.status.toLowerCase().includes(searchTerm) ||
                bug.case.toLowerCase().includes(searchTerm)
            );
        });
    }
    
    currentData = filteredData;
    renderTable(currentData);
    
    // Reset sort dropdowns
    statusSort.value = '';
    typeSort.value = '';
}

// Render table with data
function renderTable(data) {
    bugTableBody.innerHTML = '';
    
    if (data.length === 0) {
        document.querySelector('.table-container').style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    document.querySelector('.table-container').style.display = 'block';
    noResults.style.display = 'none';
    
    data.forEach((bug, index) => {
        const row = document.createElement('tr');
        row.style.animationDelay = `${index * 0.1}s`;
        
        row.innerHTML = `
            <td><strong>${bug.id}</strong></td>
            <td>${bug.testid}</td>
            <td class="description-cell">
                <div title="${bug.description}">
                    ${truncateText(bug.description, 1000)}
                </div>
            </td>
            <td class="reason-cell">
                <div title="${bug.reason}">
                    ${truncateText(bug.reason, 500)}
                </div>
            </td>
            <td>${bug.type}</td>
            <td>
                <a href="${bug.link}" target="blank" class="source-link" onclick="openSource('${bug.link}')">
                    📎 ${bug.source}
                </a>
            </td>
            <td>
                <span class="status-badge ${getStatusClass(bug.status)}">
                    ${bug.status}
                </span>
            </td>
            <td>${bug.date}</td>
            <td>
                <span class="case-tag">${bug.case}</span>
            </td>
            <td>
                <div class="checkbox-container">
                    <input 
                        type="checkbox" 
                        class="custom-checkbox" 
                        ${bug.devFix ? 'checked' : ''}
                        onchange="toggleDevFix('${bug.id}', this.checked)"
                    >
                </div>
            </td>
        `;
        
        bugTableBody.appendChild(row);
    });
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Helper function to get status class
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'bug':
            return 'status-bug';
        case 'fixed':
            return 'status-fixed';
        default:
            return 'status-bug';
    }
}

// Handle source link click
function openSource(sourceFile) {
    // In a real application, this would open the actual file
    // For demo purposes, we'll show an alert
    console.log(sourceFile);
}

// Handle dev fix checkbox toggle
function toggleDevFix(bugId, isChecked) {
    // Find and update the bug in the original data
    const bugIndex = bugData.findIndex(bug => bug.id === bugId);
    if (bugIndex !== -1) {
        bugData[bugIndex].devFix = isChecked;
    }
    
    // Show feedback to user
    const message = isChecked ? 
        `✅ Bug ${bugId} đã được đánh dấu là đã fix` : 
        `❌ Bug ${bugId} đã được bỏ đánh dấu fix`;
    
    showNotification(message);
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        z-index: 1000;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add slide in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Clear all filters
function clearFilters() {
    searchInput.value = '';
    statusSort.value = '';
    typeSort.value = '';
    
    // Reset to "All" tab
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-case="all"]').classList.add('active');
    currentTab = 'all';
    
    currentData = [...bugData];
    renderTable(currentData);
}

// Export functionality (optional)
function exportToCSV() {
    const headers = ['ID', 'Test ID', 'Description', 'Reason', 'Type', 'Source', 'Status', 'Date', 'Case', 'Dev Fix'];
    const csvContent = [
        headers.join(','),
        ...currentData.map(bug => [
            bug.id,
            bug.testId,
            `"${bug.description.replace(/"/g, '""')}"`,
            `"${bug.reason.replace(/"/g, '""')}"`,
            bug.type,
            bug.source,
            bug.status,
            bug.date,
            bug.case,
            bug.devFix ? 'Yes' : 'No'
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bug_log_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl + F to focus search
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        if (document.activeElement === searchInput) {
            clearFilters();
        }
    }
});

// Add export button to the header (optional enhancement)
document.addEventListener('DOMContentLoaded', function() {
    const controlsDiv = document.querySelector('.controls');
    const exportBtn = document.createElement('button');
    exportBtn.innerHTML = '📊 Export CSV';
    exportBtn.className = 'search-container button';
    exportBtn.style.cssText = `
        padding: 12px 16px;
        background: linear-gradient(135deg, #059669, #10b981);
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
        margin-left: 10px;
    `;
    exportBtn.onclick = exportToCSV;
    controlsDiv.appendChild(exportBtn);
});