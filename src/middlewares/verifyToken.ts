import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

const checkForToken = async (req:Request):Promise<string> => {

    if(req.body.token) {
        return req.body.token;
    } else if(req.headers['authorization']) {
        return req.headers['authorization'] as string;
    } else {
        return '';
    }
}

export const verifyTokenMiddleware = async(req:Request, res:Response, next:NextFunction):Promise<any> => { 
    const token  = await checkForToken(req);
    if (!token || token === '') return res.status(403).json({  
        msg: "No token provided" 
    }); 
    try { 
        const decoded = jwt.verify(token,  
            process.env.JWT_SECRET_KEY||"default"); 
        req.body.user = decoded; 
    } catch (err) { 
        return res.status(401).json({  
            msg: "Invalid Token" 
        }); 
    } 
    next(); 
}; 