     const TYPE_COLORS = {
        normal:'#A8A77A', fire:'#EE8130', water:'#6390F0', electric:'#F7D02C',
        grass:'#7AC74C', ice:'#96D9D6', fighting:'#C22E28', poison:'#A33EA1',
        ground:'#E2BF65', flying:'#A98FF3', psychic:'#F95587', bug:'#A6B91A',
        rock:'#B6A136', ghost:'#735797', dragon:'#6F35FC', dark:'#705746',
        steel:'#B7B7CE', fairy:'#D685AD'
    };

    const TYPE_PT = {
        normal:'Normal', fire:'Fogo', water:'Água', electric:'Elétrico',
        grass:'Planta', ice:'Gelo', fighting:'Lutador', poison:'Veneno',
        ground:'Terra', flying:'Voador', psychic:'Psíquico', bug:'Inseto',
        rock:'Pedra', ghost:'Fantasma', dragon:'Dragão', dark:'Sombrio',
        steel:'Aço', fairy:'Fada'
    };

    const STAT_NAMES = { hp:'HP', attack:'ATK', defense:'DEF', 'special-attack':'SP.A', 'special-defense':'SP.D', speed:'SPD' };
    const STAT_COLORS = { hp:'#E63946', attack:'#F77F00', defense:'#FCBF49', 'special-attack':'#6A994E', 'special-defense':'#2A9D8F', speed:'#00F5D4' };
    
    const MAX_POKEMON = 1025;
    let basePokemonList = [];
    let typeIndex = {};
    let pokemonCache = {};
    let activeTypeFilter = null;

    // ===== Fundo Tecnológico Canvas =====
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let gridOffset = 0;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }

    function initParticles() {
        particles = [];
        const count = Math.min(60, Math.floor(canvas.width * canvas.height / 20000));
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width, y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 0.5, alpha: Math.random() * 0.4 + 0.1,
                color: Math.random() > 0.5 ? '230,57,70' : '0,245,212'
            });
        }
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawBackground() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(26, 37, 64, 0.25)';
        ctx.lineWidth = 0.5;
        const gridSize = 60;
        gridOffset = (gridOffset + 0.1) % gridSize;

        for (let x = gridOffset; x < canvas.width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = gridOffset; y < canvas.height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        const grd = ctx.createRadialGradient(canvas.width/2, canvas.height/3, 0, canvas.width/2, canvas.height/3, canvas.width*0.5);
        grd.addColorStop(0, 'rgba(230,57,70,0.03)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color},${p.alpha})`; ctx.fill();
        });

        requestAnimationFrame(drawBackground);
    }
    drawBackground();

    // ===== Lógica do Botão de Filtro =====
    const filterToggle = document.getElementById('filterToggle');
    const typeFiltersWrapper = document.getElementById('typeFiltersWrapper');

    filterToggle.addEventListener('click', () => {
        typeFiltersWrapper.classList.toggle('active');
        filterToggle.classList.toggle('active');
    });

    // ===== Filtros de Tipo =====
    function createTypeFilters() {
        const container = document.getElementById('typeFilters');
        const allBtn = document.createElement('button');
        allBtn.className = 'type-btn active';
        allBtn.textContent = 'Todos';
        allBtn.style.background = 'rgba(255,255,255,0.1)';
        allBtn.style.color = '#E8ECF1';
        allBtn.dataset.type = 'all';
        allBtn.addEventListener('click', () => {
            activeTypeFilter = null;
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            filterAndRender();
        });
        container.appendChild(allBtn);

        Object.entries(TYPE_COLORS).forEach(([type, color]) => {
            const btn = document.createElement('button');
            btn.className = 'type-btn';
            btn.textContent = TYPE_PT[type];
            btn.style.background = color;
            btn.dataset.type = type;
            btn.addEventListener('click', () => {
                activeTypeFilter = type;
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterAndRender();
            });
            container.appendChild(btn);
        });
    }
    createTypeFilters();

    // ===== Pokeball SVG =====
    function pokeballSVG() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="4"/>
            <line x1="2" y1="50" x2="98" y2="50" stroke="currentColor" stroke-width="4"/>
            <circle cx="50" cy="50" r="14" fill="none" stroke="currentColor" stroke-width="4"/>
        </svg>`;
    }

    // ===== Inicialização =====
    async function initPokedex() {
        try {
            const listRes = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMON}&offset=0`);
            const listData = await listRes.json();
            basePokemonList = listData.results.map((p, i) => ({
                id: i + 1,
                name: p.name
            }));

            renderBaseCards();

            const typeKeys = Object.keys(TYPE_COLORS);
            Promise.all(typeKeys.map(type => 
                fetch(`https://pokeapi.co/api/v2/type/${type}`)
                    .then(r => r.json())
                    .then(data => {
                        typeIndex[type] = data.pokemon.map(p => {
                            const urlParts = p.pokemon.url.split('/');
                            return parseInt(urlParts[urlParts.length - 2]);
                        }).filter(id => id <= MAX_POKEMON);
                    })
                    .catch(() => {})
            )).then(() => {
                document.getElementById('counter').textContent = `${MAX_POKEMON} POKÉMON CARREGADOS`;
            });

        } catch (error) {
            console.error("Erro ao carregar a Pokédex:", error);
        }
    }

    // ===== Renderizar Cards =====
    function renderBaseCards() {
        const grid = document.getElementById('cardGrid');
        grid.innerHTML = '';
        
        basePokemonList.forEach(poke => {
            const card = document.createElement('article');
            card.className = 'poke-card';
            card.dataset.id = poke.id;
            card.dataset.loaded = 'false';
            card.setAttribute('tabindex', '0');

            const artworkUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${poke.id}.png`;
            const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id}.png`;

            card.innerHTML = `
                <div class="card-glare"></div>
                <div class="pokeball-watermark" style="color:var(--muted)">${pokeballSVG()}</div>
                <div class="poke-number">#${String(poke.id).padStart(3, '0')}</div>
                <div class="poke-img-container">
                    <div class="poke-img-bg"></div>
                    <img class="poke-img" src="${fallbackUrl}" data-artwork="${artworkUrl}" alt="${poke.name}" loading="lazy" onerror="this.src='${fallbackUrl}'">
                </div>
                <div class="poke-name">${poke.name}</div>
                <div class="poke-types" id="types-${poke.id}">
                    <div class="skeleton-badge"></div><div class="skeleton-badge"></div>
                </div>
            `;

            card.addEventListener('click', () => openModal(poke.id));
            card.addEventListener('keydown', (e) => { if (e.key === 'Enter') openModal(poke.id); });
            card.addEventListener('mousemove', (e) => handleTilt(e, card));
            card.addEventListener('mouseleave', () => resetTilt(card));

            grid.appendChild(card);
        });

        setupLazyLoad();
    }

    // ===== Lazy Load =====
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                if (card.dataset.loaded === 'false') {
                    loadCardData(card.dataset.id);
                    observer.unobserve(card);
                }
            }
        });
    }, { rootMargin: '300px' });

    function setupLazyLoad() {
        document.querySelectorAll('.poke-card').forEach(card => observer.observe(card));
    }

    async function loadCardData(id) {
        const card = document.querySelector(`.poke-card[data-id="${id}"]`);
        if (!card || card.dataset.loaded === 'true') return;

        try {
            if (!pokemonCache[id]) {
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
                pokemonCache[id] = await res.json();
            }
            
            const data = pokemonCache[id];
            card.dataset.loaded = 'true';

            const primaryType = data.types[0].type.name;
            const typeColor = TYPE_COLORS[primaryType];

            const beforeStyle = document.createElement('div');
            beforeStyle.style.cssText = `position:absolute;top:0;left:0;right:0;height:5px;border-radius:18px 18px 0 0;background:${typeColor};z-index:3;`;
            card.insertBefore(beforeStyle, card.firstChild);

            const img = card.querySelector('.poke-img');
            const artworkSrc = img.dataset.artwork;
            const newImg = new Image();
            newImg.src = artworkSrc;
            newImg.onload = () => {
                img.src = artworkSrc;
                img.classList.add('loaded');
            };

            card.querySelector('.poke-img-bg').style.background = typeColor;
            card.querySelector('.pokeball-watermark').style.color = typeColor;

            const typesContainer = document.getElementById(`types-${id}`);
            typesContainer.innerHTML = data.types.map(t =>
                `<span class="type-badge" style="background:${TYPE_COLORS[t.type.name]}">${TYPE_PT[t.type.name]}</span>`
            ).join('');

        } catch (error) {
            console.error(`Erro ao carregar dados do Pokémon #${id}:`, error);
        }
    }

    // ===== Efeito 3D =====
    function handleTilt(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.04)`;
        const glare = card.querySelector('.card-glare');
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.15) 0%, transparent 55%)`;
    }

    function resetTilt(card) {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
        card.querySelector('.card-glare').style.background = 'transparent';
    }

    // ===== Filtragem e Busca =====
    function filterAndRender() {
        const query = document.getElementById('searchInput').value.trim().toLowerCase();
        const grid = document.getElementById('cardGrid');
        const noResults = document.getElementById('noResults');
        const counter = document.getElementById('counter');
        let visibleCount = 0;

        const allCards = grid.children;
        let firstVisibleCard = null;

        for (let i = 0; i < allCards.length; i++) {
            const card = allCards[i];
            const id = parseInt(card.dataset.id);
            const name = basePokemonList[id - 1].name;
            let show = true;

            if (activeTypeFilter) {
                if (typeIndex[activeTypeFilter] && !typeIndex[activeTypeFilter].includes(id)) {
                    show = false;
                }
            }

            if (show && query) {
                const numMatch = String(id) === query || String(id).padStart(3, '0') === query || `#${String(id).padStart(3, '0')}` === query;
                const nameMatch = name.includes(query);
                const typeMatch = pokemonCache[id] ? pokemonCache[id].types.some(t => t.type.name.includes(query) || (TYPE_PT[t.type.name] || '').toLowerCase().includes(query)) : false;
                
                if (!numMatch && !nameMatch && !typeMatch) show = false;
            }

            if (show) {
                card.style.display = '';
                visibleCount++;
                if (!firstVisibleCard) firstVisibleCard = card;
            } else {
                card.style.display = 'none';
            }
        }

        if (visibleCount === 0) {
            noResults.style.display = 'block';
            counter.textContent = '0 POKÉMON ENCONTRADOS';
        } else {
            noResults.style.display = 'none';
            counter.textContent = `${visibleCount} POKÉMON ENCONTRADOS`;
            if (firstVisibleCard && firstVisibleCard.dataset.loaded === 'false') {
                loadCardData(firstVisibleCard.dataset.id);
            }
        }
    }

    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAndRender, 200);
    });

    // ===== Modal de Detalhes =====
    async function openModal(id) {
        const overlay = document.getElementById('modalOverlay');
        const body = document.getElementById('modalBody');
        
        body.innerHTML = `<div class="modal-loader"><div class="pokeball-loader"></div></div>`;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (!pokemonCache[id]) {
            try {
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
                pokemonCache[id] = await res.json();
                const card = document.querySelector(`.poke-card[data-id="${id}"]`);
                if(card && card.dataset.loaded === 'false') loadCardData(id);
            } catch (e) {
                body.innerHTML = `<div class="no-results"><div class="no-results-text">Erro ao carregar dados.</div></div>`;
                return;
            }
        }

        const pokemon = pokemonCache[id];
        const primaryType = pokemon.types[0].type.name;
        const typeColor = TYPE_COLORS[primaryType];

        // NOVO: Buscar descrição e categoria (genus)
        let description = 'Descrição não disponível.';
        let genus = ''; // Categoria, ex: "Pokémon Rato"
        try {
            const specRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
            const specData = await specRes.json();
            
            // Texto da Pokédex
            const ptEntry = specData.flavor_text_entries.find(e => e.language.name === 'pt-BR');
            const enEntry = specData.flavor_text_entries.find(e => e.language.name === 'en');
            description = (ptEntry || enEntry)?.flavor_text.replace(/[\n\f\r]/g, ' ') || description;
            
            // Categoria do Pokémon
            const ptGenus = specData.genera.find(g => g.language.name === 'pt-BR');
            const enGenus = specData.genera.find(g => g.language.name === 'en');
            genus = (ptGenus || enGenus)?.genus || '';
        } catch(e) {}

        // NOVO: Formatar a descrição como solicitado: "Pikachu - Pokémon Rato, quando ele se irrita..."
        const pokeName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
        const formattedDesc = genus ? `${pokeName} - ${genus}, ${description}` : `${pokeName} - ${description}`;

        const totalStats = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);
        const artworkUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`;
        const fallbackArt = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

        body.innerHTML = `
            <div class="modal-header" style="background: linear-gradient(135deg, ${typeColor}15, transparent 70%);">
                <div class="modal-img-section">
                    <div class="modal-img-wrapper">
                        <div class="modal-img-bg-circle" style="background:${typeColor}"></div>
                        <img class="modal-poke-img" src="${artworkUrl}" alt="${pokemon.name}"
                             onerror="this.src='${fallbackArt}'">
                    </div>
                </div>
                <div class="modal-info-section">
                    <div class="modal-pokemon-number">#${String(pokemon.id).padStart(3, '0')}</div>
                    <div class="modal-pokemon-name">${pokemon.name}</div>
                    <div class="modal-types">
                        ${pokemon.types.map(t => `<span class="modal-type-badge" style="background:${TYPE_COLORS[t.type.name]}">${TYPE_PT[t.type.name]}</span>`).join('')}
                    </div>
                    <div class="modal-physical">
                        <div>
                            <div class="physical-value">${(pokemon.height / 10).toFixed(1)} m</div>
                            <div class="physical-label">Altura</div>
                        </div>
                        <div>
                            <div class="physical-value">${(pokemon.weight / 10).toFixed(1)} kg</div>
                            <div class="physical-label">Peso</div>
                        </div>
                        <div>
                            <div class="physical-value">${totalStats}</div>
                            <div class="physical-label">Total</div>
                        </div>
                    </div>
                    <div class="modal-abilities">
                        <div class="ability-label">Habilidades</div>
                        <div>
                            ${pokemon.abilities.map(a => `<span class="ability-name ${a.is_hidden ? 'ability-hidden' : ''}">${a.ability.name.replace('-', ' ')}${a.is_hidden ? ' <small>(oculta)</small>' : ''}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-stats">
                <div class="stats-title">Estatísticas Base</div>
                ${pokemon.stats.map(s => {
                    const pct = Math.min(100, (s.base_stat / 255) * 100);
                    const name = STAT_NAMES[s.stat.name] || s.stat.name;
                    const color = STAT_COLORS[s.stat.name] || typeColor;
                    return `
                        <div class="stat-row">
                            <span class="stat-name">${name}</span>
                            <span class="stat-value" style="color:${color}">${s.base_stat}</span>
                            <div class="stat-bar-bg">
                                <div class="stat-bar-fill" data-width="${pct}" style="background: linear-gradient(90deg, ${color}, ${color}88);"></div>
                            </div>
                        </div>`;
                }).join('')}
            </div>
            <div class="modal-description">"${formattedDesc}"</div>
        `;

        setTimeout(() => {
            body.querySelectorAll('.stat-bar-fill').forEach(bar => bar.style.width = bar.dataset.width + '%');
        }, 100);
    }

    function closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // ===== Iniciar Tudo =====
    initPokedex();