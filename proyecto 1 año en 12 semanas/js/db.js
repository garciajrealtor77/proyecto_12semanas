// js/db.js

const DB_NAME = '12WeekYearDB';
const DB_VERSION = 1; // Increment this version if you change your database schema
const STORES = {
    CYCLES: 'cycles',
    GOALS: 'goals',
    TASKS: 'tasks'
};

let db;

/**
 * Abre la base de datos IndexedDB.
 * Si la base de datos no existe o la versión es más nueva, se creará/actualizará.
 * @returns {Promise<IDBDatabase>} Una promesa que resuelve con el objeto de la base de datos.
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Error al abrir IndexedDB:', event.target.errorCode);
            reject('Error al abrir la base de datos.');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB abierta con éxito.');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Crear o actualizar la Object Store para Ciclos
            if (!db.objectStoreNames.contains(STORES.CYCLES)) {
                db.createObjectStore(STORES.CYCLES, { keyPath: 'id', autoIncrement: true });
                console.log(`Object Store '${STORES.CYCLES}' creada.`);
            }

            // Crear o actualizar la Object Store para Metas
            if (!db.objectStoreNames.contains(STORES.GOALS)) {
                const goalsStore = db.createObjectStore(STORES.GOALS, { keyPath: 'id', autoIncrement: true });
                goalsStore.createIndex('cycleId', 'cycleId', { unique: false });
                console.log(`Object Store '${STORES.GOALS}' creada.`);
            }

            // Crear o actualizar la Object Store para Tareas
            if (!db.objectStoreNames.contains(STORES.TASKS)) {
                const tasksStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id', autoIncrement: true });
                tasksStore.createIndex('goalId', 'goalId', { unique: false });
                tasksStore.createIndex('completed', 'completed', { unique: false });
                console.log(`Object Store '${STORES.TASKS}' creada.`);
            }

            console.log('Actualización de base de datos completada.');
        };
    });
}

/**
 * Realiza una transacción IndexedDB para añadir, obtener, actualizar o eliminar datos.
 * @param {string} storeName - El nombre de la Object Store (ej. 'cycles', 'goals').
 * @param {string} mode - El modo de la transacción ('readonly' o 'readwrite').
 * @param {function(IDBObjectStore): Promise<any>} callback - Una función que recibe la Object Store y devuelve una promesa.
 * @returns {Promise<any>} Una promesa que resuelve con el resultado de la operación o rechaza con un error.
 */
function transaction(storeName, mode, callback) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('IndexedDB no está abierta.');
            return reject('Base de datos no abierta.');
        }

        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);

        tx.oncomplete = () => resolve(result);
        tx.onerror = (event) => {
            console.error(`Error en la transacción [${storeName}, ${mode}]:`, event.target.error);
            reject(event.target.error);
        };

        let result;
        try {
            // El callback se encarga de la operación (add, get, put, delete) y de establecer el resultado.
            // Es importante que el callback devuelva la request para que el resultado se resuelva en oncomplete
            const request = callback(store);
            request.onsuccess = (e) => {
                result = e.target.result;
            };
            request.onerror = (e) => {
                console.error(`Error en la operación de ${storeName}:`, e.target.error);
                reject(e.target.error);
            };
        } catch (e) {
            reject(e); // Captura errores sincrónicos dentro del callback
        }
    });
}


/**
 * Añade un nuevo objeto a una Object Store.
 * @param {string} storeName
 * @param {object} item
 * @returns {Promise<number>} La clave generada para el nuevo objeto.
 */
async function add(storeName, item) {
    return transaction(storeName, 'readwrite', (store) => store.add(item));
}

/**
 * Obtiene un objeto por su ID de una Object Store.
 * @param {string} storeName
 * @param {number} id
 * @returns {Promise<object|undefined>} El objeto o undefined si no se encuentra.
 */
async function get(storeName, id) {
    return transaction(storeName, 'readonly', (store) => store.get(id));
}

/**
 * Actualiza un objeto existente en una Object Store.
 * @param {string} storeName
 * @param {object} item - El objeto a actualizar (debe contener el keyPath 'id').
 * @returns {Promise<number>} La clave del objeto actualizado.
 */
async function update(storeName, item) {
    return transaction(storeName, 'readwrite', (store) => store.put(item));
}

/**
 * Elimina un objeto por su ID de una Object Store.
 * @param {string} storeName
 * @param {number} id
 * @returns {Promise<void>}
 */
async function remove(storeName, id) {
    return transaction(storeName, 'readwrite', (store) => store.delete(id));
}

/**
 * Obtiene todos los objetos de una Object Store.
 * @param {string} storeName
 * @returns {Promise<Array<object>>} Un array de todos los objetos.
 */
async function getAll(storeName) {
    return transaction(storeName, 'readonly', (store) => store.getAll());
}

/**
 * Obtiene objetos de una Object Store por un índice.
 * @param {string} storeName
 * @param {string} indexName
 * @param {IDBValidKey | IDBKeyRange} query
 * @returns {Promise<Array<object>>} Un array de objetos que coinciden con la consulta.
 */
async function getByIndex(storeName, indexName, query) {
    return transaction(storeName, 'readonly', (store) => store.index(indexName).getAll(query));
}

/**
 * Limpia todas las Object Stores. Usado para importación de datos.
 * @returns {Promise<void>}
 */
async function clearAllStores() {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('IndexedDB no está abierta.');
            return reject('Base de datos no abierta.');
        }
        const tx = db.transaction(Object.values(STORES), 'readwrite');

        tx.oncomplete = () => {
            console.log('Todas las stores limpiadas.');
            resolve();
        };
        tx.onerror = (event) => {
            console.error('Error al limpiar stores:', event.target.error);
            reject(event.target.error);
        };

        for (const storeName of Object.values(STORES)) {
            tx.objectStore(storeName).clear();
        }
    });
}

// Exportar las funciones para que sean accesibles en otros módulos
export { openDB, add, get, update, remove, getAll, getByIndex, clearAllStores, STORES };