let archivesData = [];
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTgJKYgoLswW4eQnqlJHHmuzXdFMILNLHFDzGsOWsOpG0ynJ7xKlpc8hdgU4IjZ-1o7jcQsdXpTyiUY/pub?output=csv";
const FALLBACK_IMAGE = "newspaper_delivery_blue.png";

// Parse DD/MM/YYYY or DD-MM-YYYY date strings from Google Sheets / Excel
function parseDate(dateStr) {
    if (!dateStr) return new Date(NaN);
    if (typeof dateStr === 'string') {
        const separator = dateStr.includes('/') ? '/' : dateStr.includes('-') ? '-' : null;
        if (separator) {
            const parts = dateStr.split(separator);
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2].substring(0, 4);
                return new Date(`${year}-${month}-${day}T00:00:00`);
            }
        }
    }
    return new Date(dateStr);
}

// Format date to "04/07/2026" (DD/MM/YYYY)
function formatFullDate(dateStr) {
    const date = parseDate(dateStr);
    if(isNaN(date)) return dateStr;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format readable date "July 03, 2026"
function formatReadableDate(dateStr) {
    const date = parseDate(dateStr);
    if(isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
}

// Render data to DOM
function renderArchives() {
    const gridContainer = document.getElementById('archives-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';
    
    // Sort data by date descending
    archivesData.sort((a, b) => parseDate(b.Date) - parseDate(a.Date));
    
    if (archivesData.length > 0) {
        // Group by date
        const groupedData = {};
        archivesData.forEach(item => {
            const dateKey = item.Date || item.date;
            if (!dateKey) return;
            if (!groupedData[dateKey]) {
                groupedData[dateKey] = [];
            }
            groupedData[dateKey].push(item);
        });
        
        // Store global reference to groupedData
        window.groupedData = groupedData;
        renderDashboard('');
    } else {
        gridContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 4rem 2rem;">
                <i class="ph-fill ph-clock-counter-clockwise" style="font-size: 4rem; color: var(--brand-blue); margin-bottom: 1rem; filter: drop-shadow(0 10px 15px rgba(32,53,86,0.2));"></i>
                <h3 style="font-family: var(--font-serif); font-size: 2rem; color: var(--text-primary); margin-bottom: 0.5rem;">Archives Coming Soon</h3>
                <p style="color: var(--text-secondary); font-size: 1.1rem;">We are currently digitizing and curating this collection. Please check back later!</p>
            </div>
        `;
    }
}

function renderDashboard(query = '') {
    const grid = document.getElementById('archives-grid');
    if (!grid || !window.groupedData) return;
    
    grid.innerHTML = '';
    const q = query.toLowerCase();
    const sortedDates = Object.keys(window.groupedData).sort((a, b) => parseDate(b) - parseDate(a));
    
    let hasResults = false;
    let cardIndex = 0;
    
    sortedDates.forEach((date) => {
        const papers = window.groupedData[date];
        const matchesDate = date.toLowerCase().includes(q) || formatFullDate(date).toLowerCase().includes(q) || formatReadableDate(date).toLowerCase().includes(q);
        const matchesPapers = papers.some(p => {
            const name = p.Name || p.name || '';
            const region = p.Region || p.region || '';
            return name.toLowerCase().includes(q) || region.toLowerCase().includes(q);
        });
        
        if (matchesDate || matchesPapers) {
            hasResults = true;
            const delay = cardIndex * 0.1;
            cardIndex++;
            
            const cardHTML = `
                <div class="grid-card" onclick="openDateModal('${date}')" style="animation-delay: ${delay}s">
                    <img src="${FALLBACK_IMAGE}" alt="ePaper">
                    <div class="grid-content">
                        <h3>DATE - ${formatFullDate(date)}</h3>
                        <p><i class="ph ph-user-circle"></i> <span class="user-brand">The Archive</span> - ${formatReadableDate(date)}</p>
                    </div>
                </div>
            `;
            grid.innerHTML += cardHTML;
        }
    });
    
    if(!hasResults) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: var(--text-secondary);">No results found.</div>';
    }
}

// UI Interactions
document.addEventListener('DOMContentLoaded', () => {
    // Sidebar
    const menuBtn = document.getElementById('menuBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    const toggleSidebar = () => {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    };
    
    if(menuBtn) menuBtn.addEventListener('click', toggleSidebar);
    if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
    if(sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);
    
    // Search
    const searchBtn = document.getElementById('searchBtn');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchInput');
    
    const toggleSearch = () => {
        searchOverlay.classList.toggle('active');
        if(searchOverlay.classList.contains('active')) {
            setTimeout(() => searchInput.focus(), 100);
        }
    };
    
    if(searchBtn) searchBtn.addEventListener('click', toggleSearch);
    if(closeSearchBtn) closeSearchBtn.addEventListener('click', toggleSearch);
    if(searchOverlay) searchOverlay.addEventListener('click', (e) => {
        if(e.target === searchOverlay) toggleSearch();
    });
    
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderDashboard(e.target.value);
        });
    }

    // Theme Toggle Logic
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn ? themeBtn.querySelector('i') : null;
    
    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    if(savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if(themeIcon) themeIcon.className = 'ph ph-sun';
    }
    
    if(themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if(isDark) {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if(themeIcon) themeIcon.className = 'ph ph-moon';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if(themeIcon) themeIcon.className = 'ph ph-sun';
            }
        });
    }
});

// Function to open the papers modal for a specific date
window.openDateModal = function(dateStr) {
    const papersModal = document.getElementById('papers-modal');
    const modalTitle = document.getElementById('papers-modal-title');
    const modalList = document.getElementById('papers-modal-list');
    
    modalTitle.textContent = `Papers for ${formatReadableDate(dateStr)}`;
    modalList.innerHTML = '';
    
    const papers = archivesData.filter(item => (item.Date || item.date) === dateStr);
    
    papers.forEach((item, index) => {
        const btnClass = 'btn-primary';
        const name = item.Name || item.name || 'Unknown Paper';
        const region = item.Region || item.region || '';
        const url = item.URL || item.url || '#';
        
        const cardHTML = `
            <div class="archive-card" style="margin-bottom: 1rem;">
                <div class="archive-header" style="margin-bottom: 0.5rem;">
                    <div>
                        <h3 class="archive-title" style="font-size: 1.1rem;">${name}</h3>
                        <p class="archive-region">${region}</p>
                    </div>
                </div>
                <button class="${btnClass}" onclick="window.open('${url}', '_blank')">Download / View Paper</button>
            </div>
        `;
        modalList.insertAdjacentHTML('beforeend', cardHTML);
    });
    
    papersModal.classList.add('active');
}

// Fetch from Google Sheets via PapaParse
function fetchData() {
    Papa.parse(SHEET_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log("Parsed data:", results.data);
            // Filter out rows that don't have a URL link provided
            archivesData = results.data.filter(item => {
                const url = item.URL || item.url;
                return url && url.trim() !== '';
            });
            renderArchives();
        },
        error: function(error) {
            console.error("Error fetching CSV:", error);
            document.getElementById('archives-grid').innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 4rem 2rem;">
                    <i class="ph-fill ph-clock-counter-clockwise" style="font-size: 4rem; color: var(--brand-blue); margin-bottom: 1rem; filter: drop-shadow(0 10px 15px rgba(32,53,86,0.2));"></i>
                    <h3 style="font-family: var(--font-serif); font-size: 2rem; color: var(--text-primary); margin-bottom: 0.5rem;">Archives Coming Soon</h3>
                    <p style="color: var(--text-secondary); font-size: 1.1rem;">We are currently digitizing and curating this collection. Please check back later!</p>
                </div>
            `;
        }
    });
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    // Fetch Data
    fetchData();
    

    // Papers modal logic
    const papersModal = document.getElementById('papers-modal');
    const closePapersModal = document.getElementById('close-papers-modal');
    
    if(closePapersModal) {
        closePapersModal.addEventListener('click', () => {
            papersModal.classList.remove('active');
        });
    }
    
    if(papersModal) {
        papersModal.addEventListener('click', (e) => {
            if (e.target === papersModal) {
                papersModal.classList.remove('active');
            }
        });
    }
});
