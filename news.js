let globalNewsData = [];

document.addEventListener('DOMContentLoaded', () => {
    const newsGrid = document.getElementById('news-grid');
    const loadingEl = document.getElementById('news-loading');
    const searchInput = document.getElementById('searchInput');
    
    if (!newsGrid) return;
    
    // We are using a reliable, free placeholder API for top headlines
    // (Saurav's NewsAPI mock hosted on GitHub pages)
    const API_URL = 'https://saurav.tech/NewsAPI/top-headlines/category/general/us.json';
    
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            if(loadingEl) loadingEl.style.display = 'none';
            
            if (data && data.articles) {
                // Filter out broken articles
                globalNewsData = data.articles.filter(article => article.title && article.urlToImage);
                renderNews(globalNewsData);
            }
        })
        .catch(err => {
            console.error("Error fetching news:", err);
            if(loadingEl) loadingEl.style.display = 'none';
            newsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: var(--text-secondary);">Unable to load top headlines at this time.</div>';
        });

    // Handle search filtering
    if(searchInput) {
        // Remove the old listener from script.js and add our own for this page
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        newSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filteredNews = globalNewsData.filter(article => {
                const titleMatch = article.title && article.title.toLowerCase().includes(query);
                const sourceMatch = article.source && article.source.name && article.source.name.toLowerCase().includes(query);
                return titleMatch || sourceMatch;
            });
            renderNews(filteredNews, query);
        });
    }
});

function renderNews(articlesToRender, query = '') {
    const newsGrid = document.getElementById('news-grid');
    if(!newsGrid) return;
    
    newsGrid.innerHTML = '';
    
    if(articlesToRender.length === 0) {
        newsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: var(--text-secondary);">No news found matching your search.</div>';
        return;
    }
    
    // Render up to 20 articles
    articlesToRender.slice(0, 20).forEach((article, index) => {
        const delay = index * 0.05;
        const dateStr = new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        // Highlight matching text if searching (optional but nice)
        let titleHtml = article.title;
        if(query) {
            const regex = new RegExp(`(${query})`, 'gi');
            titleHtml = article.title.replace(regex, '<span style="background: rgba(96, 165, 250, 0.3);">$1</span>');
        }
        
        const cardHTML = `
            <div class="grid-card" onclick="window.open('${article.url}', '_blank')" style="animation-delay: ${delay}s">
                <img src="${article.urlToImage}" alt="News Image" onerror="this.src='newspaper_delivery_blue.png'">
                <div class="grid-content" style="text-align: left; padding: 1.25rem;">
                    <h3 class="news-card-title">${titleHtml}</h3>
                    <p class="news-card-source"><i class="ph ph-newspaper"></i> <span class="user-brand">${article.source.name || 'News'}</span> &bull; ${dateStr}</p>
                </div>
            </div>
        `;
        newsGrid.innerHTML += cardHTML;
    });
}
