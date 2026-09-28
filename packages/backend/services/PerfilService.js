import { PerfilRepository } from "../repositories/PerfilRepository.js";
import { HabilidadRepository } from "../repositories/HabilidadRepository.js"
import { ProyectoRepository } from "../repositories/ProyectoRepository.js"
import { NotFoundError } from "../errors/AppError.js"

export class PerfilService {
    constructor(perfilRepository = new PerfilRepository(),
                proyectoRepository = new ProyectoRepository(),
                habilidadRepository = new HabilidadRepository()) {
        this.perfilRepository = perfilRepository,
        this.proyectoRepository = proyectoRepository,
        this.habilidadRepository = habilidadRepository
    }

    toDTO (perfil) {
        return {
        idPerfil: perfil.id,
        idProyecto: perfil.proyecto,
        descripcion: perfil.descripcion,
        habilidadesRequeridas: perfil.habilidadesRequeridas,
        habilidadesOpcionales: perfil.habilidadesOpcionales,
        compromiso: {
            tipoCompromiso: perfil.compromiso.tipoCompromiso,
            horas: perfil.compromiso.horas,
        },
        modalidadColaboracion: perfil.modalidadColaboracion,
        };
    }

    async obtenerTodos(idProyecto) {
        this.validadProyecto(idProyecto)
        return this.perfilRepository.obtenerTodos();
    }

    async crear (idProyecto, datos) {
        this.validarProyecto(idProyecto);

        const requeridas = this.validarHabilidades(datos.habilidadesRequeridas);
        const opcionales = this.validarHabilidades(datos.habilidadesOpcionales);

        const guardado = await this.perfilRepository.save({
            proyecto: idProyecto,
            descripcion: datos.descripcion,
            habilidadesRequeridas: requeridas.map((h) => h.titulo),
            habilidadesOpcionales: opcionales.map((h) => h.titulo),
            compromiso: datos.compromiso,
            modalidadColaboracion: datos.modalidadColaboracion,
            });

        return this.toDTO(guardado);
    }

    async eliminar (idProyecto, idPerfil) {
        this.validadProyecto(idProyecto)

        const perfil = await this.perfilRepository.buscarPorId(idPerfil);

        if (!perfil || perfil.proyecto !== idProyecto) {
            throw new NotFoundError ("perfil no encontrado", "PERFIL_NO_ENCONTRADO")
        }

        await this.perfilRepository.eliminar(idPerfil);
    }

    validarProyecto(idProyecto) {
        const proyecto = this.proyectoRepository.buscarPorId(idProyecto);

        if (!proyecto) {
            throw new NotFoundError ("proyecto no encontrado", "PROYECTO_NO_ENCONTRADO");
        }
    }

    validarHabilidades(titulos = []) {
    return titulos.map((titulo) => {
        const habilidad = this.habilidadRepository.encontrarPorTitulo(titulo);
        if (!habilidad) {
            throw new NotFoundError(`la habilidad ${titulo} no existe`, "HABILIDAD_NO_ENCONTRADA");
        }
        return habilidad;
        });
    }
}
