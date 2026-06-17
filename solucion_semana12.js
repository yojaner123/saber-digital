// ========== MODELO (POO) ==========
class Libro {
    #id;
    #titulo;
    #autor;
    #categoria;
    #anio;
    #disponible;
    #lecturas;
    
    constructor(id, titulo, autor, categoria, anio, disponible = true, lecturas = 0) {
        this.#id = id;
        this.#titulo = titulo;
        this.#autor = autor;
        this.#categoria = categoria;
        this.#anio = anio;
        this.#disponible = disponible;
        this.#lecturas = lecturas;
    }
    
    // Getters
    getId() { return this.#id; }
    getTitulo() { return this.#titulo; }
    getAutor() { return this.#autor; }
    getCategoria() { return this.#categoria; }
    getAnio() { return this.#anio; }
    isDisponible() { return this.#disponible; }
    getLecturas() { return this.#lecturas; }
    
    // Setters
    setTitulo(t) { this.#titulo = t; }
    setAutor(a) { this.#autor = a; }
    setCategoria(c) { this.#categoria = c; }
    setAnio(a) { this.#anio = a; }

    prestar() {
        if (!this.#disponible) throw new Error("El libro ya está prestado.");
        this.#disponible = false;
        this.registrarLectura();
    }

    devolver() {
        if (this.#disponible) throw new Error("El libro ya se encuentra disponible.");
        this.#disponible = true;
    }
    
    registrarLectura() {
        this.#lecturas++;
    }
    
    toJSON() {
        return {
            id: this.#id,
            titulo: this.#titulo,
            autor: this.#autor,
            categoria: this.#categoria,
            anio: this.#anio,
            disponible: this.#disponible,
            lecturas: this.#lecturas
        };
    }

    static fromJSON(data) {
        return new Libro(
            data.id,
            data.titulo,
            data.autor,
            data.categoria,
            data.anio,
            data.disponible,
            data.lecturas
        );
    }
}

// Clase Biblioteca (gestión de colección)
class Biblioteca {
    #libros;
    #contadorId;
    
    constructor() {
        this.#libros = [];
        this.#contadorId = 1;
        this.cargarDatos();
    }

    guardarDatos() {
        const datos = {
            contadorId: this.#contadorId,
            libros: this.#libros.map(l => l.toJSON())
        };
        localStorage.setItem('biblioteca_datos', JSON.stringify(datos));
    }

    cargarDatos() {
        const datosGuardados = localStorage.getItem('biblioteca_datos');
        if (datosGuardados) {
            const datos = JSON.parse(datosGuardados);
            this.#contadorId = datos.contadorId;
            this.#libros = datos.libros.map(l => Libro.fromJSON(l));
        } else {
            this.#inicializarDatos();
        }
    }
    
    #inicializarDatos() {
        // Libros de ejemplo
        const librosEjemplo = [
            ["El Quijote", "Miguel de Cervantes", "Literatura", 1605, 120],
            ["Cien años de soledad", "Gabriel García Márquez", "Ficción", 1967, 85],
            ["La sombra del viento", "Carlos Ruiz Zafón", "Ficción", 2001, 42],
            ["Sapiens", "Yuval Noah Harari", "Historia", 2011, 95],
            ["Breve historia del tiempo", "Stephen Hawking", "Ciencia", 1988, 60]
        ];
        
        librosEjemplo.forEach(([titulo, autor, categoria, anio, lecturas]) => {
            const libro = new Libro(this.#contadorId++, titulo, autor, categoria, anio, true, lecturas);
            this.#libros.push(libro);
        });
        this.guardarDatos();
    }
    
    agregarLibro(titulo, autor, categoria, anio) {
        const duplicado = this.#libros.find(
            libro => libro.getTitulo().toLowerCase() === titulo.toLowerCase() && 
                     libro.getAutor().toLowerCase() === autor.toLowerCase()
        );
        
        if (duplicado) {
            throw new Error(`El libro "${titulo}" del autor "${autor}" ya existe en el catálogo.`);
        }
        
        const nuevoLibro = new Libro(this.#contadorId++, titulo, autor, categoria, anio);
        this.#libros.push(nuevoLibro);
        this.guardarDatos();
        return nuevoLibro;
    }

    actualizarLibro(id, titulo, autor, categoria, anio) {
        const libro = this.obtenerLibro(id);
        if (!libro) throw new Error("Libro no encontrado.");
        
        // Verificar duplicados (excluyendo el actual)
        const duplicado = this.#libros.find(
            l => l.getId() !== id && 
                 l.getTitulo().toLowerCase() === titulo.toLowerCase() && 
                 l.getAutor().toLowerCase() === autor.toLowerCase()
        );
        
        if (duplicado) {
            throw new Error(`El libro "${titulo}" del autor "${autor}" ya existe en el catálogo.`);
        }

        libro.setTitulo(titulo);
        libro.setAutor(autor);
        libro.setCategoria(categoria);
        libro.setAnio(anio);
        this.guardarDatos();
        return libro;
    }
    
    listarLibros() {
        return [...this.#libros];
    }

    obtenerLibro(id) {
        return this.#libros.find(libro => libro.getId() === id);
    }
    
    buscarPorTitulo(texto) {
        return this.#libros.filter(libro => 
            libro.getTitulo().toLowerCase().includes(texto.toLowerCase())
        );
    }
    
    eliminarLibro(id) {
        const index = this.#libros.findIndex(libro => libro.getId() === id);
        if (index !== -1) {
            this.#libros.splice(index, 1);
            this.guardarDatos();
            return true;
        }
        return false;
    }

    prestarLibro(id) {
        const libro = this.obtenerLibro(id);
        if (libro) {
            libro.prestar();
            this.guardarDatos();
        }
    }

    devolverLibro(id) {
        const libro = this.obtenerLibro(id);
        if (libro) {
            libro.devolver();
            this.guardarDatos();
        }
    }

    obtenerEstadisticas() {
        const totalLibros = this.#libros.length;
        const librosPrestados = this.#libros.filter(l => !l.isDisponible()).length;
        const librosDisponibles = totalLibros - librosPrestados;
        const totalLecturas = this.#libros.reduce((sum, l) => sum + l.getLecturas(), 0);

        // Por categoría
        const porCategoria = {};
        this.#libros.forEach(l => {
            const cat = l.getCategoria();
            porCategoria[cat] = (porCategoria[cat] || 0) + 1;
        });

        const topLeidos = [...this.#libros]
            .sort((a, b) => b.getLecturas() - a.getLecturas())
            .slice(0, 5)
            .map(l => l.toJSON());

        return {
            totalLibros,
            librosPrestados,
            librosDisponibles,
            totalLecturas,
            porCategoria,
            topLeidos
        };
    }
}

// ========== CONTROLADOR ==========
class ControladorBiblioteca {
    constructor() {
        this.biblioteca = new Biblioteca();
        this.libroEnEdicionId = null;
        this.inicializar();
    }
    
    inicializar() {
        this.actualizarTabla();
        this.configurarEventos();
        this.configurarTema();
    }
    
    configurarTema() {
        const checkbox = document.getElementById('checkbox');
        const html = document.documentElement;
        
        const savedTheme = localStorage.getItem('temaBiblioteca') || 'light';
        html.setAttribute('data-bs-theme', savedTheme);
        checkbox.checked = savedTheme === 'dark';
        
        checkbox.addEventListener('change', () => {
            const newTheme = checkbox.checked ? 'dark' : 'light';
            html.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('temaBiblioteca', newTheme);
        });
    }
    
    actualizarTabla() {
        const tbody = document.getElementById('cuerpoTabla');
        tbody.innerHTML = '';
        
        const libros = this.biblioteca.listarLibros();
        
        if (libros.length === 0) {
            const fila = tbody.insertRow();
            const celda = fila.insertCell(0);
            celda.colSpan = 8;
            celda.textContent = 'No hay libros registrados';
            celda.className = 'text-center text-muted py-4';
            return;
        }
        
        libros.forEach(libro => {
            const fila = tbody.insertRow();
            fila.className = "align-middle";
            fila.insertCell(0).textContent = libro.getId();
            fila.insertCell(1).textContent = libro.getTitulo();
            fila.insertCell(2).textContent = libro.getAutor();
            
            const celdaCategoria = fila.insertCell(3);
            celdaCategoria.innerHTML = `<span class="badge bg-secondary">${libro.getCategoria()}</span>`;
            
            fila.insertCell(4).textContent = libro.getAnio();
            fila.insertCell(5).textContent = libro.getLecturas();
            
            const celdaEstado = fila.insertCell(6);
            const estadoSpan = document.createElement('span');
            estadoSpan.className = `badge ${libro.isDisponible() ? 'bg-success' : 'bg-warning text-dark'}`;
            estadoSpan.textContent = libro.isDisponible() ? 'Disponible' : 'Prestado';
            celdaEstado.appendChild(estadoSpan);

            // Acciones CRUD y Préstamo
            const celdaAcciones = fila.insertCell(7);
            const divAcciones = document.createElement('div');
            divAcciones.className = 'd-flex gap-1 flex-wrap';

            // Editar
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn btn-sm btn-outline-primary';
            btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
            btnEditar.title = 'Editar';
            btnEditar.onclick = () => this.abrirModalEdicion(libro.getId());
            
            // Eliminar
            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'btn btn-sm btn-outline-danger';
            btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
            btnEliminar.title = 'Eliminar';
            btnEliminar.onclick = () => this.eliminarLibro(libro.getId());

            // Prestar / Devolver
            const btnPrestamo = document.createElement('button');
            if (libro.isDisponible()) {
                btnPrestamo.className = 'btn btn-sm btn-outline-success';
                btnPrestamo.innerHTML = '<i class="bi bi-box-arrow-up-right"></i> Prestar';
                btnPrestamo.onclick = () => this.prestarLibro(libro.getId());
            } else {
                btnPrestamo.className = 'btn btn-sm btn-outline-warning';
                btnPrestamo.innerHTML = '<i class="bi bi-box-arrow-in-down-left"></i> Devolver';
                btnPrestamo.onclick = () => this.devolverLibro(libro.getId());
            }

            divAcciones.appendChild(btnEditar);
            divAcciones.appendChild(btnEliminar);
            divAcciones.appendChild(btnPrestamo);
            celdaAcciones.appendChild(divAcciones);
        });
    }
    
    // Acciones de UI
    agregarLibroDesdeFormulario(titulo, autor, categoria, anio) {
        if (!this.validarCampos(titulo, autor, categoria, anio)) return false;
        
        try {
            this.biblioteca.agregarLibro(titulo, autor, categoria, parseInt(anio));
            this.actualizarTabla();
            this.mostrarAlerta(`Libro "${titulo}" agregado exitosamente`, 'success');
            return true;
        } catch (error) {
            this.mostrarAlerta(error.message, 'danger');
            return false;
        }
    }

    abrirModalEdicion(id) {
        const libro = this.biblioteca.obtenerLibro(id);
        if(!libro) return;
        
        this.libroEnEdicionId = id;
        document.getElementById('edit_titulo').value = libro.getTitulo();
        document.getElementById('edit_autor').value = libro.getAutor();
        document.getElementById('edit_categoria').value = libro.getCategoria();
        document.getElementById('edit_anio').value = libro.getAnio();

        const modal = new bootstrap.Modal(document.getElementById('modalEditarLibro'));
        modal.show();
    }

    guardarEdicion() {
        if (this.libroEnEdicionId === null) return;

        const titulo = document.getElementById('edit_titulo').value.trim();
        const autor = document.getElementById('edit_autor').value.trim();
        const categoria = document.getElementById('edit_categoria').value;
        const anio = document.getElementById('edit_anio').value;

        if (!this.validarCampos(titulo, autor, categoria, anio)) return;

        try {
            this.biblioteca.actualizarLibro(this.libroEnEdicionId, titulo, autor, categoria, parseInt(anio));
            this.actualizarTabla();
            this.mostrarAlerta(`Libro actualizado exitosamente`, 'success');
            
            const modalEl = document.getElementById('modalEditarLibro');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            this.libroEnEdicionId = null;
        } catch (error) {
            this.mostrarAlerta(error.message, 'danger');
        }
    }

    eliminarLibro(id) {
        if(confirm("¿Estás seguro de que deseas eliminar este libro?")) {
            this.biblioteca.eliminarLibro(id);
            this.actualizarTabla();
            this.mostrarAlerta('Libro eliminado exitosamente', 'success');
        }
    }

    prestarLibro(id) {
        try {
            this.biblioteca.prestarLibro(id);
            this.actualizarTabla();
            this.mostrarAlerta('Libro prestado exitosamente. Lectura registrada.', 'info');
        } catch(e) {
            this.mostrarAlerta(e.message, 'danger');
        }
    }

    devolverLibro(id) {
        try {
            this.biblioteca.devolverLibro(id);
            this.actualizarTabla();
            this.mostrarAlerta('Libro devuelto exitosamente', 'success');
        } catch(e) {
            this.mostrarAlerta(e.message, 'danger');
        }
    }

    validarCampos(titulo, autor, categoria, anio) {
        if (!titulo || !autor || !categoria || !anio) {
            this.mostrarAlerta('Todos los campos son obligatorios', 'danger');
            return false;
        }
        if (isNaN(anio) || anio < 1000 || anio > new Date().getFullYear()) {
            this.mostrarAlerta('Año inválido', 'danger');
            return false;
        }
        return true;
    }
    
    mostrarAlerta(mensaje, tipo) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${tipo} alert-dismissible fade show shadow-sm`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${tipo === 'success' ? '<i class="bi bi-check-circle-fill me-2"></i>' : (tipo === 'info' ? '<i class="bi bi-info-circle-fill me-2"></i>' : '<i class="bi bi-exclamation-triangle-fill me-2"></i>')}
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar alerta"></button>
        `;
        
        const container = document.querySelector('.card-body');
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
            setTimeout(() => alertDiv.remove(), 150);
        }, 4000);
    }
    
    abrirDashboard() {
        const stats = this.biblioteca.obtenerEstadisticas();
        
        document.getElementById('stat_total').textContent = stats.totalLibros;
        document.getElementById('stat_disponibles').textContent = stats.librosDisponibles;
        document.getElementById('stat_prestados').textContent = stats.librosPrestados;
        document.getElementById('stat_lecturas').textContent = stats.totalLecturas;

        // Distribución por categoría
        const listaCat = document.getElementById('listaCategorias');
        listaCat.innerHTML = '';
        for (const [cat, count] of Object.entries(stats.porCategoria)) {
            const porcentaje = Math.round((count / stats.totalLibros) * 100);
            listaCat.innerHTML += `
                <div class="mb-2">
                    <div class="d-flex justify-content-between">
                        <span>${cat}</span>
                        <span>${count} (${porcentaje}%)</span>
                    </div>
                    <div class="progress" style="height: 10px;">
                        <div class="progress-bar bg-info" role="progressbar" style="width: ${porcentaje}%" aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>
            `;
        }

        // Top 5 Leídos
        const listaTop = document.getElementById('listaTopLeidos');
        listaTop.innerHTML = '';
        if(stats.topLeidos.length === 0) {
            listaTop.innerHTML = '<p class="text-muted text-center">No hay datos suficientes</p>';
        } else {
            stats.topLeidos.forEach(l => {
                listaTop.innerHTML += `
                    <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                        <div>
                            <strong>${l.titulo}</strong><br>
                            <small class="text-muted">${l.autor}</small>
                        </div>
                        <span class="badge bg-primary rounded-pill">${l.lecturas} <i class="bi bi-eye"></i></span>
                    </div>
                `;
            });
        }

        const modal = new bootstrap.Modal(document.getElementById('modalDashboard'));
        modal.show();
    }

    configurarEventos() {
        window.agregarLibro = () => {
            const titulo = document.getElementById('titulo').value.trim();
            const autor = document.getElementById('autor').value.trim();
            const categoria = document.getElementById('categoria').value;
            const anio = document.getElementById('anio').value;
            
            if (this.agregarLibroDesdeFormulario(titulo, autor, categoria, anio)) {
                const modalEl = document.getElementById('modalLibro');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if(modal) modal.hide();
                document.getElementById('formLibro').reset();
            }
        };

        window.guardarEdicion = () => this.guardarEdicion();
        window.abrirDashboard = () => this.abrirDashboard();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new ControladorBiblioteca();
});
