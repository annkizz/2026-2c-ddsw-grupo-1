export class ColaboradorRepository{
    constructor(){
        this.colaboradores = [];
    }

    obtenerTodos(){
        return this.colaboradores;
    }

    encontrarPorId(unColaborador) {
        return this.colaboradores.find(
            (colaborador) => colaborador.id_colaborador === idColaborador);
    }

    save(unColaborador){
        const indice = this.colaboradores.findIndex(
            (colaborador) => this.colaboradores.id_colaborador === unColaborador.id_colaborador,
        );

        if(indice === -1){
            this.colaboradores.push(unColaborador);
            return unColaborador;
        }

        this.colaboradores[indice] = unColaborador;
        return unColaborador;
    }
}