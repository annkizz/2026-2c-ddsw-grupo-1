import {Notificacion} from "../domain/Notificacion.js"
import {NotificacionRepository}  from "../repositories/NotificacionRepository.js"
import {ColectivoRepository}  from "../repositories/ColectivoRepository.js"
import {ColaboradorRepository}  from "../repositories/ColaboradorRepository.js"

export class NotificacionService {
    constructor(notificacionRepository = new NotificacionRepository,
                colectivoRepository = new ColectivoRepository,
                colaboradorRepository = new ColaboradorRepository
    ){
        this.notificacionRepository = notificacionRepository;
        this.colectivoRepository = colectivoRepository;
        this.colaboradorRepository = colaboradorRepository;
    }


    crear(datosNotificacion){
        const colectivo = this.colectivoRepository.encontrarPorId(datosNotificacion.idColectivo);
        if(!colectivo){
            throw new NotFoundError("el colectivo no existe", "COLECTIVO_NO_ENCONTRADO");
        } 

        const colaborador = this.colaboradorRepository.encontrarPorId(datosNotificacion.idColaborador);
        if(!colaborador){
            throw new NotFoundError("El colaborador no existe", "COLABORADOR_NO_ENCONTRADO");
        } 

        const notificacion = new Notificacion(
            new Date().toISOString(),
            datosNotificacion.contenido,
            datosNotificacion.idColectivo, 
            datosNotificacion.idColaborador,
            datosNotificacion.medioDeContacto // TODO: Esto lo tengo que hacer como una clase de medio de contacto
        )

        return this.notificacionRepository.save(notificacion);

    }

}