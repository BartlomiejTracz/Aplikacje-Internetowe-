document.addEventListener('DOMContentLoaded', () => {
    // === Selektory DOM ===
    const taskListContainer = document.getElementById('task-list-container');
    const addTaskForm = document.getElementById('add-task-form');
    const newTaskInput = document.getElementById('new-task-input');
    const dueDateInput = document.getElementById('due-date-input');
    const searchInput = document.getElementById('search-input');
    const validationMessage = document.getElementById('validation-message');

    // === Funkcje Local Storage ===

    // Pobiera zadania z Local Storage
    const getTasks = () => {
        const tasksJson = localStorage.getItem('tasks');
        return tasksJson ? JSON.parse(tasksJson) : [];
    };

    // Zapisuje zadania do Local Storage
    const saveTasks = (tasks) => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    // === Funkcje Renderer / DOM ===

    // Generuje HTML dla pojedynczego zadania
    const createTaskElement = (task, searchTerm = '') => {
        const div = document.createElement('div');
        div.className = 'task-item';
        // Używamy ID zadania do identyfikacji
        div.dataset.id = task.id; 

        // Tekst zadania z wyróżnieniem wyszukiwanej frazy
        let taskText = task.text;
        if (searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            // Zmieniamy kolor tła dopasowanej frazy
            taskText = task.text.replace(regex, '<span style="background-color: yellow;">$1</span>');
        }

        // Dodanie daty wykonania, jeśli jest
        const dueDateHtml = task.dueDate ? `<small> (Do: ${task.dueDate})</small>` : '';

        // Składanie elementu listy
        div.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${taskText}${dueDateHtml}</span>
            <span class="delete-btn" style="float: right; cursor: pointer;">&#128465;</span>
        `;
        
        // Obsługa checkboxa (oznaczanie jako wykonane)
        const checkbox = div.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => toggleTaskCompleted(task.id));
        
        // Obsługa usuwania
        const deleteButton = div.querySelector('.delete-btn');
        deleteButton.addEventListener('click', () => deleteTask(task.id));
        
        // Obsługa edycji (kliknięcie na tekst zadania)
        const taskTextSpan = div.querySelector('.task-text');
        taskTextSpan.addEventListener('click', (e) => startEditing(e.currentTarget, task.id));

        return div;
    };

    // Renderuje całą listę zadań
    const renderTasks = (searchTerm = '') => {
        taskListContainer.innerHTML = '';
        const tasks = getTasks();
        
        // Filtrowanie zadań na podstawie wyszukiwania
        const filteredTasks = tasks.filter(task => 
            task.text.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Wyświetlanie filtrowanych/wszystkich zadań
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task, searchTerm);
            taskListContainer.appendChild(taskElement);
        });
    };

    // === Logika Biznesowa Zadań ===

    // Dodawanie nowego zadania
    const addTask = (e) => {
        e.preventDefault();

        const text = newTaskInput.value.trim();
        const dueDate = dueDateInput.value;

        // Walidacja Danych Wejściowych
        if (text.length < 3 || text.length > 255) {
            validationMessage.textContent = 'Zadanie musi mieć od 3 do 255 znaków!';
            return;
        }
        validationMessage.textContent = ''; // Czyści komunikat

        const tasks = getTasks();
        const newTask = {
            // Unikatowe ID na podstawie timestamp
            id: Date.now(), 
            text,
            dueDate,
            completed: false
        };

        tasks.push(newTask);
        saveTasks(tasks);
        
        // Renderuje listę, aby pokazać nowe zadanie
        renderTasks(); 
        
        // Czyści formularz
        addTaskForm.reset(); 
    };

    // Usuwanie zadania
    const deleteTask = (taskId) => {
        let tasks = getTasks();
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks(tasks);
        renderTasks();
    };
    
    // Zmiana statusu wykonania zadania
    const toggleTaskCompleted = (taskId) => {
        const tasks = getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks(tasks);
        }
        // Nie trzeba odświeżać całej listy, ale utrzymujemy checkbox w stanie zgodnym z LS
    };
    
    // === Edycja Zadania ===

    // Rozpoczyna edycję
    const startEditing = (spanElement, taskId) => {
        if (spanElement.querySelector('input[type="text"]')) {
            // Już w trybie edycji, pomiń
            return; 
        }

        // Pobieramy czysty tekst zadania (usuwamy ewentualne podświetlenia i datę)
        const currentTask = getTasks().find(t => t.id === taskId);
        if (!currentTask) return;

        // Usuwamy datę z tekstu wyświetlanego w polu edycji
        const rawText = currentTask.text;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = rawText;
        // Ustawienie max/min długości z walidacji
        input.maxLength = 255;
        input.minLength = 3; 

        // Zastąpienie span'a inputem
        spanElement.textContent = '';
        spanElement.appendChild(input);
        input.focus();

        // Obsługa kliknięcia poza polem (blur) - zapisuje zmiany
        input.addEventListener('blur', () => saveEditing(input, taskId, currentTask.dueDate));

        // Zapisanie zmian po naciśnięciu Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Wymusza zdarzenie blur i zapisuje
            }
        });
    };

    // Zapisuje edytowane zadanie
    const saveEditing = (inputElement, taskId, dueDate) => {
        const newText = inputElement.value.trim();

        // Ponowna walidacja przed zapisem
        if (newText.length < 3 || newText.length > 255) {
            alert('Zadanie musi mieć od 3 do 255 znaków! Zmiany nie zostały zapisane.');
            renderTasks(searchInput.value); // Odświeża, przywracając stary tekst
            return;
        }

        const tasks = getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        if (taskIndex !== -1) {
            // Aktualizujemy tylko tekst
            tasks[taskIndex].text = newText; 
            saveTasks(tasks);
            // Ponowne renderowanie z aktualnym wyszukiwanym tekstem (jeśli istnieje)
            renderTasks(searchInput.value); 
        }
    };
    
    // === Inicjalizacja i Listenery ===

    // Wczytanie zadań przy starcie
    renderTasks(); 

    // Obsługa dodawania zadania
    addTaskForm.addEventListener('submit', addTask);
    
    // Obsługa wyszukiwania
    searchInput.addEventListener('input', () => {
        // Ponowne renderowanie z nową frazą (automatycznie filtruje i podświetla)
        renderTasks(searchInput.value); 
    });
});