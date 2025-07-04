// js/models.js

// Usamos el patrón de clases para los modelos de datos
// Esto ayuda a organizar la estructura y la lógica relacionada con los datos

/**
 * Representa un Ciclo de 12 Semanas.
 */
class Cycle {
    constructor(name, startDate, id = null) {
        this.id = id; // ID será autogenerado por IndexedDB si es nuevo
        this.name = name;
        this.startDate = startDate; // Formato 'YYYY-MM-DD'
        this.endDate = this.calculateEndDate(startDate); // Calculada automáticamente
        this.createdAt = new Date().toISOString(); // Marca de tiempo de creación
    }

    /**
     * Calcula la fecha de fin de un ciclo (12 semanas después de la fecha de inicio).
     * @param {string} startDateString - La fecha de inicio en formato 'YYYY-MM-DD'.
     * @returns {string} La fecha de fin en formato 'YYYY-MM-DD'.
     */
    calculateEndDate(startDateString) {
        const startDate = new Date(startDateString + 'T00:00:00'); // Añadir 'T00:00:00' para evitar problemas de zona horaria
        startDate.setDate(startDate.getDate() + (12 * 7) - 1); // 12 semanas * 7 días - 1 día para que el último día sea inclusivo
        return startDate.toISOString().split('T')[0];
    }

    /**
     * Calcula el progreso de un ciclo basado en el progreso de sus metas.
     * Esto se calculará en el controlador, no es una propiedad del modelo en sí.
     * @returns {number} Porcentaje de progreso (0-100).
     */
    // getProgress(goals) { ... lógica en el controlador }
}

/**
 * Representa una Meta dentro de un Ciclo.
 */
class Goal {
    constructor(cycleId, name, description, target, id = null) {
        this.id = id;
        this.cycleId = cycleId; // Relación con el ciclo al que pertenece
        this.name = name;
        this.description = description;
        this.target = target; // Métrica o resultado deseado
        this.completed = false; // Estado de completitud
        this.progress = 0; // Porcentaje de progreso de la meta (0-100)
        this.createdAt = new Date().toISOString();
    }
}

/**
 * Representa una Tarea dentro de una Meta.
 */
class Task {
    constructor(goalId, name, dueDate = null, id = null) {
        this.id = id;
        this.goalId = goalId; // Relación con la meta a la que pertenece
        this.name = name;
        this.dueDate = dueDate; // Formato 'YYYY-MM-DD', opcional
        this.completed = false; // Estado de completitud de la tarea
        this.createdAt = new Date().toISOString();
    }
}

// Exportar las clases para que puedan ser usadas en otros archivos
export { Cycle, Goal, Task };