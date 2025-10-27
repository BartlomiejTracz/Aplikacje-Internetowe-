document.addEventListener('DOMContentLoaded', () => {
    // odwołanie do elementów z HTML po id
    const taskListContainer = document.getElementById('task-list-container');
    const addTaskForm = document.getElementById('add-task-form');
    const newTaskInput = document.getElementById('new-task-input');
    const dueDateInput = document.getElementById('due-date-input');
    const searchInput = document.getElementById('search-input');
    const validationMessage = document.getElementById('validation-message');

  

   //odczytywanie i zapis w localStorage
    const getTasks = () => {
        //pobranie zadania z localStorage i konwersja z JSON
        const tasksJson = localStorage.getItem('tasks');
        return tasksJson ? JSON.parse(tasksJson) : [];
    };
    
    const saveTasks = (tasks) => {
        //zapisanie przekonwertowanego do JSON zadania w localStorage
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    //tworzenie / aktualizowanie elementów listy zadań
    const createTaskElement = (task, searchTerm = '') => {
        //utworzenie elementu kontenera dla zadania
        const div = document.createElement('div');
        div.className = 'task-item';
        div.dataset.id = task.id; 

        //Podświetlanie wyszukiwanego terminu
        let taskText = task.text;
        if (searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            //jeżeli tekst który wyszujujemy jest w tej tablicy to podświetlamt go 
            taskText = task.text.replace(regex, '<span style="background-color: red;">$1</span>');
        }

       //Dodanie daty
        const dueDateHtml = task.dueDate ? `<small> (Do: ${task.dueDate})</small>` : '';

       //Szablon HTML do zadania (checkbox, tekst, data, przycisk usuwania)
        div.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${taskText}${dueDateHtml}</span>
            <span class="delete-btn" style="float: right; cursor: pointer;">&#128465;</span>
        `;
        
        
        const checkbox = div.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => toggleTaskCompleted(task.id));
        
        
        const deleteButton = div.querySelector('.delete-btn');
        deleteButton.addEventListener('click', () => deleteTask(task.id));
        
        
        const taskTextSpan = div.querySelector('.task-text');
        taskTextSpan.addEventListener('click', (e) => startEditing(e.currentTarget, task.id));

        return div;
    };

   
    const renderTasks = (searchTerm = '') => {
        //pobranie całej listy zzadań i wyczyszczenie kontenera
        taskListContainer.innerHTML = '';
        const tasks = getTasks();
        
        //konwersja na małe litery i filtrowanie zadań
        const filteredTasks = tasks.filter(task => 
            task.text.toLowerCase().includes(searchTerm.toLowerCase())
        );

        //tworzenie i dodawanie elementów zadań do kontenera
        //wyświetlanie tylko tych które przeszły filtr
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task, searchTerm);
            taskListContainer.appendChild(taskElement);
        });
    };

 
    const addTask = (e) => {
        e.preventDefault();

        //pobranie wartości z formularza
        const text = newTaskInput.value.trim();
        const dueDate = dueDateInput.value;

       
        validationMessage.textContent = ''; 

        //walidacja długości tekstu
        if (text.length < 3 || text.length > 255) {
            validationMessage.textContent = 'Treść zadania musi mieć od 3 do 255 znaków!';
            return;
        }

        //walidacja daty (czty została podana)
        if (!dueDate) {
            validationMessage.textContent = 'Musisz podać Datę Wykonania!';
            return;
        }
       
        //utworzenie nowego zadania i zapisanie go
        const tasks = getTasks();
        const newTask = {
            id: Date.now(), 
            text,
            dueDate,
            completed: false
        };

        //dodanie nowego zadania do listy i zapisanie
        tasks.push(newTask);
        saveTasks(tasks);
        
        //odświeżenie widoku zadań
        renderTasks(); 
        
        //wyczyszczenie formularza
        addTaskForm.reset(); 
    };

    //usuwanie zadania
    const deleteTask = (taskId) => {
        //pobranie wsztstkich zadań
        let tasks = getTasks();
        //tworzenie nowej tablicy bez usuwanego zadania
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks(tasks);
        renderTasks();
    };
    
    //zmiana statusu wykonanego zadania
    const toggleTaskCompleted = (taskId) => {
        const tasks = getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks(tasks);
        }
    };
    
 
    const startEditing = (spanElement, taskId) => {
        //jeżeli pole input już istnieje, to nie robimy nic
        if (spanElement.querySelector('input[type="text"]')) {
            return; 
        }
        //pobranie aktualnego tekstu zadania
        const currentTask = getTasks().find(t => t.id === taskId);
        if (!currentTask) return;

        //pobranie surowego tekstu
        const rawText = currentTask.text;

        //utworzenie pola input do edycji tekstu
        const input = document.createElement('input');
        input.type = 'text';
        input.value = rawText;
        input.maxLength = 255;
        input.minLength = 3; 

        //utworzenie pola input do edycji daty
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.value = currentTask.dueDate || '';

        //przyciski zapisz/anuluj
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.textContent = 'Zapisz';
        saveBtn.style.marginLeft = '8px';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Anuluj';
        cancelBtn.style.marginLeft = '6px';

        //zamiana tekstu na pola input + przyciski
        spanElement.textContent = '';
        spanElement.appendChild(input);
        spanElement.appendChild(dateInput);
        spanElement.appendChild(saveBtn);
        spanElement.appendChild(cancelBtn);
        input.focus();

        //Zapisanie edycji po naciśnięciu Enter w polu tekstowym
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });

        saveBtn.addEventListener('click', () => saveEditing(input, taskId, dateInput.value));
        cancelBtn.addEventListener('click', () => renderTasks(searchInput.value));
    };

    //zapisanie edytowanego zadania
    const saveEditing = (inputElement, taskId, dueDate) => {
        const newText = inputElement.value.trim();

        //walidacja długości tekstu
        if (newText.length < 3 || newText.length > 255) {
            alert('Zadanie musi mieć od 3 do 255 znaków! Zmiany nie zostały zapisane.');
            renderTasks(searchInput.value); 
            return;
        }

        //aktualizacja zadania w localStorage
        const tasks = getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        //jeżeli znaleziono zadanie, to aktualizujemy jego tekst i datę
        if (taskIndex !== -1) {
            tasks[taskIndex].text = newText;
            tasks[taskIndex].dueDate = dueDate || '';
            saveTasks(tasks);
            renderTasks(searchInput.value); 
        }
    };
    
    
    renderTasks(); 

   
    addTaskForm.addEventListener('submit', addTask);

    searchInput.addEventListener('input', () => {
        renderTasks(searchInput.value); 
    });
});