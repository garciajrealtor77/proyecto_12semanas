// js/controllers.js

import { STORES, add, get, update, remove, getAll, getByIndex, clearAllStores } from './db.js';
import { Cycle, Goal, Task } from './models.js';
import {
    DOMElements,
    renderView,
    toggleForm,
    renderCycles,
    renderCycleSelectForGoals,
    renderGoals,
    renderTasks,
    showConfirmModal,
    hideConfirmModal,
    showTaskModal, // <-- Asegurarnos que esta función se llama y funciona correctamente
    hideTaskModal,
    resetCycleForm,
    resetGoalForm,
    resetTaskForm,
    updateDashboardActiveCycle,
    updateDashboardUpcomingItems,
    showImportFileSelection
} from './views.js';

let currentSelectedCycleId = null; // ID del ciclo actualmente seleccionado en la vista de Metas
let confirmActionCallback = null; // Callback para el modal de confirmación

/**
 * Inicializa los controladores de eventos para la aplicación.
 */
function initControllers() {
    // --- Navegación ---
    DOMElements.navHomeBtn.addEventListener('click', () => {
        renderView(DOMElements.dashboardView, DOMElements.navHomeBtn);
        loadDashboardData();
    });
    DOMElements.navCyclesBtn.addEventListener('click', () => {
        renderView(DOMElements.cyclesView, DOMElements.navCyclesBtn);
        loadCycles();
    });
    DOMElements.navGoalsBtn.addEventListener('click', () => {
        renderView(DOMElements.goalsView, DOMElements.navGoalsBtn);
        loadGoalsViewData();
    });
    DOMElements.navExportImportBtn.addEventListener('click', () => {
        renderView(DOMElements.exportImportView, DOMElements.navExportImportBtn);
        showImportFileSelection(null); // Resetear selector al entrar a la vista
    });

    // --- Ciclos ---
    DOMElements.addCycleBtn.addEventListener('click', () => {
        toggleForm(DOMElements.cycleFormContainer, DOMElements.cycleFormTitle, 'Crear Nuevo Ciclo', null, resetCycleForm);
    });

    DOMElements.cancelCycleFormBtn.addEventListener('click', () => {
        DOMElements.cycleFormContainer.classList.add('hidden');
        resetCycleForm();
    });

    DOMElements.cycleForm.addEventListener('submit', handleCycleFormSubmit);

    // --- Metas ---
    DOMElements.selectCycleForGoals.addEventListener('change', handleCycleSelectForGoalsChange);

    DOMElements.addGoalBtn.addEventListener('click', () => {
        toggleForm(DOMElements.goalFormContainer, DOMElements.goalFormTitle, 'Crear Nueva Meta', null, resetGoalForm);
    });

    DOMElements.cancelGoalFormBtn.addEventListener('click', () => {
        DOMElements.goalFormContainer.classList.add('hidden');
        resetGoalForm();
    });

    DOMElements.goalForm.addEventListener('submit', handleGoalFormSubmit);

    // --- Tareas Modal ---
    // Este listener está en el botón 'Nueva Tarea' dentro del modal de tareas
    DOMElements.addTaskBtn.addEventListener('click', () => {
        // Al añadir una tarea, el goalId ya está en DOMElements.modalGoalIdInput
        // Pasamos el goalId actual al toggleForm para que resetTaskForm pueda usarlo
        const goalId = parseInt(DOMElements.modalGoalIdInput.value);
        toggleForm(DOMElements.taskFormContainer, DOMElements.taskFormTitle, 'Crear Nueva Tarea', { goalId: goalId }, resetTaskForm);
    });

    DOMElements.cancelTaskFormBtn.addEventListener('click', () => {
        DOMElements.taskFormContainer.classList.add('hidden');
        resetTaskForm();
    });

    DOMElements.taskForm.addEventListener('submit', handleTaskFormSubmit);

    DOMElements.closeTaskModalBtn.addEventListener('click', hideTaskModal);
    // Cerrar modal al hacer clic fuera de él
    DOMElements.taskModal.addEventListener('click', (e) => {
        if (e.target === DOMElements.taskModal) {
            hideTaskModal();
        }
    });

    // --- Confirmación de Eliminación Modal ---
    DOMElements.confirmDeleteBtn.addEventListener('click', () => {
        if (confirmActionCallback) {
            confirmActionCallback();
        }
        hideConfirmModal();
    });
    DOMElements.cancelDeleteBtn.addEventListener('click', hideConfirmModal);
    DOMElements.closeConfirmModalBtn.addEventListener('click', hideConfirmModal);
    DOMElements.confirmModal.addEventListener('click', (e) => {
        if (e.target === DOMElements.confirmModal) {
            hideConfirmModal();
        }
    });

    // --- Exportar / Importar ---
    DOMElements.exportDataBtn.addEventListener('click', exportData);
    DOMElements.importDataBtn.addEventListener('click', () => DOMElements.importFileInput.click()); // Simular clic en input file
    DOMElements.importFileInput.addEventListener('change', handleImportFileChange);
    DOMElements.confirmImportBtn.addEventListener('click', confirmImportData);
    DOMElements.cancelImportBtn.addEventListener('click', () => showImportFileSelection(null));

    // Cargar dashboard al inicio
    loadDashboardData();
}

// ---

// ### Funciones de Carga y Manejo de Datos

// #### Dashboard

/**
 * Carga y muestra los datos del dashboard.
 */
async function loadDashboardData() {
    try {
        const cycles = await getAll(STORES.CYCLES);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalizar a inicio del día
        const activeCycle = cycles.find(c => {
            const startDate = new Date(c.startDate + 'T00:00:00');
            const endDate = new Date(c.endDate + 'T00:00:00');
            return now >= startDate && now <= endDate;
        });

        let totalProgress = 0;
        let upcomingItems = [];

        if (activeCycle) {
            const goals = await getByIndex(STORES.GOALS, 'cycleId', activeCycle.id);
            if (goals.length > 0) {
                // Calcular progreso total de metas para este ciclo
                let totalGoalsProgress = 0;
                let completedGoals = 0;
                for (const goal of goals) {
                    const tasks = await getByIndex(STORES.TASKS, 'goalId', goal.id);
                    const completedTasks = tasks.filter(t => t.completed).length;
                    const goalProgress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

                    // Asegurar que el progreso de la meta se guarde si se ha calculado
                    if (goal.progress !== goalProgress) {
                        const updatedGoal = { ...goal, progress: goalProgress };
                        await update(STORES.GOALS, updatedGoal); // Actualizar progreso de la meta en la DB
                    }

                    totalGoalsProgress += goalProgress;
                    if (goalProgress === 100 && tasks.length > 0) { // Considera meta completada si todas las tareas están completas
                        completedGoals++;
                    }
                }
                totalProgress = goals.length > 0 ? totalGoalsProgress / goals.length : 0;
            }

            // Obtener tareas próximas para el ciclo activo
            for (const goal of goals) {
                const tasks = await getByIndex(STORES.TASKS, 'goalId', goal.id);
                // Filtrar tareas no completadas y con fecha límite en el futuro cercano (ej. próximas 2 semanas)
                const relevantTasks = tasks.filter(t =>
                    !t.completed &&
                    t.dueDate &&
                    new Date(t.dueDate + 'T00:00:00') >= now &&
                    new Date(t.dueDate + 'T00:00:00') <= new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)) // Próximos 14 días
                ).map(t => ({ ...t, type: 'task', parentName: goal.name })); // Añadir nombre de la meta para contexto
                upcomingItems.push(...relevantTasks);
            }

            // Considerar metas próximas sin tareas si no hay un buen progreso o si el ciclo está por terminar
            const relevantGoals = goals.filter(g =>
                (g.progress || 0) < 100 && // Si la meta no está 100% completa
                new Date(activeCycle.endDate + 'T00:00:00') >= now && // Meta aún dentro del ciclo activo
                new Date(activeCycle.endDate + 'T00:00:00') <= new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)) // Ciclo termina en 14 días
            ).map(g => ({ ...g, type: 'goal', dueDate: activeCycle.endDate, parentName: activeCycle.name }));

            upcomingItems.push(...relevantGoals);

            // Ordenar por fecha límite (tareas con fecha límite primero, luego metas por fin de ciclo)
            upcomingItems.sort((a, b) => {
                const dateA = new Date(a.dueDate || '9999-12-31'); // Poner fechas no definidas al final
                const dateB = new Date(b.dueDate || '9999-12-31');
                return dateA - dateB;
            });

        } else {
            console.log('No active cycle found.');
        }

        updateDashboardActiveCycle(activeCycle, totalProgress);
        updateDashboardUpcomingItems(upcomingItems.slice(0, 5)); // Mostrar solo los 5 más próximos

    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        alert('Error al cargar el dashboard. Consulta la consola para más detalles.');
    }
}

// ---

// #### Ciclos

/**
 * Carga y renderiza la lista de ciclos.
 */
async function loadCycles() {
    try {
        const cycles = await getAll(STORES.CYCLES);
        renderCycles(cycles, editCycle, deleteCycle, selectCycleAndShowGoals);
        DOMElements.cycleFormContainer.classList.add('hidden'); // Asegurarse de que el formulario esté oculto al cargar la lista
        resetCycleForm();
    } catch (error) {
        console.error('Error al cargar ciclos:', error);
        alert('Error al cargar los ciclos. Consulta la consola para más detalles.');
    }
}

/**
 * Maneja el envío del formulario de ciclo (crear/editar).
 * @param {Event} event
 */
async function handleCycleFormSubmit(event) {
    event.preventDefault();

    const id = DOMElements.cycleIdInput.value ? parseInt(DOMElements.cycleIdInput.value) : null;
    const name = DOMElements.cycleNameInput.value.trim();
    const startDate = DOMElements.cycleStartDateInput.value;

    if (!name || !startDate) {
        alert('Por favor, completa todos los campos requeridos para el ciclo.');
        return;
    }

    try {
        if (id) {
            // Editar ciclo existente
            const existingCycle = await get(STORES.CYCLES, id);
            if (!existingCycle) {
                alert('Ciclo no encontrado para actualizar.');
                return;
            }
            // Creamos un nuevo objeto para la actualización, copiando todas las propiedades existentes
            // y luego sobrescribiendo las que vienen del formulario.
            const updatedCycleData = {
                ...existingCycle, // Copia todas las propiedades existentes
                name: name,
                startDate: startDate,
            };
            // Para mantener la lógica que teníamos, si endDate se autocalcula en el modelo,
            // aquí es importante que el `endDate` del `updatedCycleData` se base en el nuevo `startDate`.
            // Para eso, instanciamos un Cycle temporalmente.
            const tempCycleForEndDate = new Cycle(name, startDate);
            updatedCycleData.endDate = tempCycleForEndDate.endDate;


            await update(STORES.CYCLES, updatedCycleData); // Pasamos el objeto plano
            alert('Ciclo actualizado con éxito!');
        } else {
            // Crear nuevo ciclo
            const newCycle = new Cycle(name, startDate);
            // IMPORTANTE: Creamos un objeto plano sin la propiedad 'id' si esta es null/undefined
            // para que IndexedDB genere una nueva clave.
            const cycleDataToSave = {
                name: newCycle.name,
                startDate: newCycle.startDate,
                endDate: newCycle.endDate,
                createdAt: newCycle.createdAt
            };

            await add(STORES.CYCLES, cycleDataToSave);
            alert('Ciclo creado con éxito!');
        }
        DOMElements.cycleFormContainer.classList.add('hidden');
        loadCycles(); // Recargar la lista de ciclos
        loadDashboardData(); // Actualizar dashboard
    } catch (error) {
        console.error('Error al guardar ciclo:', error);
        alert('Error al guardar el ciclo. Consulta la consola para más detalles.');
    }
}

/**
 * Carga un ciclo en el formulario para edición.
 * @param {number} cycleId - ID del ciclo a editar.
 */
async function editCycle(cycleId) {
    try {
        const cycle = await get(STORES.CYCLES, cycleId);
        if (cycle) {
            toggleForm(DOMElements.cycleFormContainer, DOMElements.cycleFormTitle, `Editar Ciclo: ${cycle.name}`, cycle, resetCycleForm);
        } else {
            alert('Ciclo no encontrado para edición.');
        }
    } catch (error) {
        console.error('Error al cargar ciclo para edición:', error);
        alert('Error al cargar ciclo para edición. Consulta la consola para más detalles.');
    }
}

/**
 * Elimina un ciclo y sus metas y tareas asociadas.
 * @param {number} cycleId - ID del ciclo a eliminar.
 * @param {string} itemType - Tipo de ítem (para el mensaje de confirmación).
 * @param {string} itemName - Nombre del ítem (para el mensaje de confirmación).
 */
function deleteCycle(cycleId, itemType, itemName) {
    confirmActionCallback = async () => {
        try {
            // Obtener todas las metas del ciclo
            const goalsToDelete = await getByIndex(STORES.GOALS, 'cycleId', cycleId);

            // Eliminar todas las tareas asociadas a esas metas
            for (const goal of goalsToDelete) {
                const tasksToDelete = await getByIndex(STORES.TASKS, 'goalId', goal.id);
                for (const task of tasksToDelete) {
                    await remove(STORES.TASKS, task.id);
                }
                // Eliminar la meta
                await remove(STORES.GOALS, goal.id);
            }

            // Finalmente, eliminar el ciclo
            await remove(STORES.CYCLES, cycleId);

            alert(`"${itemName}" y todos sus elementos relacionados han sido eliminados.`);
            loadCycles(); // Recargar la lista de ciclos
            loadDashboardData(); // Actualizar dashboard
        } catch (error) {
            console.error('Error al eliminar ciclo y sus dependencias:', error);
            alert('Error al eliminar el ciclo. Consulta la consola para más detalles.');
        }
    };
    showConfirmModal(`¿Estás seguro de que quieres eliminar el ${itemType} "${itemName}"? Se eliminarán también todas las metas y tareas asociadas.`, confirmActionCallback);
}

// ---

// #### Metas

/**
 * Carga los datos necesarios para la vista de Metas (selector de ciclos y metas del ciclo seleccionado).
 */
async function loadGoalsViewData() {
    try {
        const cycles = await getAll(STORES.CYCLES);
        renderCycleSelectForGoals(cycles, currentSelectedCycleId);

        // Si ya hay un ciclo seleccionado, cargar sus metas
        if (currentSelectedCycleId) {
            await loadGoalsForSelectedCycle(currentSelectedCycleId);
            DOMElements.addGoalBtn.classList.remove('hidden');
            DOMElements.noCycleSelectedMessage.classList.add('hidden');
        } else {
            DOMElements.goalsList.innerHTML = '<p class="no-items-message">No hay metas para este ciclo aún.</p>';
            DOMElements.addGoalBtn.classList.add('hidden');
            DOMElements.noCycleSelectedMessage.classList.remove('hidden');
        }
        DOMElements.goalFormContainer.classList.add('hidden'); // Asegurarse de que el formulario esté oculto
        resetGoalForm();
    } catch (error) {
        console.error('Error al cargar datos de la vista de metas:', error);
        alert('Error al cargar la vista de metas. Consulta la consola para más detalles.');
    }
}

/**
 * Maneja el cambio en el selector de ciclos en la vista de Metas.
 * @param {Event} event
 */
async function handleCycleSelectForGoalsChange(event) {
    currentSelectedCycleId = event.target.value ? parseInt(event.target.value) : null;
    if (currentSelectedCycleId) {
        await loadGoalsForSelectedCycle(currentSelectedCycleId);
        DOMElements.addGoalBtn.classList.remove('hidden');
        DOMElements.noCycleSelectedMessage.classList.add('hidden');
    } else {
        DOMElements.goalsList.innerHTML = '<p class="no-items-message">No hay metas para este ciclo aún.</p>';
        DOMElements.addGoalBtn.classList.add('hidden');
        DOMElements.noCycleSelectedMessage.classList.remove('hidden');
    }
    DOMElements.goalFormContainer.classList.add('hidden'); // Ocultar formulario al cambiar de ciclo
    resetGoalForm();
}

/**
 * Carga y renderiza las metas para un ciclo específico.
 * @param {number} cycleId - ID del ciclo.
 */
async function loadGoalsForSelectedCycle(cycleId) {
    try {
        const goals = await getByIndex(STORES.GOALS, 'cycleId', cycleId);
        const cycle = await get(STORES.CYCLES, cycleId); // Para obtener el nombre del ciclo
        const goalsWithTaskCount = [];

        // Para cada meta, contar sus tareas y añadir el nombre del ciclo
        for (const goal of goals) {
            const tasks = await getByIndex(STORES.TASKS, 'goalId', goal.id);
            goalsWithTaskCount.push({
                ...goal,
                tasksCount: tasks.length,
                cycleName: cycle ? cycle.name : 'Desconocido' // Añadir nombre del ciclo
            });
        }
        renderGoals(goalsWithTaskCount, editGoal, deleteGoal, manageTasksForGoal, updateGoalProgress);
    } catch (error) {
        console.error('Error al cargar metas para el ciclo:', error);
        alert('Error al cargar metas. Consulta la consola para más detalles.');
    }
}

/**
 * Navega a la vista de metas y selecciona el ciclo especificado.
 * @param {number} cycleId - ID del ciclo a seleccionar.
 */
function selectCycleAndShowGoals(cycleId) {
    currentSelectedCycleId = cycleId; // Establecer el ciclo actual
    DOMElements.navGoalsBtn.click(); // Simular clic en el botón de Metas para cambiar la vista
    // La función handleCycleSelectForGoalsChange será llamada por el evento 'change'
    // que se dispara cuando se asigna el valor al select en loadGoalsViewData()
    // Asegurarse de que el select se actualice y dispare el evento
    DOMElements.selectCycleForGoals.value = cycleId;
    const event = new Event('change');
    DOMElements.selectCycleForGoals.dispatchEvent(event);
}

/**
 * Maneja el envío del formulario de meta (crear/editar).
 * @param {Event} event
 */
async function handleGoalFormSubmit(event) {
    event.preventDefault();

    const id = DOMElements.goalIdInput.value ? parseInt(DOMElements.goalIdInput.value) : null;
    const cycleId = parseInt(DOMElements.goalCycleIdInput.value);
    const name = DOMElements.goalNameInput.value.trim();
    const description = DOMElements.goalDescriptionInput.value.trim();
    const target = DOMElements.goalTargetInput.value.trim();

    if (!name || !target || !cycleId) {
        alert('Por favor, completa todos los campos requeridos para la meta y selecciona un ciclo.');
        return;
    }

    try {
        if (id) {
            // Editar meta existente
            const existingGoal = await get(STORES.GOALS, id);
            if (!existingGoal) {
                alert('Meta no encontrada para actualizar.');
                return;
            }
            // Creamos un nuevo objeto plano para la actualización, copiando las propiedades existentes
            // y sobrescribiendo las que vienen del formulario.
            const updatedGoalData = {
                ...existingGoal, // Copia todas las propiedades existentes
                cycleId: cycleId, // Asegurarse de que el cycleId se mantenga o actualice si se permite
                name: name,
                description: description,
                target: target,
            };
            await update(STORES.GOALS, updatedGoalData); // Pasamos el objeto plano
            alert('Meta actualizada con éxito!');
        } else {
            // Crear nueva meta
            const newGoal = new Goal(cycleId, name, description, target);
            // Objeto plano para add()
            const goalDataToSave = {
                cycleId: newGoal.cycleId,
                name: newGoal.name,
                description: newGoal.description,
                target: newGoal.target,
                completed: newGoal.completed,
                progress: newGoal.progress,
                createdAt: newGoal.createdAt
            };
            await add(STORES.GOALS, goalDataToSave);
            alert('Meta creada con éxito!');
        }
        // Estas líneas deben ir aquí, después del if/else
        DOMElements.goalFormContainer.classList.add('hidden'); // Ocultar formulario
        loadGoalsForSelectedCycle(currentSelectedCycleId); // Recargar metas
        loadDashboardData(); // Actualizar dashboard
    } catch (error) {
        console.error('Error al guardar meta:', error);
        alert('Error al guardar la meta. Consulta la consola para más detalles.');
    }
}

/**
 * Carga una meta en el formulario para edición.
 * @param {number} goalId - ID de la meta a editar.
 */
async function editGoal(goalId) {
    try {
        const goal = await get(STORES.GOALS, goalId);
        if (goal) {
            toggleForm(DOMElements.goalFormContainer, DOMElements.goalFormTitle, `Editar Meta: ${goal.name}`, goal, resetGoalForm);
        } else {
            alert('Meta no encontrada para edición.');
        }
    } catch (error) {
        console.error('Error al cargar meta para edición:', error);
        alert('Error al cargar meta para edición. Consulta la consola para más detalles.');
    }
}

/**
 * Elimina una meta y sus tareas asociadas.
 * @param {number} goalId - ID de la meta a eliminar.
 * @param {string} itemType - Tipo de ítem (para el mensaje de confirmación).
 * @param {string} itemName - Nombre del ítem (para el mensaje de confirmación).
 */
function deleteGoal(goalId, itemType, itemName) {
    confirmActionCallback = async () => {
        try {
            // Eliminar todas las tareas asociadas a esta meta
            const tasksToDelete = await getByIndex(STORES.TASKS, 'goalId', goalId);
            for (const task of tasksToDelete) {
                await remove(STORES.TASKS, task.id);
            }
            // Finalmente, eliminar la meta
            await remove(STORES.GOALS, goalId);
            alert(`"${itemName}" y sus tareas asociadas han sido eliminados.`);
            loadGoalsForSelectedCycle(currentSelectedCycleId); // Recargar la lista de metas
            loadDashboardData(); // Actualizar dashboard
        } catch (error) {
            console.error('Error al eliminar meta y tareas:', error);
            alert('Error al eliminar la meta. Consulta la consola para más detalles.');
        }
    };
    showConfirmModal(`¿Estás seguro de que quieres eliminar la ${itemType} "${itemName}"? Se eliminarán también todas las tareas asociadas.`, confirmActionCallback);
}

/**
 * Actualiza el progreso de una meta.
 * @param {number} goalId - ID de la meta.
 * @param {number} progressValue - Valor del progreso (0-100).
 */
async function updateGoalProgress(goalId, progressValue) {
    try {
        const goal = await get(STORES.GOALS, goalId);
        if (goal) {
            // Crea un nuevo objeto plano para asegurar que solo se actualicen los datos necesarios
            const updatedGoalData = {
                ...goal, // Copia todas las propiedades existentes
                progress: progressValue,
            };
            await update(STORES.GOALS, updatedGoalData);
            loadDashboardData(); // Para que el progreso general del ciclo se actualice
        }
    } catch (error) {
        console.error('Error al actualizar progreso de meta:', error);
        alert('Error al actualizar progreso de meta. Consulta la consola para más detalles.');
    }
}

// ---

// #### Tareas

/**
 * Abre el modal de gestión de tareas para una meta.
 * @param {number} goalId - ID de la meta.
 * @param {string} goalName - Nombre de la meta.
 */
async function manageTasksForGoal(goalId, goalName) {
    // Al abrir el modal de tareas, asegúrate de que el formulario de añadir/editar tarea esté oculto y limpio
    DOMElements.taskFormContainer.classList.add('hidden');
    resetTaskForm();
    showTaskModal(goalId, goalName); // Esto debería hacer visible el modal
    await loadTasksForGoal(goalId);
}

/**
 * Carga y renderiza las tareas para una meta específica en el modal.
 * @param {number} goalId - ID de la meta.
 */
async function loadTasksForGoal(goalId) {
    try {
        const tasks = await getByIndex(STORES.TASKS, 'goalId', goalId);
        renderTasks(tasks, toggleTaskComplete, deleteTask);
    } // Agregamos catch para manejar errores en loadTasksForGoal
    catch (error) {
        console.error('Error al cargar tareas:', error);
        alert('Error al cargar las tareas. Consulta la consola para más detalles.');
    }
}

/**
 * Maneja el envío del formulario de tarea (crear/editar).
 * @param {Event} event
 */
async function handleTaskFormSubmit(event) {
    event.preventDefault();

    const id = DOMElements.taskIdInput.value ? parseInt(DOMElements.taskIdInput.value) : null;
    const goalId = parseInt(DOMElements.modalGoalIdInput.value);
    const name = DOMElements.taskNameInput.value.trim();
    const dueDate = DOMElements.taskDueDateInput.value || null; // Puede ser opcional

    if (!name || !goalId) {
        alert('Por favor, completa el nombre de la tarea.');
        return;
    }

    try {
        if (id) {
            // Editar tarea existente
            const existingTask = await get(STORES.TASKS, id);
            if (!existingTask) {
                alert('Tarea no encontrada para actualizar.');
                return;
            }
            // Crea un nuevo objeto plano para la actualización, copiando propiedades existentes
            const updatedTaskData = {
                ...existingTask, // Copia todas las propiedades existentes
                goalId: goalId,
                name: name,
                dueDate: dueDate,
            };
            await update(STORES.TASKS, updatedTaskData); // Pasamos el objeto plano
            alert('Tarea actualizada con éxito!');
        } else {
            // Crear nueva tarea
            const newTask = new Task(goalId, name, dueDate);
            // Objeto plano para add()
            const taskDataToSave = {
                goalId: newTask.goalId,
                name: newTask.name,
                dueDate: newTask.dueDate,
                completed: newTask.completed,
                createdAt: newTask.createdAt
            };
            await add(STORES.TASKS, taskDataToSave);
            alert('Tarea creada con éxito!');
        }
        await loadTasksForGoal(goalId); // Recargar la lista de tareas en el modal
        DOMElements.taskFormContainer.classList.add('hidden'); // Ocultar formulario
        // No ocultamos el modal principal aquí, solo el formulario de la tarea individual
        // El modal principal se cierra con el botón de cerrar o al hacer clic fuera.
        loadDashboardData(); // Actualiza el dashboard
    } catch (error) {
        console.error('Error al guardar tarea:', error);
        alert('Error al guardar la tarea. Consulta la consola para más detalles.');
    }
}

/**
 * Marca o desmarca una tarea como completada.
 * @param {number} taskId - ID de la tarea.
 */
async function toggleTaskComplete(taskId) {
    try {
        const task = await get(STORES.TASKS, taskId);
        if (task) {
            // Crea un nuevo objeto plano para asegurar que solo se actualicen los datos necesarios
            const updatedTaskData = {
                ...task, // Copia todas las propiedades existentes
                completed: !task.completed,
            };
            await update(STORES.TASKS, updatedTaskData);
            await loadTasksForGoal(task.goalId); // Recargar la lista de tareas
            loadDashboardData(); // Actualiza el dashboard
        }
    } catch (error) {
        console.error('Error al cambiar estado de tarea:', error);
        alert('Error al cambiar estado de tarea. Consulta la consola para más detalles.');
    }
}

/**
 * Elimina una tarea.
 * @param {number} taskId - ID de la tarea a eliminar.
 * @param {string} itemType - Tipo de ítem (para el mensaje de confirmación).
 * @param {string} itemName - Nombre del ítem (para el mensaje de confirmación).
 */
function deleteTask(taskId, itemType, itemName) {
    confirmActionCallback = async () => {
        try {
            const task = await get(STORES.TASKS, taskId); // Necesitamos el goalId para recargar
            if (task) {
                await remove(STORES.TASKS, taskId);
                alert(`"${itemName}" ha sido eliminada.`);
                await loadTasksForGoal(task.goalId); // Recargar la lista de tareas en el modal
                loadDashboardData(); // Actualiza el dashboard
            }
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            alert('Error al eliminar la tarea. Consulta la consola para más detalles.');
        }
    };
    showConfirmModal(`¿Estás seguro de que quieres eliminar la ${itemType} "${itemName}"?`, confirmActionCallback);
}

// ---

// #### Exportar / Importar

/**
 * Exporta todos los datos de la aplicación a un archivo JSON.
 */
async function exportData() {
    try {
        const allCycles = await getAll(STORES.CYCLES);
        const allGoals = await getAll(STORES.GOALS);
        const allTasks = await getAll(STORES.TASKS);

        const dataToExport = {
            cycles: allCycles,
            goals: allGoals,
            tasks: allTasks
        };

        const jsonString = JSON.stringify(dataToExport, null, 2); // Formato legible
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `mi-ano-12-semanas-backup-${date}.json`;
        document.body.appendChild(a); // Necesario para Firefox
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Datos exportados con éxito! Se ha descargado un archivo JSON.');
    } catch (error) {
        console.error('Error al exportar datos:', error);
        alert('Error al exportar datos. Consulta la consola para más detalles.');
    }
}

let importedFile = null; // Variable para almacenar el archivo seleccionado para importar

/**
 * Maneja la selección de un archivo JSON para importar.
 * @param {Event} event
 */
function handleImportFileChange(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.type !== 'application/json') {
            alert('Por favor, selecciona un archivo JSON válido.');
            showImportFileSelection(null);
            return;
        }
        importedFile = file;
        showImportFileSelection(file);
    } else {
        importedFile = null;
        showImportFileSelection(null);
    }
}

/**
 * Confirma y realiza la importación de datos desde el archivo JSON seleccionado.
 */
function confirmImportData() {
    if (!importedFile) {
        alert('No hay archivo seleccionado para importar.');
        return;
    }

    showConfirmModal('¿Estás seguro de que quieres importar estos datos? ¡Esto sobrescribirá todos los datos existentes en la aplicación!', async () => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (!data.cycles || !data.goals || !data.tasks) {
                    throw new Error('El archivo JSON no tiene la estructura de datos esperada (debe contener "cycles", "goals" y "tasks").');
                }

                // Limpiar todas las stores existentes antes de importar
                await clearAllStores();

                // Importar ciclos, asegurando que los IDs se mantengan para la relación
                for (const cycleData of data.cycles) {
                    await add(STORES.CYCLES, cycleData); // IndexedDB re-usará IDs si se le dan, o generará nuevos si no
                }
                // Importar metas
                for (const goalData of data.goals) {
                    await add(STORES.GOALS, goalData);
                }
                // Importar tareas
                for (const taskData of data.tasks) {
                    await add(STORES.TASKS, taskData);
                }

                alert('Datos importados con éxito! La aplicación se recargará.');
                location.reload(); // Recargar la página para asegurar que todos los datos se carguen correctamente
            } catch (error) {
                console.error('Error al importar datos:', error);
                alert(`Error al importar datos: ${error.message}. Asegúrate de que el archivo es válido.`);
            } finally {
                importedFile = null;
                hideConfirmModal();
                showImportFileSelection(null); // Resetear UI de importación
            }
        };
        reader.onerror = (e) => {
            console.error('Error al leer el archivo:', e);
            alert('Error al leer el archivo. Inténtalo de nuevo.');
            importedFile = null;
            hideConfirmModal();
            showImportFileSelection(null);
        };
        reader.readAsText(importedFile);
    });
}

export { initControllers };