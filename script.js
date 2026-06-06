//  DOM Elements 
const searchInput = document.getElementById('searchInput');
const searchBtn   = document.getElementById('searchBtn');
const errorMsg    = document.getElementById('errorMsg');
const loader      = document.getElementById('loader');
const results     = document.getElementById('results');

// Profile elements
const avatar          = document.getElementById('avatar');
const profileName     = document.getElementById('profileName');
const profileUsername = document.getElementById('profileUsername');
const profileBio      = document.getElementById('profileBio');
const profileLocation = document.getElementById('profileLocation');
const locationText    = document.getElementById('locationText');
const profileBlog     = document.getElementById('profileBlog');
const blogText        = document.getElementById('blogText');
const statRepos       = document.getElementById('statRepos');
const statFollowers   = document.getElementById('statFollowers');
const statFollowing   = document.getElementById('statFollowing');

// Sections
const langStats  = document.getElementById('langStats');
const repoGrid   = document.getElementById('repoGrid');
const repoCount  = document.getElementById('repoCount');


//  Language Color Map 
const langColorMap = {
  Java:       '#b07219',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python:     '#3572A5',
  HTML:       '#e34c26',
  CSS:        '#563d7c',
  Go:         '#00ADD8',
  Rust:       '#dea584',
  C:          '#555555',
  'C++':      '#f34b7d',
  Shell:      '#89e051',
  Kotlin:     '#A97BFF',
  Swift:      '#F05138',
  Ruby:       '#701516',
  PHP:        '#4F5D95',
};

function getLangColor(lang) {
  return langColorMap[lang] || '#6e7681';
}


//  Utility: Format large numbers 
function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n;
}


//  Show / Hide Helpers 
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }


//  Main Search Handler 
async function handleSearch() {
  const username = searchInput.value.trim();

  if (!username) {
    searchInput.focus();
    return;
  }

  // Reset UI
  hide(results);
  hide(errorMsg);
  show(loader);
  searchBtn.disabled = true;

  try {
    // Fetch profile + repos in parallel
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=12`)
    ]);

    // Handle user not found
    if (!userRes.ok) {
      throw new Error('User not found');
    }

    const user  = await userRes.json();
    const repos = await reposRes.json();

    renderProfile(user);
    renderLanguages(repos);
    renderRepos(repos);

    hide(loader);
    show(results);

  } catch (err) {
    hide(loader);
    show(errorMsg);
  } finally {
    searchBtn.disabled = false;
  }
}


//  Render Profile Card 
function renderProfile(user) {
  avatar.src            = user.avatar_url;
  avatar.alt            = user.login;
  profileName.textContent     = user.name || user.login;
  profileUsername.textContent = '@' + user.login;
  profileBio.textContent      = user.bio || '';
  statRepos.textContent       = formatNum(user.public_repos);
  statFollowers.textContent   = formatNum(user.followers);
  statFollowing.textContent   = formatNum(user.following);

  // Location
  if (user.location) {
    locationText.textContent = user.location;
    show(profileLocation);
  } else {
    hide(profileLocation);
  }

  // Blog / Website
  if (user.blog) {
    const url = user.blog.startsWith('http') ? user.blog : 'https://' + user.blog;
    profileBlog.href        = url;
    blogText.textContent    = user.blog;
    show(profileBlog);
  } else {
    hide(profileBlog);
  }
}


//  Render Language Stats 
function renderLanguages(repos) {
  // Count repos per language
  const langCount = {};
  repos.forEach(repo => {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] || 0) + 1;
    }
  });

  // Sort by count descending
  const sorted = Object.entries(langCount).sort((a, b) => b[1] - a[1]);

  langStats.innerHTML = '';

  if (sorted.length === 0) {
    langStats.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;">No language data available.</span>';
    return;
  }

  sorted.forEach(([lang, count]) => {
    const tag = document.createElement('div');
    tag.className = 'lang-tag';
    tag.innerHTML = `
      <span class="lang-dot" style="background:${getLangColor(lang)}"></span>
      <span>${lang}</span>
      <span class="lang-count">${count}</span>
    `;
    langStats.appendChild(tag);
  });
}


//  Render Repo Cards 
function renderRepos(repos) {
  repoGrid.innerHTML = '';
  repoCount.textContent = repos.length;

  if (repos.length === 0) {
    repoGrid.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;">No public repositories found.</p>';
    return;
  }

  repos.forEach(repo => {
    const card = document.createElement('a');
    card.className  = 'repo-card';
    card.href       = repo.html_url;
    card.target     = '_blank';
    card.rel        = 'noopener noreferrer';

    const langDot = repo.language
      ? `<span class="lang-dot" style="background:${getLangColor(repo.language)}"></span><span>${repo.language}</span>`
      : '';

    card.innerHTML = `
      <div class="repo-name">${repo.name}</div>
      <div class="repo-desc">${repo.description || 'No description provided.'}</div>
      <div class="repo-footer">
        <span class="repo-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          ${repo.stargazers_count}
        </span>
        <span class="repo-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/>
            <circle cx="6" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
            <path d="M18 9a9 9 0 0 1-9 9"/>
          </svg>
          ${repo.forks_count}
        </span>
        <span class="repo-lang">${langDot}</span>
      </div>
    `;

    repoGrid.appendChild(card);
  });
}


//  Event Listeners 
searchBtn.addEventListener('click', handleSearch);

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});