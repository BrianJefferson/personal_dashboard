// ===== Configuration =====
const WEATHER_API_KEY = '2434f7ff72ea634c5ee41e8eb0924951';
const DEFAULT_LOCATION = 'Chicago,IL,US';

// ===== State Management =====
let currentLocation = DEFAULT_LOCATION;
let tasks = [];
let notes = [];
let currentFilter = 'all';
let editingNoteId = null;

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Load data from localStorage
    loadTasks();
    loadNotes();

    // Initialize UI
    updateGreeting();
    updateTime();
    loadWeather(DEFAULT_LOCATION);

    // Setup event listeners
    setupNavigationListeners();
    setupWeatherListeners();
    setupTaskListeners();
    setupNoteListeners();

    // Update time every minute
    setInterval(updateTime, 60000);
    setInterval(updateGreeting, 60000);

    // Render initial data
    renderTasks();
    renderNotes();
    updateStats();
}

// ===== Navigation =====
function setupNavigationListeners() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            navigateToSection(sectionId);
        });
    });
}

function navigateToSection(sectionId) {
    // Update active states
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionId);
    const targetLink = document.querySelector(`[data-section="${sectionId}"]`);

    if (targetSection) targetSection.classList.add('active');
    if (targetLink) targetLink.classList.add('active');
}

// ===== Greeting & Time =====
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Morning';

    if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
    } else if (hour >= 17 || hour < 5) {
        greeting = 'Good Evening';
    }

    const greetingElement = document.getElementById('greeting');
    if (greetingElement) {
        greetingElement.textContent = greeting;
    }
}

function updateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const timeString = now.toLocaleDateString('en-US', options);

    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// ===== Weather Functions =====
function setupWeatherListeners() {
    const updateBtn = document.getElementById('update-location-btn');
    const locationInput = document.getElementById('location-input');

    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            const location = locationInput.value.trim();
            if (location) {
                loadWeather(location);
            }
        });
    }

    if (locationInput) {
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const location = locationInput.value.trim();
                if (location) {
                    loadWeather(location);
                }
            }
        });
    }
}

async function loadWeather(location) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${WEATHER_API_KEY}&units=imperial`
        );

        if (!response.ok) {
            throw new Error('Location not found');
        }

        const data = await response.json();
        currentLocation = location;
        displayWeather(data);
    } catch (error) {
        console.error('Weather API Error:', error);
        showWeatherError();
    }
}

function displayWeather(data) {
    // Temperature
    const tempElement = document.getElementById('temperature');
    if (tempElement) {
        tempElement.textContent = `${Math.round(data.main.temp)}°F`;
    }

    // Description
    const descElement = document.getElementById('weather-description');
    if (descElement) {
        descElement.textContent = data.weather[0].description;
    }

    // Weather icon
    const iconElement = document.getElementById('weather-icon');
    if (iconElement) {
        const iconCode = data.weather[0].icon;
        iconElement.src = `https://static.vecteezy.com/system/resources/previews/068/809/050/non_2x/weather-icons-set-sunny-cloudy-rainy-vector.jpg`;
        iconElement.alt = data.weather[0].description;
    }

    // Feels like
    const feelsLikeElement = document.getElementById('feels-like');
    if (feelsLikeElement) {
        feelsLikeElement.textContent = `${Math.round(data.main.feels_like)}°F`;
    }

    // Humidity
    const humidityElement = document.getElementById('humidity');
    if (humidityElement) {
        humidityElement.textContent = `${data.main.humidity}%`;
    }

    // Wind speed
    const windElement = document.getElementById('wind-speed');
    if (windElement) {
        windElement.textContent = `${Math.round(data.wind.speed)} mph`;
    }

    // Pressure
    const pressureElement = document.getElementById('pressure');
    if (pressureElement) {
        pressureElement.textContent = `${data.main.pressure} hPa`;
    }

    // Location
    const locationElement = document.getElementById('current-location-display');
    if (locationElement) {
        locationElement.textContent = `${data.name}, ${data.sys.country}`;
    }

    // Update quick stats on home page
    const quickTempElement = document.getElementById('quick-temp');
    if (quickTempElement) {
        quickTempElement.textContent = `${Math.round(data.main.temp)}°F`;
    }

    const quickConditionElement = document.getElementById('quick-condition');
    if (quickConditionElement) {
        quickConditionElement.textContent = data.weather[0].main;
    }
}

function showWeatherError() {
    const tempElement = document.getElementById('temperature');
    const descElement = document.getElementById('weather-description');

    if (tempElement) tempElement.textContent = 'Error';
    if (descElement) descElement.textContent = 'Unable to load weather data. Please check the location.';
}

// ===== Tasks Functions =====
function setupTaskListeners() {
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskInput = document.getElementById('task-input');
    const filterBtns = document.querySelectorAll('.filter-btn');

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
    }

    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTask();
            }
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks();
        });
    });
}

function addTask() {
    const taskInput = document.getElementById('task-input');
    const taskText = taskInput.value.trim();

    if (taskText) {
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(task);
        saveTasks();
        renderTasks();
        updateStats();
        taskInput.value = '';
    }
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const newText = prompt('Edit task:', task.text);
        if (newText !== null && newText.trim()) {
            task.text = newText.trim();
            saveTasks();
            renderTasks();
        }
    }
}

function renderTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    let filteredTasks = tasks;

    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <span>📋</span>
                <p>No tasks to show</p>
                <p style="font-size: 0.9rem;">Add a new task to get started!</p>
            </div>
        `;
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})"></div>
            <div class="task-text">${escapeHtml(task.text)}</div>
            <div class="task-actions">
                <button class="task-btn" onclick="editTask(${task.id})">Edit</button>
                <button class="task-btn delete" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        </div>
    `).join('');

    // Update active task count
    const activeCount = tasks.filter(t => !t.completed).length;
    const activeTaskCountElement = document.getElementById('active-task-count');
    if (activeTaskCountElement) {
        activeTaskCountElement.textContent = activeCount;
    }
}

function saveTasks() {
    localStorage.setItem('dashboard_tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem('dashboard_tasks');
    if (saved) {
        tasks = JSON.parse(saved);
    }
}

// ===== Notes Functions =====
function setupNoteListeners() {
    const addNoteBtn = document.getElementById('add-note-btn');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const cancelNoteBtn = document.getElementById('cancel-note-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const modal = document.getElementById('note-modal');

    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => openNoteModal());
    }

    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', saveNote);
    }

    if (cancelNoteBtn) {
        cancelNoteBtn.addEventListener('click', closeNoteModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeNoteModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeNoteModal();
            }
        });
    }
}

function openNoteModal(noteId = null) {
    const modal = document.getElementById('note-modal');
    const modalTitle = document.getElementById('modal-title');
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');

    editingNoteId = noteId;

    if (noteId) {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            modalTitle.textContent = 'Edit Note';
            titleInput.value = note.title;
            contentInput.value = note.content;
        }
    } else {
        modalTitle.textContent = 'New Note';
        titleInput.value = '';
        contentInput.value = '';
    }

    modal.classList.add('active');
    titleInput.focus();
}

function closeNoteModal() {
    const modal = document.getElementById('note-modal');
    modal.classList.remove('active');
    editingNoteId = null;
}

function saveNote() {
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title && !content) {
        alert('Please enter a title or content for your note.');
        return;
    }

    if (editingNoteId) {
        // Edit existing note
        const note = notes.find(n => n.id === editingNoteId);
        if (note) {
            note.title = title || 'Untitled Note';
            note.content = content;
            note.updatedAt = new Date().toISOString();
        }
    } else {
        // Create new note
        const note = {
            id: Date.now(),
            title: title || 'Untitled Note',
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        notes.unshift(note);
    }

    saveNotes();
    renderNotes();
    updateStats();
    closeNoteModal();
}

function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(n => n.id !== id);
        saveNotes();
        renderNotes();
        updateStats();
    }
}

function renderNotes() {
    const notesGrid = document.getElementById('notes-grid');
    if (!notesGrid) return;

    if (notes.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <span>📝</span>
                <p>No notes yet</p>
                <p style="font-size: 0.9rem;">Click "New Note" to create your first note!</p>
            </div>
        `;
        return;
    }

    notesGrid.innerHTML = notes.map(note => {
        const date = new Date(note.updatedAt);
        const dateString = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return `
            <div class="note-card">
                <div class="note-header">
                    <div>
                        <div class="note-title">${escapeHtml(note.title)}</div>
                        <div class="note-date">${dateString}</div>
                    </div>
                </div>
                <div class="note-content">${escapeHtml(note.content)}</div>
                <div class="note-actions">
                    <button class="note-btn" onclick="openNoteModal(${note.id})">Edit</button>
                    <button class="note-btn delete" onclick="deleteNote(${note.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function saveNotes() {
    localStorage.setItem('dashboard_notes', JSON.stringify(notes));
}

function loadNotes() {
    const saved = localStorage.getItem('dashboard_notes');
    if (saved) {
        notes = JSON.parse(saved);
    }
}

// ===== Stats Update =====
function updateStats() {
    const taskCountElement = document.getElementById('task-count');
    const noteCountElement = document.getElementById('note-count');

    if (taskCountElement) {
        const activeTaskCount = tasks.filter(t => !t.completed).length;
        taskCountElement.textContent = activeTaskCount;
    }

    if (noteCountElement) {
        noteCountElement.textContent = notes.length;
    }
}

// ===== Utility Functions =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally accessible for onclick handlers
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.editTask = editTask;
window.openNoteModal = openNoteModal;
window.deleteNote = deleteNote;