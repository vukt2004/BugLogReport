document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const tabsContainer = document.getElementById('tabs');
    const contentsContainer = document.getElementById('tabContents');
    let currentTabContent = null;

    // Fetch data and initialize app
    fetch('bugs.json')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(initializeApp)
        .catch(handleError);

    function initializeApp(data) {
        // Remove loading state
        document.querySelector('.loading')?.remove();

        // Get unique cases
        const cases = [...new Set(data.map(bug => bug.Case))].filter(Boolean);
        
        // Create tabs and contents
        cases.forEach((caseName, index) => {
            const filtered = data.filter(b => b.Case === caseName);
            createTab(caseName, index === 0, filtered.length); // Truyền số lượng vào đây
            createTabContent(caseName, filtered, index === 0);
        });

        // Add tab switching logic
        tabsContainer.addEventListener('click', handleTabClick);
    }

    function createTab(caseName, isActive, caseCount) { // Thêm tham số caseCount
        const tabBtn = document.createElement('button');
        tabBtn.className = `tab ${isActive ? 'active' : ''}`;
        tabBtn.dataset.case = caseName;
        tabBtn.innerHTML = `
            <i class="fas fa-folder"></i>
            <span>${caseName}</span>
            <span class="tab-badge">${caseCount}</span> <!-- Sử dụng trực tiếp caseCount -->
        `;
        tabsContainer.appendChild(tabBtn);
    }

    function createTabContent(caseName, caseData, isActive) {
        const tabContent = document.createElement('div');
        tabContent.className = `tab-content ${isActive ? 'active' : ''}`;
        tabContent.id = `tab-${caseName}`;
        tabContent.innerHTML = caseData.length === 0 ? getEmptyStateHTML() : getTableHTML(caseData);
        
        if (caseData.length > 0) {
            setTimeout(() => initializeTableFeatures(tabContent, caseData), 0);
        }
        
        contentsContainer.appendChild(tabContent);
    }

    function initializeTableFeatures(tabContent, caseData) {
        const filterButtons = tabContent.querySelectorAll('.filter-btn');
        const tableRows = tabContent.querySelectorAll('tbody tr');
        const countBadge = tabContent.querySelector('.count-badge');
        const searchInput = tabContent.querySelector('.search-input');
        const clearSearch = tabContent.querySelector('.clear-search');

        let currentFilter = 'all';
        let currentSearch = '';

        // Event Listeners
        searchInput.addEventListener('input', handleSearch);
        clearSearch.addEventListener('click', clearSearchHandler);
        filterButtons.forEach(btn => btn.addEventListener('click', handleFilter));

        function handleSearch(e) {
            currentSearch = e.target.value.trim();
            clearSearch.classList.toggle('show', currentSearch.length > 0);
            applyFilters();
        }

        function clearSearchHandler() {
            searchInput.value = '';
            currentSearch = '';
            clearSearch.classList.remove('show');
            applyFilters();
            searchInput.focus();
        }

        function handleFilter(e) {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            applyFilters();
        }

        function applyFilters() {
            let visibleCount = 0;

            tableRows.forEach(row => {
                const rowStatus = row.dataset.status;
                const rowText = row.textContent.toLowerCase();
                const statusMatch = currentFilter === 'all' || rowStatus === currentFilter;
                const searchMatch = !currentSearch || rowText.includes(currentSearch.toLowerCase());

                row.style.display = statusMatch && searchMatch ? '' : 'none';
                if (statusMatch && searchMatch) visibleCount++;

                // Highlight handling
                const cells = row.querySelectorAll('td:not(.status)');
                cells.forEach(cell => {
                    if (currentSearch) {
                        const original = cell.dataset.originalText || cell.textContent;
                        cell.dataset.originalText = original;
                        cell.innerHTML = highlightText(original, currentSearch);
                    } else {
                        cell.innerHTML = cell.dataset.originalText || cell.textContent;
                    }
                });
            });

            updateResultsCount(visibleCount, caseData.length);
            handleEmptyState(visibleCount, tabContent);
        }

        function updateResultsCount(visible, total) {
            countBadge.textContent = `${visible}/${total}`;
        }

        function handleEmptyState(visibleCount, tabContent) {
            const tableContainer = tabContent.querySelector('.table-container');
            const existingEmpty = tabContent.querySelector('.filter-empty-state');

            if (visibleCount === 0 && !existingEmpty) {
                tableContainer.appendChild(createEmptyState());
                tableContainer.querySelector('table').style.display = 'none';
            } else if (visibleCount > 0 && existingEmpty) {
                existingEmpty.remove();
                tableContainer.querySelector('table').style.display = 'table';
            }
        }

        // Initial filter
        applyFilters();
    }

    function highlightText(text, search) {
        if (!search) return text;
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearch})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    function handleTabClick(e) {
        const tabBtn = e.target.closest('.tab');
        if (!tabBtn) return;

        // Switch active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tabBtn.classList.add('active');

        // Switch active content
        const caseName = tabBtn.dataset.case;
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-${caseName}`).classList.add('active');
    }

    function handleError(err) {
        document.querySelector('.loading')?.remove();
        const errorHTML = `
            <div class="error">
                <div class="error-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    Lỗi tải dữ liệu
                </div>
                <p>${err.message}</p>
                <p>Vui lòng kiểm tra lại đường dẫn file bugs.json</p>
            </div>
        `;
        contentsContainer.innerHTML = errorHTML;
        console.error('Error:', err);
    }

    // HTML Templates
    function getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-clipboard-check"></i>
                <h3>Không có bug nào</h3>
                <p>Test case này chưa có bug được ghi nhận.</p>
            </div>
        `;
    }

    function createEmptyState() {
        const div = document.createElement('div');
        div.className = 'filter-empty-state empty-state';
        div.innerHTML = `
            <i class="fas fa-search"></i>
            <h3>Không tìm thấy kết quả</h3>
            <p>Không có dữ liệu phù hợp với điều kiện tìm kiếm</p>
        `;
        return div;
    }

    function getTableHTML(data) {
        return `
            <div class="filter-section">
                ${getFilterControls()}
            </div>
            <div class="table-container">
                <table>
                    <thead>${getTableHeader()}</thead>
                    <tbody class="table-body">${getTableBody(data)}</tbody>
                </table>
            </div>
        `;
    }

    function getFilterControls() {
        return `
            <div class="filter-row">
                <div class="filter-left">
                    <div class="search-group">
                        <div class="filter-label">
                            <i class="fas fa-search"></i>
                            Tìm kiếm:
                        </div>
                        <div class="search-container">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" class="search-input" placeholder="Tìm kiếm theo ID, mô tả...">
                            <i class="fas fa-times clear-search" title="Xóa tìm kiếm"></i>
                        </div>
                    </div>
                    <div class="filter-group">
                        <div class="filter-label">
                            <i class="fas fa-filter"></i>
                            Lọc theo trạng thái:
                        </div>
                        <div class="filter-buttons">
                            ${['all', 'Bug', 'Fix'].map(type => `
                                <button class="filter-btn filter-${type} ${type === 'all' ? 'active' : ''}" 
                                        data-filter="${type}">
                                    <i class="${getFilterIcon(type)}"></i>
                                    ${type === 'all' ? 'Tất cả' : type === 'Bug' ? 'Bug' : 'Đã sửa'}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="results-count">
                    <i class="fas fa-chart-bar"></i>
                    Hiển thị: <span class="count-badge">0</span>
                </div>
            </div>
        `;
    }

    function getFilterIcon(type) {
        return {
            all: 'fas fa-list',
            Bug: 'fas fa-bug',
            Fix: 'fas fa-check-circle'
        }[type];
    }

    function getTableHeader() {
        return `
            <tr>
                <th><i class="fas fa-hashtag"></i> ID</th>
                <th><i class="fas fa-file-alt"></i> Mô tả</th>
                <th><i class="fas fa-exclamation-triangle"></i> Lý do</th>
                <th><i class="fas fa-image"></i> Hình ảnh</th>
                <th><i class="fas fa-flag"></i> Trạng thái</th>
                <th><i class="fas fa-calendar-alt"></i> Ngày log</th>
            </tr>
        `;
    }

    function getTableBody(data) {
        return data.map(bug => `
            <tr data-status="${bug.Status}">
                <td><strong>${bug.ID || '—'}</strong></td>
                <td>${bug.Description || '—'}</td>
                <td>${bug.Reason || '—'}</td>
                <td>${getImageLink(bug.Image, bug.TestID)}</td>
                <td>${getStatusBadge(bug.Status)}</td>
                <td>${bug.Date || '—'}</td>
            </tr>
        `).join('');
    }

    function getImageLink(image, testId) {
        return image ? `
            <a href="${image}" target="_blank" class="image-link">
                <i class="fas fa-external-link-alt"></i>
                ${testId || 'Xem ảnh'}
            </a>
        ` : '<span style="color: var(--gray-400);">—</span>';
    }

    function getStatusBadge(status) {
        const isBug = status === 'Bug';
        return `
            <span class="status ${isBug ? 'status-bug' : 'status-fix'}">
                <span class="status-icon"></span>
                ${status || '—'}
            </span>
        `;
    }
});