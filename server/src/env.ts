import { z } from "zod";
import dotenv from "dotenv";



const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_PATH: z.string().nonempty(),
  SESSION_SECRET: z.string().min(32),
  DOMAIN: z.string().nonempty(),
});

dotenv.config();

const parsedEnv = EnvSchema.safeParse(process.env);

if(!parsedEnv.success) {
  console.error("Misconfigured environment variable!");
  throw parsedEnv.error.format();
}

export const env = parsedEnv.data;

