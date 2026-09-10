import { randomUUID } from "node:crypto";
import { Compromiso } from "../domain/Compromiso.js";
import { Estado } from "../domain/Estado.js";
import { Proyecto } from "../domain/Proyecto.js";
import { Colaboracion } from "../domain/Colaboracion.js";
import { ProyectoRepository } from "../repositories/ProyectoRepository.js";
import { HabilidadRepository } from "../repositories/HabilidadRepository.js";
import { NotFoundError } from "../errors/AppError.js";
import { ColaboradorService} from "./ColaboradorService.js";
import { ColectivoRepository } from "../repositories/ColectivoRepository.js";

export class ProyectoService {
  constructor(
    proyectoRepository = new ProyectoRepository(),
    habilidadRepository = new HabilidadRepository(),
    colaboradorService = new ColaboradorService(),
    colectivoRepository = new ColectivoRepository(),
  ) {
    this.proyectoRepository = proyectoRepository;
    this.habilidadRepository = habilidadRepository;
    this.colaboradorService = colaboradorService ; 
    this.colectivoRepository = colectivoRepository;
  }

  crear = (datosProyecto) => {
    if (this.colectivoRepository) {
      const colectivo = this.colectivoRepository.encontrarPorId(
        datosProyecto.id_colectivo,
      );

      if (!colectivo) {
        throw new NotFoundError("el colectivo no existe");
      }
    }

    const habilidades = datosProyecto.habilidades.map((tituloHabilidad) => {
      const habilidad =
        this.habilidadRepository.encontrarPorTitulo(tituloHabilidad);

      if (!habilidad) {
        throw new NotFoundError(`la habilidad ${tituloHabilidad} no existe`);
      }

      return habilidad;
    });

    const compromiso = new Compromiso(
      datosProyecto.compromiso.tipoCompromiso,
      datosProyecto.compromiso.horas,
    );

    const proyecto = new Proyecto(
      datosProyecto.titulo,
      datosProyecto.descripcion,
      habilidades,
      compromiso,
      datosProyecto.modalidadColaboracion,
      Estado.ACTIVO,
      new Date(),
      randomUUID(),
    );

    if (this.colectivoRepository) {
      const colectivo = this.colectivoRepository.encontrarPorId(
        datosProyecto.id_colectivo,
      );
      colectivo.agregarProyecto(proyecto);
    }

    return this.proyectoRepository.save(proyecto);
  };

  obtenerTodos() {
    return this.proyectoRepository.obtenerTodos();
  }

  obtenerProyectoPorId(id) {
    return this.obtenerTodos().find((p) => p.id_proyecto === id);
  }

  obtenerTodasColaboraciones = () => {
    return this.proyectoRepository.obtenerTodasColaboraciones(); 
  }

  obtenerColaboracionPorIdProyecto = (proyectoId) => {
    if(this.obtenerTodasColaboraciones){
      return this.obtenerTodasColaboraciones().find((c)=> c.proyecto.id_proyecto == proyectoId);
    } else {
      return;
    }
    
  }

  colaboradorPerteneceAProyecto = (proyectoId, colaboradorId) => {
    if(this.obtenerColaboracionPorIdProyecto(proyectoId)){
    return this.obtenerColaboracionPorIdProyecto(proyectoId).colaborador.idColaborador == colaboradorId ; }
  }

  verificarHabilidades = (proyecto , colaborador) => {
    const habilidadesNecesarias = proyecto.habilidades.map((h)=> h.titulo);
    const habilidadesColaborador = colaborador.habilidades.map((h)=> h.nombre);

    return habilidadesNecesarias.some((habilidad) => habilidadesColaborador.includes(habilidad));
  }

  crearColaboracion(proyecto, colaboradorId) {
    const colaborador = this.colaboradorService.obtenerPorId(colaboradorId); // TO-DO: Corregir

    if(colaborador){
      if(this.colaboradorPerteneceAProyecto(proyecto.id_proyecto, colaboradorId)) {
        console.log("Colaboración ya existente.")
        //res.status(409).json({error: "Colaboración ya existente."})
        //return 409; 

      } else {
        
        if(!this.verificarHabilidades(proyecto, colaborador)){
          const nuevaColaboracion = new Colaboracion(proyecto, colaborador, Date.now());
          this.proyectoRepository.saveColaboracion(nuevaColaboracion);
          return nuevaColaboracion;

        } else {
          console.log("No cumple con habilidades requeridas.")
        }
      }
    }
  }
}
