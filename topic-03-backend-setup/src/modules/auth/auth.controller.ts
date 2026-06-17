import { Request, Response } from "express";
import { registerSchema } from "./auth.schema";
import { registerUser } from "./auth.service";

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const validated = registerSchema.parse(
      req.body
    );

    const result = await registerUser(
      validated.email,
      validated.password
    );

    res.status(201).json({
      message: "User registered successfully",
      token: result.token,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};