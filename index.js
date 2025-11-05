const API_URL = 'https://script.google.com/macros/s/AKfycbwVJqhT0zHDvYDOSjuJ7edPUVywTJdbuRwaSSJK1JYtu1hJBKy1V6LvPx3KRXyWx8sELg/exec';

const storageKey = 'danceStepsProgress';
let allSteps = [];
let filteredSteps = [];
let currentModalStepIndex = -1;
let colores = {
    'Eleggua': ['#ff5733', '#000000'], //rojo y negro
    'Oggun': ['#33ff57', '#000000'], //verde y negro
    'Ochosi': ['#3357ff', '#ffff00'],  //azul y amarillo
    'Yemaya': ['#0000ff'], //azul
    'Oshun': ['#ffff00'], //amarillo
    'Oya': ['#ff00ff', '#808080'], //morado y gris
}

function getProgress() {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
}

function cleanText(text) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')
}

function saveProgress(progress) {
    localStorage.setItem(storageKey, JSON.stringify(progress));
}

function resetProgress() {
    localStorage.removeItem(storageKey);

    loadSteps();
}

function createStepHTML(step, status = null) {
    let html = `<div class="info">`;
    const indexInFiltered = filteredSteps.findIndex(s => s.nombre === step.nombre && s.orisha === step.orisha);
    html += `<span class="capitalize-me step-name"><strong >${step.nombre}</strong>
    <button class="info-btn" onclick="event.preventDefault();showStepInfoModal(${indexInFiltered})"><i data-lucide="info"></i>
    </button>
    </span>`;

    html += "<div>"
    if (step.video) {
        html += ` <a href="#" class="video-link" class="video-button" onclick="event.preventDefault();showVideoVariations('${step.nombre}', '${step.orisha}','${step.video}', ${indexInFiltered})">Video ▶︎</a>`;
    }
    if (step.audio) {
        html += ` <a href="#" class="audio-link" onclick="event.preventDefault();showAudioPlayer('${step.nombre}', '${step.orisha}', ${indexInFiltered})">Audio ♪</a>`;
    }
    if (step.explicacion) {
    html += ` <a href="#" class="image-link" onclick="event.preventDefault();showImageViewer('${step.nombre}', '${step.orisha}', ${indexInFiltered})">Explicación ★</a>`;
    }
    html += `</div>`;
    // Mostrar etiqueta mini SOLO si es modo aleatorio y fue marcado como "no lo sé"
    if (status === 'dontknow') {
        html += `<span class="random-status-tag">❓ Antes no lo sabias!</span>`;
    }

    html += `<div>`;
    if (step.orisha) html += orishaTag(step.orisha);
    html += `</div>`;

    html += `</div>`;
    return html;
}
// Modal logic for info button
function showStepInfoModal(indexInFiltered) {
    const step = filteredSteps[indexInFiltered];
    const modal = document.createElement('div');
    const sameToqueSteps = allSteps.filter(s => s.toque === step.toque && s.nombre !== step.nombre);
    const sameStepOrishas = allSteps.filter(s => s.nombre === step.nombre);
    modal.className = 'info-modal';
    modal.innerHTML = `
        <div class="info-backdrop" onclick="this.parentElement.remove()"></div>
        <div class="info-content">
            <div class="normal-view-controls">
                <h2 id="info-step-title" class="step-title step-name">${step.nombre}</h2>
                <div class="info-body">
                    <p><strong>Orisha:</strong> ${sameStepOrishas.length > 0 ? `${sameStepOrishas.map(s => s.orisha).join(', ')}` : ''}</p>
                    <p><strong>Toque:</strong> ${step.toque ? step.toque : '-'}</p>
                    
                    ${sameToqueSteps.length > 0 ? `<hr/><h3>Otros pasos con el mismo toque (${sameToqueSteps.length}):</h3> <p>${sameToqueSteps.map(s => `${s.nombre} (${s.orisha})`).join(', ')}</p>` : ''}
                    <hr/>
                    <p><strong>Notas:</strong> ${step.notas ? step.notas : '-'}</p>
                    </div>
                <div class="navigation-controls">
                    <button class="btn btn-secondary close-btn" onclick="this.closest('.info-modal').remove()">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function orishaTag(orisha) {
    return `<span class="tag ${orisha.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
        }">${orisha}</span>`;
}

function updateFilters(data) {
    const orishas = new Set();
    data.forEach(step => {
        if (step.orisha) orishas.add(step.orisha);
    });

    const orishaSelect = document.getElementById('filter-orisha');

    orishaSelect.innerHTML = '<option value="">Elegir</option>';

    [...orishas].sort().forEach(value => {
        orishaSelect.innerHTML += `<option value="${value}">${value}</option>`;
    });
}

function filterStep(step) {
    const orisha = document.getElementById('filter-orisha').value;
    const search = document.getElementById('search-step').value.trim().toLowerCase();

    if (orisha && step.orisha !== orisha) return false;
    if (search && !step.nombre.toLowerCase().includes(search)) return false;

    return true;
}

function updateUI(data) {
    const progress = getProgress();
    const unseenContainer = document.getElementById('unseen-list');
    const knownContainer = document.getElementById('known-list');
    const dontknowContainer = document.getElementById('dontknow-list');

    if (isFilterActive()) {
        document.getElementById('filtros-danger').style.display = 'block';
    } else {
        document.getElementById('filtros-danger').style.display = 'none';
    }

    unseenContainer.innerHTML = '';
    knownContainer.innerHTML = '';
    dontknowContainer.innerHTML = '';
    let knownCount = 0;
    let dontknowCount = 0;
    let unseenCount = 0;
    filteredSteps = data.filter(filterStep);
    filteredSteps.forEach(step => {
        const key = step.nombre;
        const status = progress[key];
        const div = document.createElement('div');
        div.className = 'step';
        div.innerHTML = createStepHTML(step); // sin pasar el status

        if (!status) {
            const actions = document.createElement('div');
            actions.className = 'actions';

            const btnKnow = document.createElement('button');
            btnKnow.textContent = '✔︎';
            btnKnow.className = 'btn btn-green';
            btnKnow.onclick = () => {
                progress[key] = 'know';
                saveProgress(progress);
                updateUI(data);
                showReaction('happy');
            };

            const btnDontKnow = document.createElement('button');
            btnDontKnow.textContent = "✖︎";
            btnDontKnow.className = 'btn btn-red';
            btnDontKnow.onclick = () => {
                progress[key] = 'dontknow';
                saveProgress(progress);
                updateUI(data);
                showReaction('sad');
            };

            actions.appendChild(btnKnow);
            actions.appendChild(btnDontKnow);
            div.appendChild(actions);
            unseenContainer.appendChild(div);
            unseenCount++;
        } else if (status === 'know') {
            const actions = document.createElement('div');
            actions.className = 'actions';
            const resetBtn = document.createElement('button');
            resetBtn.textContent = '🔄';
            resetBtn.title = 'Reiniciar este paso';
            resetBtn.className = 'btn btn-secondary';

            resetBtn.onclick = () => {
                delete progress[key];
                saveProgress(progress);
                updateUI(data);
            };
            actions.appendChild(resetBtn);
            div.appendChild(actions);
            knownContainer.appendChild(div);
            knownCount++;
        } else if (status === 'dontknow') {
            const actions = document.createElement('div');
            actions.className = 'actions';
            const resetBtn = document.createElement('button');
            resetBtn.textContent = '🔄';
            resetBtn.title = 'Reiniciar este paso';
            resetBtn.className = 'btn btn-secondary';

            resetBtn.onclick = () => {
                delete progress[key];
                saveProgress(progress);
                updateUI(data);
            };
            actions.appendChild(resetBtn);
            div.appendChild(actions);
            dontknowContainer.appendChild(div);
            dontknowCount++;
        }
    });
    document.getElementById('known-count').textContent = knownCount;
    document.getElementById('dontKnown-count').textContent = dontknowCount;
    document.getElementById('unseen-count').textContent = unseenCount;
    lucide.createIcons()
}


function getRandomStep() {
    const progress = getProgress();
    let available = allSteps.filter(step => {
        const status = progress[step.nombre];
        return (!status) && filterStep(step);
    });
    if (available.length === 0) {
        available = allSteps.filter(step => {
            const status = progress[step.nombre];
            return (status !== 'know') && filterStep(step);
        });
    }
    if (available.length === 0) {
        return null; // No hay pasos disponibles
    }
    return available[Math.floor(Math.random() * available.length)];
}


function showRandomStep(step) {
    const randomBox = document.getElementById('random-step');
    const progress = getProgress();

    if (!step) {
        randomBox.style.display = 'flex';
        randomBox.innerHTML = '🎉 ¡Ya sabes todos los pasos!';
        return;
    }

    const status = progress[step.nombre]; // puede ser "dontknow"
    randomBox.style.display = 'flex';
    randomBox.innerHTML = createStepHTML(step, status);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const btnKnow = document.createElement('button');
    btnKnow.textContent = '✔︎';
    btnKnow.className = 'btn btn-green';
    btnKnow.onclick = () => {
        progress[step.nombre] = 'know';
        saveProgress(progress);
        updateUI(allSteps);
        showRandomStep(getRandomStep());
        showReaction('happy');
    };

    const btnDontKnow = document.createElement('button');
    btnDontKnow.textContent = "✖︎";
    btnDontKnow.className = 'btn btn-red';
    btnDontKnow.onclick = () => {
        progress[step.nombre] = 'dontknow';
        saveProgress(progress);
        updateUI(allSteps);
        showRandomStep(getRandomStep());
        showReaction('sad')
    };

    actions.appendChild(btnKnow);
    actions.appendChild(btnDontKnow);
    randomBox.appendChild(actions);
    lucide.createIcons();
}


async function loadSteps() {
    const loader = document.getElementById('loader');
    loader.style.display = 'block';
    try {
        const response = await fetch(API_URL);
        let data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Datos no válidos recibidos del servidor');
        }
        allSteps = data;
        updateFilters(data);
        updateUI(data);
    } catch (err) {
        console.error('Failed to fetch steps', err);
    } finally {
        loader.style.display = 'none';
    }
}

// Event listeners
document.getElementById('get-random').addEventListener('click', () => {
    showRandomStep(getRandomStep());
});


document.getElementById('reset-progress').addEventListener('click', () => {
    if (confirm('Reiniciar todo el progreso?')) {
        resetProgress();
        const randomBox = document.getElementById('random-step');
        randomBox.style.display = 'none';
        randomBox.innerHTML = '';
    }
});

['filter-orisha'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => updateUI(allSteps));
});

document.getElementById('search-step').addEventListener('input', () => updateUI(allSteps));


loadSteps();


const themeKey = 'danceStepsTheme';

function applyTheme() {
    const isDark = localStorage.getItem(themeKey) === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
}

function toggleTheme() {
    const current = localStorage.getItem(themeKey);
    const newTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(themeKey, newTheme);
    applyTheme();
}

document.getElementById('toggle-theme').addEventListener('click', toggleTheme);

// Apply on load
applyTheme();

// Global name visibility state
let areNamesVisible = true;

function toggleNames() {
    areNamesVisible = !areNamesVisible;
    document.body.classList.toggle('hide-names', !areNamesVisible);
    const toggleButton = document.getElementById('toggle-names');
    // Remove any existing show-name classes when toggling visibility
    if (areNamesVisible) {
        document.querySelectorAll('.step-name').forEach(el => {
            el.classList.remove('show-name');
        });
    }
    toggleButton.innerHTML = areNamesVisible ? 
        '<i data-lucide="eye-off" class="icon"></i> Ocultar nombres' : 
        '<i data-lucide="eye" class="icon"></i> Mostrar nombres';
    lucide.createIcons();
}

// Handle click events on step names
document.addEventListener('click', (e) => {
    if (!areNamesVisible && e.target.closest('.step-name')) {
        const stepName = e.target.closest('.step-name');
        // Toggle show-name class on click
        stepName.classList.toggle('show-name');
    }
});

document.getElementById('toggle-names').addEventListener('click', toggleNames);

function toggleSection(id, titleEl) {
    const section = document.getElementById(id);
    const isVisible = section.style.display === 'block';
    section.style.display = isVisible ? 'none' : 'block';

    const icon = titleEl.querySelector('.toggle-icon');
    icon.textContent = isVisible ? '➕' : '➖';
}


function showReaction(reaction) {
    const container = document.getElementById("reaction-container");

    const emoji = document.createElement("div");
    emoji.classList.add("reaction");
    emoji.innerHTML = '<img class="meme" src="' + reaction + '.jpg" alt="' + reaction + '" />';
    emoji.style.right = Math.random() * 150 + "px";

    container.appendChild(emoji);

    setTimeout(() => {
        emoji.remove();
    }, 1000); // match animation duration
}


function isFilterActive() {
    const orisha = document.getElementById('filter-orisha').value;
    const search = document.getElementById('search-step').value.trim().toLowerCase();

    return orisha || search;
}

function showImageViewer(stepName, orisha, indexInFilteredSteps = null) {
    const pasoClean = cleanText(stepName);
    const orishaClean = cleanText(orisha);
    const modal = document.createElement('div');
    modal.className = 'image-modal';

    modal.innerHTML = `
        <div class="image-backdrop" onclick="this.parentElement.remove()"></div>
        <div class="image-content">
            <div class="image-wrapper">
                <img id="image-viewer" src="explicaciones/${orishaClean}/${pasoClean}.jpg" alt="${stepName}">
                <button id="fullscreen-btn" class="btn btn-secondary fullscreen-btn" title="Pantalla completa">
                    <i data-lucide="maximize-2"></i>
                </button>
            </div>
            <div class="normal-view-controls">
                <h2 id="image-step-title" class="step-title step-name">${stepName} ${orisha}</h2>
                <div class="navigation-controls">
                    <button id="previous-image-step" class="arrow-btn btn-secondary"><</button>
                    <button class="btn btn-secondary close-btn" onclick="this.closest('.image-modal').remove()">Cerrar</button>
                    <button id="next-image-step" class="arrow-btn btn-secondary">></button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Set up navigation buttons
    const nextButton = modal.querySelector('#next-image-step');
    if (indexInFilteredSteps === null || !filteredSteps.length || indexInFilteredSteps >= filteredSteps.length - 1) {
        nextButton.classList.add('disabled');
    } else {
        nextButton.onclick = () => {
            const nextStep = filteredSteps[indexInFilteredSteps + 1];
            modal.remove();
            showImageViewer(nextStep.nombre, nextStep.orisha, indexInFilteredSteps + 1);
        };
    }

    const previousButton = modal.querySelector('#previous-image-step');
    if (indexInFilteredSteps === null || indexInFilteredSteps <= 0) {
        previousButton.classList.add('disabled');
    } else {
        previousButton.onclick = () => {
            const previousStep = filteredSteps[indexInFilteredSteps - 1];
            modal.remove();
            showImageViewer(previousStep.nombre, previousStep.orisha, indexInFilteredSteps - 1);
        };
    }

    // Set up custom fullscreen functionality
    const imageContent = modal.querySelector('.image-content');
    const fullscreenBtn = modal.querySelector('#fullscreen-btn');
    const imageViewer = modal.querySelector('#image-viewer');
    let isFullscreen = false;

    fullscreenBtn.onclick = () => {
        isFullscreen = !isFullscreen;
        imageContent.classList.toggle('fullscreen', isFullscreen);
        fullscreenBtn.innerHTML = isFullscreen ? 
            '<i data-lucide="minimize-2"></i>' : 
            '<i data-lucide="maximize-2"></i>';
        lucide.createIcons();
    };

    // Handle Esc key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isFullscreen) {
            isFullscreen = false;
            imageContent.classList.remove('fullscreen');
            fullscreenBtn.innerHTML = '<i data-lucide="maximize-2"></i>';
            lucide.createIcons();
        }
    });

    // Initialize the Lucide icons
    lucide.createIcons();
}

function showVideoVariations(stepName, orisha, vars, indexInFilteredSteps = null) {
    const pasoClean = cleanText(stepName);
    const orishaClean = cleanText(orisha);
    const modal = document.createElement('div');
    modal.className = 'video-modal';

    modal.innerHTML = `
        <div class="video-backdrop" onclick="this.parentElement.remove()"></div>
        <div class="video-content">
            <select id="video-selector" class="btn btn-secondary"></select>
            <h2 id="video-step-title" class="step-title step-name">${stepName +' '+ orisha}</h2>
            <div class="video-controls">
                <button id="previous-step" class="arrow-btn btn-secondary"><</button>
                <div class="video-viewport">
                    <video id="video-player" controls autoplay loop></video>
                </div>
                <button id="next-step" class="arrow-btn btn-secondary">></button>
            </div>
            <button class="btn btn-secondary close-btn" onclick="this.closest('.video-modal').remove()">Cerrar</button>
        </div>
    `;

    document.body.appendChild(modal);

    const selector = modal.querySelector('#video-selector');
    const player = modal.querySelector('#video-player');

    if (vars){
        const defaultOption = document.createElement('option');
        defaultOption.value = `pasos/${orishaClean}/${pasoClean}.mp4`;
        defaultOption.textContent = 'Base';
        selector.appendChild(defaultOption);
        player.src = `pasos/${orishaClean}/${pasoClean}.mp4`;
    }

    for (let i = 1; i < vars; i++) {
        const option = document.createElement('option');
        option.value = `pasos/${orishaClean}/${pasoClean}-var-${i}.mp4`;
        option.textContent = `Variante ${i}`;
        selector.appendChild(option);
    }

    selector.addEventListener('change', () => {
        player.src = selector.value;
        player.play();
    });

    const nextButton = modal.querySelector('#next-step');
    if (indexInFilteredSteps === null || !filteredSteps.length || indexInFilteredSteps >= filteredSteps.length - 1) {
        nextButton.classList.add('disabled');
    } else {
        nextButton.onclick = () => {
            const nextStep = filteredSteps[indexInFilteredSteps + 1];
            modal.remove();
            showVideoVariations(nextStep.nombre, nextStep.orisha, nextStep.video, indexInFilteredSteps + 1);
        };
    }
    const previousButton = modal.querySelector('#previous-step');
    if (indexInFilteredSteps === null || indexInFilteredSteps <= 0) {
        previousButton.classList.add('disabled');
    } else {
        previousButton.onclick = () => {
            const previousStep = filteredSteps[indexInFilteredSteps - 1];
            modal.remove();
            showVideoVariations(previousStep.nombre, previousStep.orisha, previousStep.video, indexInFilteredSteps - 1);
        };
    }
}

function showAudioPlayer(stepName, orisha, indexInFilteredSteps = null) {
    const pasoClean = cleanText(stepName);
    const orishaClean = cleanText(orisha);
    const modal = document.createElement('div');
    modal.className = 'audio-modal';

    modal.innerHTML = `
        <div class="audio-backdrop" onclick="this.parentElement.remove()"></div>
        <div class="audio-content">
            <h2 id="audio-step-title" class="step-title step-name">${stepName} ${orisha}</h2>
            <div class="audio-controls">
                <div class="audio-player-container">
                    <audio id="audio-player" controls>
                        <source src="audios/${orishaClean}/${pasoClean}.mp3" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            </div>
            <div class="modal-buttons">
                <button id="previous-audio-step" class="arrow-btn btn-secondary"><</button>
                <button class="btn btn-secondary close-btn" onclick="this.closest('.audio-modal').remove()">Cerrar</button>
                <button id="next-audio-step" class="arrow-btn btn-secondary">></button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Set up navigation buttons
    const nextButton = modal.querySelector('#next-audio-step');
    if (indexInFilteredSteps === null || !filteredSteps.length || indexInFilteredSteps >= filteredSteps.length - 1) {
        nextButton.classList.add('disabled');
    } else {
        nextButton.onclick = () => {
            const nextStep = filteredSteps[indexInFilteredSteps + 1];
            modal.remove();
            showAudioPlayer(nextStep.nombre, nextStep.orisha, indexInFilteredSteps + 1);
        };
    }

    const previousButton = modal.querySelector('#previous-audio-step');
    if (indexInFilteredSteps === null || indexInFilteredSteps <= 0) {
        previousButton.classList.add('disabled');
    } else {
        previousButton.onclick = () => {
            const previousStep = filteredSteps[indexInFilteredSteps - 1];
            modal.remove();
            showAudioPlayer(previousStep.nombre, previousStep.orisha, indexInFilteredSteps - 1);
        };
    }

    // Stop audio when modal is closed
    const audioPlayer = modal.querySelector('#audio-player');
    const stepTitle = modal.querySelector('#audio-step-title');
    const toggleButton = modal.querySelector('#toggle-name');
    let isNameVisible = true;

    // Toggle name visibility
    toggleButton.addEventListener('click', () => {
        isNameVisible = !isNameVisible;
        stepTitle.style.visibility = isNameVisible ? 'visible' : 'hidden';
        toggleButton.innerHTML = isNameVisible ? 
            '<i data-lucide="eye-off"></i> Ocultar nombre' : 
            '<i data-lucide="eye"></i> Mostrar nombre';
        lucide.createIcons(); // Recreate icons after changing innerHTML
    });

    modal.querySelector('.audio-backdrop').addEventListener('click', () => {
        audioPlayer.pause();
    });
    modal.querySelector('.close-btn').addEventListener('click', () => {
        audioPlayer.pause();
    });
}

lucide.createIcons();
