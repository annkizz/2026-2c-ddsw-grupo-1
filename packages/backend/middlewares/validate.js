import { BadRequestError } from "../errors/AppError.js";

export function validate(schema){
    return (req,res,next) => {
        const resultado = schema.safeParse(req.body);

        if(!resultado.success){
            throw new BadRequestError("los datos son invalidos", resultado.error.issues,);
        }

        req.body = resultado.data;
        next();
    }
}