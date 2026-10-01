CREATE TYPE "cargo" AS ENUM('membro', 'moderador', 'admin');--> statement-breakpoint
CREATE TABLE "categorias" (
	"categoriaId" serial PRIMARY KEY,
	"criadoEm" timestamp with time zone DEFAULT now() NOT NULL,
	"deletadoEm" timestamp with time zone,
	"nome" varchar(80) NOT NULL,
	"descricao" varchar(255),
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foruns" (
	"forumId" serial PRIMARY KEY,
	"criadoEm" timestamp with time zone DEFAULT now() NOT NULL,
	"deletadoEm" timestamp with time zone,
	"categoriaId" integer NOT NULL,
	"nome" varchar(80) NOT NULL,
	"descricao" varchar(255),
	"icone" varchar(16) DEFAULT '💬' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "postagens" (
	"postagemId" serial PRIMARY KEY,
	"criadoEm" timestamp with time zone DEFAULT now() NOT NULL,
	"deletadoEm" timestamp with time zone,
	"topicoId" integer NOT NULL,
	"usuarioId" integer NOT NULL,
	"conteudo" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topicos" (
	"topicoId" serial PRIMARY KEY,
	"criadoEm" timestamp with time zone DEFAULT now() NOT NULL,
	"deletadoEm" timestamp with time zone,
	"atualizadoEm" timestamp with time zone DEFAULT now() NOT NULL,
	"forumId" integer NOT NULL,
	"usuarioId" integer NOT NULL,
	"titulo" varchar(150) NOT NULL,
	"fixo" boolean DEFAULT false NOT NULL,
	"fechado" boolean DEFAULT false NOT NULL,
	"visitas" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "cargo" "cargo" DEFAULT 'membro'::"cargo" NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "criadoEm" SET DATA TYPE timestamp with time zone USING "criadoEm"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "deletadoEm" SET DATA TYPE timestamp with time zone USING "deletadoEm"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "status" SET DEFAULT 'ativo'::"status";--> statement-breakpoint
ALTER TABLE "foruns" ADD CONSTRAINT "foruns_categoriaId_categorias_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("categoriaId");--> statement-breakpoint
ALTER TABLE "postagens" ADD CONSTRAINT "postagens_topicoId_topicos_topicoId_fkey" FOREIGN KEY ("topicoId") REFERENCES "topicos"("topicoId");--> statement-breakpoint
ALTER TABLE "postagens" ADD CONSTRAINT "postagens_usuarioId_usuarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("usuarioId");--> statement-breakpoint
ALTER TABLE "topicos" ADD CONSTRAINT "topicos_forumId_foruns_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "foruns"("forumId");--> statement-breakpoint
ALTER TABLE "topicos" ADD CONSTRAINT "topicos_usuarioId_usuarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("usuarioId");