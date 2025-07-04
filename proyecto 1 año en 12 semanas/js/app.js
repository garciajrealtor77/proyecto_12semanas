// js/app.js

import { openDB } from './db.js';
import { initControllers } from './controllers.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await openDB(); // Abrir la base de datos IndexedDB
        console.log('Base de datos inicializada correctamente.');
        initControllers(); // Inicializar todos los controladores de eventos
    } catch (error) {
        console.error('Fallo al inicializar la aplicación:', error);
        alert('La aplicación no pudo iniciarse correctamente. Por favor, asegúrate de que tu navegador soporta IndexedDB y consulta la consola para más detalles.');
    }
});