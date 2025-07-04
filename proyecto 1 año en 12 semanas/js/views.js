// js/views.js

// Selectores de elementos DOM
const DOMElements = {
    // Navigations
    navHomeBtn: document.getElementById('nav-home'),
    navCyclesBtn: document.getElementById('nav-cycles'),
    navGoalsBtn: document.getElementById('nav-goals'),
    navExportImportBtn: document.getElementById('nav-export-import'),

    // Views
    dashboardView: document.getElementById('dashboard-view'),
    cyclesView: document.getElementById('cycles-view'),
    goalsView: document.getElementById('goals-view'),
    exportImportView: document.getElementById('export-import-view'),

    // Dashboard
    activeCycleSummary: document.getElementById('active-cycle-summary'),
    currentCycleName: document.getElementById('current-cycle-name'),
    currentCycleDates: document.getElementById('current-cycle-dates'),
    currentCycleProgress: document.getElementById('current-cycle-progress'),
    currentCycleProgressBar: document.getElementById('current-cycle-progress-bar'),
    viewActiveCycleDetailsBtn: document.getElementById('view-active-cycle-details'),
    upcomingItemsList: document.getElementById('upcoming-items-list'),


    // Cycle Management
    addCycleBtn: document.getElementById('add-cycle-btn'),
    cycleFormContainer: document.getElementById('cycle-form-container'),
    cycleFormTitle: document.getElementById('cycle-form-title'),
    cycleForm: document.getElementById('cycle-form'),
    cycleIdInput: document.getElementById('cycle-id'),
    cycleNameInput: document.getElementById('cycle-name'),
    cycleStartDateInput: document.getElementById('cycle-start-date'),
    cancelCycleFormBtn: document.getElementById('cancel-cycle-form-btn'),
    cyclesList: document.getElementById('cycles-list'),

    // Goal Management
    selectCycleForGoals: document.getElementById('select-cycle-for-goals'),
    noCycleSelectedMessage: document.getElementById('no-cycle-selected-message'),
    addGoalBtn: document.getElementById('add-goal-btn'),
    goalFormContainer: document.getElementById('goal-form-container'),
    goalFormTitle: document.getElementById('goal-form-title'),
    goalForm: document.getElementById('goal-form'),
    goalIdInput: document.getElementById('goal-id'),
    goalCycleIdInput: document.getElementById('goal-cycle-id'),
    goalNameInput: document.getElementById('goal-name'),
    goalDescriptionInput: document.getElementById('goal-description'),
    goalTargetInput: document.getElementById('goal-target'),
    cancelGoalFormBtn: document.getElementById('cancel-goal-form-btn'),
    currentCycleGoalsName: document.getElementById('current-cycle-goals-name'),
    goalsList: document.getElementById('goals-list'),

    // Task Modal
    taskModal: document.getElementById('task-modal'),
    taskModalTitle: document.getElementById('task-modal-title'),
    modalGoalIdInput: document.getElementById('modal-goal-id'),
    addTaskBtn: document.getElementById('add-task-btn'),
    taskFormContainer: document.getElementById('task-form-container'),
    taskFormTitle: document.getElementById('task-form-title'),
    taskForm: document.getElementById('task-form'),
    taskIdInput: document.getElementById('task-id'),
    taskNameInput: document.getElementById('task-name'),
    taskDueDateInput: document.getElementById('task-due-date'),
    cancelTaskFormBtn: document.getElementById('cancel-task-form-btn'),
    tasksList: document.getElementById('tasks-list'),
    closeTaskModalBtn: document.querySelector('#task-modal .close-button'),

    // Confirm Modal
    confirmModal: document.getElementById('confirm-modal'),
    confirmModalMessage: document.getElementById('confirm-modal-message'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    closeConfirmModalBtn: document.querySelector('#confirm-modal .close-button'),

    // Export/Import
    exportDataBtn: document.getElementById('export-data-btn'),
    importFileInput: document.getElementById('import-file-input'),
    importDataBtn: document.getElementById('import-data-btn'),
    confirmImportBtn: document.getElementById('confirm-import-btn'),
    cancelImportBtn: document.getElementById('cancel-import-btn'),
    importFileName: document.getElementById('import-file-name')
};

/**
 * Renderiza la vista activa, ocultando las demás.
 * @param {HTMLElement} viewToShow - El elemento de la vista a mostrar.
 * @param {HTMLElement} activeNavButton - El botón de navegación que debe estar activo.
 */
function renderView(viewToShow, activeNavButton) {
    // Ocultar todas las vistas
    DOMElements.dashboardView.classList.add('hidden');
    DOMElements.cyclesView.classList.add('hidden');
    DOMElements.goalsView.classList.add('hidden');
    DOMElements.exportImportView.classList.add('hidden');

    // Mostrar la vista deseada
    viewToShow.classList.remove('hidden');

    // Quitar 'active' de todos los botones de navegación
    DOMElements.navHomeBtn.classList.remove('active');
    DOMElements.navCyclesBtn.classList.remove('active');
    DOMElements.navGoalsBtn.classList.remove('active');
    DOMElements.navExportImportBtn.classList.remove('active');

    // Activar el botón de navegación correspondiente
    if (activeNavButton) {
        activeNavButton.classList.add('active');
    }
}

/**
 * Muestra u oculta el formulario para crear/editar.
 * @param {HTMLElement} formContainer - El contenedor del formulario.
 * @param {HTMLElement} formTitleElement - El elemento del título del formulario.
 * @param {string} titleText - El texto del título del formulario.
 * @param {object|null} data - Los datos para poblar el formulario (para edición), o null para creación.
 * @param {Function} resetFormCallback - Función para resetear el formulario.
 */
function toggleForm(formContainer, formTitleElement, titleText, data, resetFormCallback) {
    formTitleElement.textContent = titleText;
    formContainer.classList.toggle('hidden');
    resetFormCallback(data);
}

/**
 * Renderiza la lista de ciclos.
 * @param {Array<Object>} cycles - Array de objetos Cycle.
 * @param {Function} onEdit - Callback para editar un ciclo.
 * @param {Function} onDelete - Callback para eliminar un ciclo.
 * @param {Function} onSelectForGoals - Callback para seleccionar un ciclo para ver metas.
 */
function renderCycles(cycles, onEdit, onDelete, onSelectForGoals) {
    DOMElements.cyclesList.innerHTML = '';
    if (cycles.length === 0) {
        DOMElements.cyclesList.innerHTML = '<p class="no-items-message">No hay ciclos creados aún.</p>';
        return;
    }

    cycles.forEach(cycle => {
        const cycleCard = document.createElement('div');
        cycleCard.className = 'item-card';
        cycleCard.dataset.id = cycle.id;

        cycleCard.innerHTML = `
            <h3><img src="assets/icon_cycle.png" alt="Ciclo" class="card-icon" style="height: 24px; vertical-align: middle; margin-right: 8px;">${cycle.name}</h3>
            <p class="dates">Inicio: ${cycle.startDate} | Fin: ${cycle.endDate}</p>
            <div class="card-actions">
                <button class="btn btn-secondary btn-small edit-cycle-btn">Editar</button>
                <button class="btn btn-danger btn-small delete-cycle-btn">Eliminar</button>
                <button class="btn btn-primary btn-small view-goals-btn">Ver Metas</button>
            </div>
        `;
        DOMElements.cyclesList.appendChild(cycleCard);

        cycleCard.querySelector('.edit-cycle-btn').onclick = () => onEdit(cycle.id);
        cycleCard.querySelector('.delete-cycle-btn').onclick = () => onDelete(cycle.id, 'ciclo', cycle.name);
        cycleCard.querySelector('.view-goals-btn').onclick = () => onSelectForGoals(cycle.id);
    });
}

/**
 * Renderiza el selector de ciclos para la vista de metas.
 * @param {Array<Object>} cycles - Array de objetos Cycle.
 * @param {number|null} selectedCycleId - ID del ciclo actualmente seleccionado.
 */
function renderCycleSelectForGoals(cycles, selectedCycleId = null) {
    DOMElements.selectCycleForGoals.innerHTML = '<option value="">Selecciona un Ciclo</option>';
    cycles.forEach(cycle => {
        const option = document.createElement('option');
        option.value = cycle.id;
        option.textContent = cycle.name;
        if (cycle.id === selectedCycleId) {
            option.selected = true;
        }
        DOMElements.selectCycleForGoals.appendChild(option);
    });
}

/**
 * Renderiza la lista de metas para un ciclo específico.
 * @param {Array<Object>} goals - Array de objetos Goal.
 * @param {Function} onEdit - Callback para editar una meta.
 * @param {Function} onDelete - Callback para eliminar una meta.
 * @param {Function} onManageTasks - Callback para gestionar tareas de una meta.
 * @param {Function} onUpdateGoalProgress - Callback para actualizar el progreso de una meta.
 */
function renderGoals(goals, onEdit, onDelete, onManageTasks, onUpdateGoalProgress) {
    DOMElements.goalsList.innerHTML = '';
    DOMElements.currentCycleGoalsName.textContent = goals.length > 0 ? goals[0].cycleName : '';

    if (goals.length === 0) {
        DOMElements.goalsList.innerHTML = '<p class="no-items-message">No hay metas para este ciclo aún.</p>';
        return;
    }

    goals.forEach(goal => {
        const goalCard = document.createElement('div');
        goalCard.className = 'item-card';
        goalCard.dataset.id = goal.id;

        const progressPercent = goal.progress || 0; // Asegurar que sea al menos 0

        goalCard.innerHTML = `
            <h3><img src="assets/icon_goal.png" alt="Meta" class="card-icon" style="height: 24px; vertical-align: middle; margin-right: 8px;">${goal.name}</h3>
            <p><strong>Descripción:</strong> ${goal.description}</p>
            <p><strong>Objetivo:</strong> ${goal.target}</p>
            <p class="progress-info">Progreso: ${progressPercent.toFixed(0)}%</p>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercent}%;"></div>
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary btn-small edit-goal-btn">Editar</button>
                <button class="btn btn-danger btn-small delete-goal-btn">Eliminar</button>
                <button class="btn btn-info btn-small manage-tasks-btn">Tareas (${goal.tasksCount || 0})</button>
                <input type="range" min="0" max="100" value="${progressPercent}" class="progress-slider" data-goal-id="${goal.id}">
            </div>
        `;
        DOMElements.goalsList.appendChild(goalCard);

        goalCard.querySelector('.edit-goal-btn').onclick = () => onEdit(goal.id);
        goalCard.querySelector('.delete-goal-btn').onclick = () => onDelete(goal.id, 'meta', goal.name);
        goalCard.querySelector('.manage-tasks-btn').onclick = () => onManageTasks(goal.id, goal.name);

        const progressSlider = goalCard.querySelector('.progress-slider');
        // Usar 'onchange' para evitar múltiples llamadas mientras se arrastra
        // y 'oninput' para actualizar visualmente la barra de progreso en tiempo real.
        progressSlider.oninput = (e) => {
            const bar = e.target.previousElementSibling; // La barra de progreso es el div justo antes del slider
            const info = bar.previousElementSibling; // El párrafo de info es el anterior al contenedor de la barra
            const value = e.target.value;
            bar.style.width = `${value}%`;
            info.textContent = `Progreso: ${value}%`;
        };
        progressSlider.onchange = (e) => onUpdateGoalProgress(goal.id, parseInt(e.target.value));
    });
}

/**
 * Renderiza la lista de tareas dentro del modal.
 * @param {Array<Object>} tasks - Array de objetos Task.
 * @param {Function} onToggleComplete - Callback para marcar/desmarcar tarea.
 * @param {Function} onDelete - Callback para eliminar tarea.
 */
function renderTasks(tasks, onToggleComplete, onDelete) {
    DOMElements.tasksList.innerHTML = '';
    if (tasks.length === 0) {
        DOMElements.tasksList.innerHTML = '<p class="no-items-message">No hay tareas para esta meta aún.</p>';
        return;
    }

    tasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.dataset.id = task.id;
        if (task.completed) {
            taskItem.classList.add('completed');
        }

        const dueDateText = task.dueDate ? ` (Hasta: ${task.dueDate})` : '';
        taskItem.innerHTML = `
            <span>${task.name}${dueDateText}</span>
            <div class="task-actions">
                <button class="btn btn-small btn-secondary toggle-complete-task-btn">
                    ${task.completed ? 'Deshacer' : 'Completar'}
                </button>
                <button class="btn btn-small btn-danger delete-task-btn">Eliminar</button>
            </div>
        `;
        DOMElements.tasksList.appendChild(taskItem);

        taskItem.querySelector('.toggle-complete-task-btn').onclick = () => onToggleComplete(task.id);
        taskItem.querySelector('.delete-task-btn').onclick = () => onDelete(task.id, 'tarea', task.name);
    });
}

/**
 * Muestra el modal de confirmación.
 * @param {string} message - Mensaje a mostrar.
 * @param {Function} onConfirm - Callback cuando se confirma.
 */
function showConfirmModal(message, onConfirm) {
    DOMElements.confirmModalMessage.textContent = message;
    DOMElements.confirmDeleteBtn.onclick = onConfirm;
    DOMElements.confirmModal.classList.add('visible');
}

/**
 * Oculta el modal de confirmación.
 */
function hideConfirmModal() {
    DOMElements.confirmModal.classList.remove('visible');
}

/**
 * Muestra el modal de tareas.
 * @param {number} goalId - ID de la meta a la que pertenecen las tareas.
 * @param {string} goalName - Nombre de la meta.
 */
function showTaskModal(goalId, goalName) {
    DOMElements.modalGoalIdInput.value = goalId;
    DOMElements.taskModalTitle.textContent = `Tareas para: ${goalName}`;
    DOMElements.taskModal.classList.add('visible');
    DOMElements.taskFormContainer.classList.add('hidden'); // Ocultar formulario al abrir modal
    resetTaskForm();
}

/**
 * Oculta el modal de tareas.
 */
function hideTaskModal() {
    DOMElements.taskModal.classList.remove('visible');
}

/**
 * Resetea y (opcionalmente) puebla el formulario de ciclo.
 * @param {object|null} cycle - Objeto Cycle para poblar el formulario.
 */
function resetCycleForm(cycle = null) {
    DOMElements.cycleForm.reset();
    DOMElements.cycleIdInput.value = '';
    if (cycle) {
        DOMElements.cycleIdInput.value = cycle.id;
        DOMElements.cycleNameInput.value = cycle.name;
        DOMElements.cycleStartDateInput.value = cycle.startDate;
        DOMElements.cycleFormTitle.textContent = `Editar Ciclo: ${cycle.name}`;
    } else {
        DOMElements.cycleFormTitle.textContent = `Crear Nuevo Ciclo`;
    }
}

/**
 * Resetea y (opcionalmente) puebla el formulario de meta.
 * @param {object|null} goal - Objeto Goal para poblar el formulario.
 */
function resetGoalForm(goal = null) {
    DOMElements.goalForm.reset();
    DOMElements.goalIdInput.value = '';
    DOMElements.goalCycleIdInput.value = DOMElements.selectCycleForGoals.value; // Asegurarse de que el ID del ciclo esté siempre en el input oculto
    if (goal) {
        DOMElements.goalIdInput.value = goal.id;
        DOMElements.goalNameInput.value = goal.name;
        DOMElements.goalDescriptionInput.value = goal.description;
        DOMElements.goalTargetInput.value = goal.target;
        DOMElements.goalFormTitle.textContent = `Editar Meta: ${goal.name}`;
    } else {
        DOMElements.goalFormTitle.textContent = `Crear Nueva Meta`;
    }
}

/**
 * Resetea y (opcionalmente) puebla el formulario de tarea.
 * @param {object|null} task - Objeto Task para poblar el formulario.
 */
function resetTaskForm(task = null) {
    DOMElements.taskForm.reset();
    DOMElements.taskIdInput.value = '';
    DOMElements.modalGoalIdInput.value = DOMElements.modalGoalIdInput.value; // Mantener el goalId
    if (task) {
        DOMElements.taskIdInput.value = task.id;
        DOMElements.taskNameInput.value = task.name;
        DOMElements.taskDueDateInput.value = task.dueDate;
        DOMElements.taskFormTitle.textContent = `Editar Tarea: ${task.name}`;
    } else {
        DOMElements.taskFormTitle.textContent = `Crear Nueva Tarea`;
    }
}

/**
 * Actualiza el resumen del ciclo activo en el dashboard.
 * @param {Object|null} activeCycle - El objeto Cycle activo o null.
 * @param {number} totalProgress - El progreso total del ciclo (0-100).
 */
function updateDashboardActiveCycle(activeCycle, totalProgress) {
    if (activeCycle) {
        DOMElements.currentCycleName.textContent = activeCycle.name;
        DOMElements.currentCycleDates.textContent = `Inicio: ${activeCycle.startDate} | Fin: ${activeCycle.endDate}`;
        DOMElements.currentCycleProgress.textContent = `Progreso General: ${totalProgress.toFixed(0)}%`;
        DOMElements.currentCycleProgressBar.style.width = `${totalProgress}%`;
        DOMElements.activeCycleSummary.classList.remove('no-active-cycle');
        DOMElements.viewActiveCycleDetailsBtn.style.display = 'inline-block';
        DOMElements.viewActiveCycleDetailsBtn.onclick = () => {
             // Navegar a la vista de metas y seleccionar este ciclo
            DOMElements.navGoalsBtn.click(); // Simular clic en botón de Metas
            DOMElements.selectCycleForGoals.value = activeCycle.id;
            const event = new Event('change');
            DOMElements.selectCycleForGoals.dispatchEvent(event); // Disparar evento change
        };
    } else {
        DOMElements.currentCycleName.textContent = 'No hay ciclo activo.';
        DOMElements.currentCycleDates.textContent = '';
        DOMElements.currentCycleProgress.textContent = 'Progreso General: 0%';
        DOMElements.currentCycleProgressBar.style.width = '0%';
        DOMElements.activeCycleSummary.classList.add('no-active-cycle');
        DOMElements.viewActiveCycleDetailsBtn.style.display = 'none';
    }
}

/**
 * Actualiza la lista de próximos items en el dashboard.
 * @param {Array<Object>} items - Array de metas/tareas próximas.
 */
function updateDashboardUpcomingItems(items) {
    DOMElements.upcomingItemsList.innerHTML = '';
    if (items.length === 0) {
        DOMElements.upcomingItemsList.innerHTML = '<li>No hay tareas o metas próximas.</li>';
        return;
    }
    items.forEach(item => {
        const li = document.createElement('li');
        const type = item.type === 'goal' ? 'Meta' : 'Tarea';
        const dateInfo = item.dueDate ? ` (hasta ${item.dueDate})` : '';
        li.textContent = `${type}: ${item.name} ${dateInfo}`;
        DOMElements.upcomingItemsList.appendChild(li);
    });
}

/**
 * Muestra el selector de archivo de importación y el nombre del archivo.
 * @param {File|null} file - El objeto File seleccionado, o null para resetear.
 */
function showImportFileSelection(file) {
    if (file) {
        DOMElements.importFileName.textContent = `Archivo seleccionado: ${file.name}`;
        DOMElements.confirmImportBtn.classList.remove('hidden');
        DOMElements.cancelImportBtn.classList.remove('hidden');
        DOMElements.importDataBtn.classList.add('hidden'); // Ocultar botón "Seleccionar"
    } else {
        DOMElements.importFileName.textContent = '';
        DOMElements.confirmImportBtn.classList.add('hidden');
        DOMElements.cancelImportBtn.classList.add('hidden');
        DOMElements.importDataBtn.classList.remove('hidden');
        DOMElements.importFileInput.value = ''; // Resetear el input file
    }
}


export {
    DOMElements,
    renderView,
    toggleForm,
    renderCycles,
    renderCycleSelectForGoals,
    renderGoals,
    renderTasks,
    showConfirmModal,
    hideConfirmModal,
    showTaskModal,
    hideTaskModal,
    resetCycleForm,
    resetGoalForm,
    resetTaskForm,
    updateDashboardActiveCycle,
    updateDashboardUpcomingItems,
    showImportFileSelection
};