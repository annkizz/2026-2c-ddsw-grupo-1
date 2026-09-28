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
            tipoColaboracion: perfil.compromiso.tipoColaboracion
        },
        };
    }

    async obtenerTodos(idProyecto) {
        await this.validarProyecto(idProyecto);
        const perfiles = await this.perfilRepository.obtenerTodos(idProyecto);
        return perfiles.map((perfil) => this.toDTO(perfil));
    }

    async crear (idProyecto, datos) {
        await this.validarProyecto(idProyecto);

        const requeridas = await this.validarHabilidades(datos.habilidadesRequeridas);
        const opcionales = await this.validarHabilidades(datos.habilidadesOpcionales);

        const guardado = await this.perfilRepository.save({
            proyecto: idProyecto,
            descripcion: datos.descripcion,
            habilidadesRequeridas: requeridas.map((h) => h.titulo),
            habilidadesOpcionales: opcionales.map((h) => h.titulo),
            compromiso: datos.compromiso,
            });

        return this.toDTO(guardado);
    }

    async eliminar (idProyecto, idPerfil) {
        await this.validarProyecto(idProyecto);

        const perfil = await this.perfilRepository.buscarPorId(idPerfil);

        if (!perfil || perfil.proyecto !== idProyecto) {
            throw new NotFoundError ("perfil no encontrado", "PERFIL_NO_ENCONTRADO")
        }

        await this.perfilRepository.eliminar(idPerfil);
    }

    async validarProyecto(idProyecto) {
        const proyecto = await this.proyectoRepository.encontrarPorId(idProyecto);
        if (!proyecto) {
            throw new NotFoundError ("proyecto no encontrado", "PROYECTO_NO_ENCONTRADO");
        }
    }

    async validarHabilidades(titulos = []) {
        return Promise.all(
        titulos.map(async (titulo) => {
            const habilidad = await this.habilidadRepository.encontrarPorTitulo(titulo);
            if (!habilidad) {
            throw new NotFoundError("la habilidad ${titulo} no existe", "HABILIDAD_NO_ENCONTRADA",);
            }
            return habilidad;
        }),
        );
    }
}
