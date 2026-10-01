CREATE TYPE "status" AS ENUM('ativo', 'banido');--> statement-breakpoint
ALTER TABLE "usuarios" RENAME COLUMN "id" TO "usuarioId";--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "criadoEm" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "deletadoEm" timestamp;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "status" "status" NOT NULL;--> statement-breakpoint
CREATE SEQUENCE "usuarios_usuarioId_seq";--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "usuarioId" SET DEFAULT nextval('usuarios_usuarioId_seq')--> statement-breakpoint
ALTER SEQUENCE "usuarios_usuarioId_seq" OWNED BY "public"."usuarios"."usuarioId";--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "usuarioId" SET DATA TYPE int USING "usuarioId"::int;--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "usuarioId" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "email" SET DATA TYPE varchar(256) USING "email"::varchar(256);--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "nome" SET DATA TYPE varchar(80) USING "nome"::varchar(80);