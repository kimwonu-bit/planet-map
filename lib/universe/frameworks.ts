export interface FrameworkMeta {
  id: string
  name: string
  color: string
  langId: string
  category: "frontend" | "backend" | "orm" | "testing" | "data" | "other"
}

// npm package name → framework metadata
export const NPM_FRAMEWORK_MAP: Record<string, FrameworkMeta> = {
  react:               { id: "react",     name: "React",      color: "#61dafb", langId: "javascript", category: "frontend" },
  vue:                 { id: "vue",       name: "Vue",        color: "#4fc08d", langId: "javascript", category: "frontend" },
  "@angular/core":     { id: "angular",   name: "Angular",    color: "#dd0031", langId: "typescript", category: "frontend" },
  svelte:              { id: "svelte",    name: "Svelte",     color: "#ff3e00", langId: "javascript", category: "frontend" },
  next:                { id: "nextjs",    name: "Next.js",    color: "#888888", langId: "typescript", category: "frontend" },
  nuxt:                { id: "nuxt",      name: "Nuxt",       color: "#00dc82", langId: "javascript", category: "frontend" },
  "@remix-run/react":  { id: "remix",     name: "Remix",      color: "#c2410c", langId: "typescript", category: "frontend" },
  astro:               { id: "astro",     name: "Astro",      color: "#ff5d01", langId: "typescript", category: "frontend" },
  express:             { id: "express",   name: "Express",    color: "#d7d7d7", langId: "javascript", category: "backend" },
  fastify:             { id: "fastify",   name: "Fastify",    color: "#00b4d8", langId: "javascript", category: "backend" },
  "@nestjs/core":      { id: "nestjs",    name: "NestJS",     color: "#e0234e", langId: "typescript", category: "backend" },
  hono:                { id: "hono",      name: "Hono",       color: "#e36002", langId: "typescript", category: "backend" },
  "socket.io":         { id: "socketio",  name: "Socket.IO",  color: "#25c2a0", langId: "javascript", category: "backend" },
  prisma:              { id: "prisma",    name: "Prisma",     color: "#5a67d8", langId: "typescript", category: "orm" },
  mongoose:            { id: "mongoose",  name: "Mongoose",   color: "#880000", langId: "javascript", category: "orm" },
  typeorm:             { id: "typeorm",   name: "TypeORM",    color: "#e83524", langId: "typescript", category: "orm" },
  "drizzle-orm":       { id: "drizzle",   name: "Drizzle",    color: "#c5f74f", langId: "typescript", category: "orm" },
  jest:                { id: "jest",      name: "Jest",       color: "#c21325", langId: "javascript", category: "testing" },
  vitest:              { id: "vitest",    name: "Vitest",     color: "#6e9f18", langId: "typescript", category: "testing" },
  zod:                 { id: "zod",       name: "Zod",        color: "#3e67b1", langId: "typescript", category: "other" },
  graphql:             { id: "graphql",   name: "GraphQL",    color: "#e10098", langId: "javascript", category: "other" },
  redux:               { id: "redux",     name: "Redux",      color: "#764abc", langId: "javascript", category: "other" },
  tailwindcss:         { id: "tailwind",  name: "Tailwind",   color: "#06b6d4", langId: "javascript", category: "frontend" },
  "react-query":       { id: "rquery",    name: "TanStack Query", color: "#ef4444", langId: "typescript", category: "other" },
  "@tanstack/react-query": { id: "rquery", name: "TanStack Query", color: "#ef4444", langId: "typescript", category: "other" },
}

// Python package name → framework metadata
export const PY_FRAMEWORK_MAP: Record<string, FrameworkMeta> = {
  django:       { id: "django",    name: "Django",       color: "#44b78b", langId: "python", category: "backend" },
  flask:        { id: "flask",     name: "Flask",        color: "#b5b5b5", langId: "python", category: "backend" },
  fastapi:      { id: "fastapi",   name: "FastAPI",      color: "#009688", langId: "python", category: "backend" },
  sqlalchemy:   { id: "sqlalchemy",name: "SQLAlchemy",   color: "#d71f00", langId: "python", category: "orm" },
  pandas:       { id: "pandas",    name: "Pandas",       color: "#150458", langId: "python", category: "data" },
  numpy:        { id: "numpy",     name: "NumPy",        color: "#4dabcf", langId: "python", category: "data" },
  "scikit-learn":{ id: "sklearn",  name: "Scikit-learn", color: "#f89939", langId: "python", category: "data" },
  torch:        { id: "pytorch",   name: "PyTorch",      color: "#ee4c2c", langId: "python", category: "data" },
  tensorflow:   { id: "tensorflow",name: "TensorFlow",   color: "#ff6f00", langId: "python", category: "data" },
  celery:       { id: "celery",    name: "Celery",       color: "#37b24d", langId: "python", category: "other" },
  pydantic:     { id: "pydantic",  name: "Pydantic",     color: "#e92063", langId: "python", category: "other" },
  pytest:       { id: "pytest",    name: "Pytest",       color: "#0a9edc", langId: "python", category: "testing" },
  uvicorn:      { id: "uvicorn",   name: "Uvicorn",      color: "#4caf50", langId: "python", category: "backend" },
}

// Go module path suffix → framework metadata
export const GO_FRAMEWORK_MAP: Record<string, FrameworkMeta> = {
  "gin-gonic/gin":  { id: "gin",    name: "Gin",         color: "#00add8", langId: "go", category: "backend" },
  "gorilla/mux":    { id: "gorilla",name: "Gorilla Mux", color: "#00758f", langId: "go", category: "backend" },
  "labstack/echo":  { id: "echo",   name: "Echo",        color: "#00add8", langId: "go", category: "backend" },
  "gofiber/fiber":  { id: "fiber",  name: "Fiber",       color: "#00acd7", langId: "go", category: "backend" },
  "go-gorm/gorm":   { id: "gorm",   name: "GORM",        color: "#4aaee1", langId: "go", category: "orm" },
  "grpc/grpc-go":   { id: "grpc",   name: "gRPC",        color: "#4285f4", langId: "go", category: "other" },
  "spf13/cobra":    { id: "cobra",  name: "Cobra",       color: "#7dd3fc", langId: "go", category: "other" },
  "uber-go/zap":    { id: "zap",    name: "Zap",         color: "#6366f1", langId: "go", category: "other" },
  "golang/protobuf":{ id: "proto",  name: "Protobuf",    color: "#4285f4", langId: "go", category: "other" },
}

// Rust crate name → framework metadata
export const RUST_FRAMEWORK_MAP: Record<string, FrameworkMeta> = {
  "actix-web": { id: "actix",  name: "Actix-web", color: "#dea584", langId: "rust", category: "backend" },
  axum:        { id: "axum",   name: "Axum",      color: "#f17c37", langId: "rust", category: "backend" },
  tokio:       { id: "tokio",  name: "Tokio",     color: "#5e81ac", langId: "rust", category: "other" },
  tauri:       { id: "tauri",  name: "Tauri",     color: "#ffc131", langId: "rust", category: "frontend" },
  serde:       { id: "serde",  name: "Serde",     color: "#a3a7ba", langId: "rust", category: "other" },
  sqlx:        { id: "sqlx",   name: "SQLx",      color: "#0277bd", langId: "rust", category: "orm" },
  "rocket":    { id: "rocket", name: "Rocket",    color: "#d33847", langId: "rust", category: "backend" },
  wasm:        { id: "wasm",   name: "WebAssembly", color: "#654ff0", langId: "rust", category: "other" },
}

// Java/Kotlin maven groupId:artifactId → framework metadata
export const JAVA_FRAMEWORK_MAP: Record<string, FrameworkMeta> = {
  "spring-boot":       { id: "springboot", name: "Spring Boot",  color: "#6db33f", langId: "java", category: "backend" },
  "org.springframework": { id: "spring",  name: "Spring",       color: "#6db33f", langId: "java", category: "backend" },
  "hibernate":         { id: "hibernate", name: "Hibernate",     color: "#59666c", langId: "java", category: "orm" },
  "junit":             { id: "junit",     name: "JUnit",         color: "#25a162", langId: "java", category: "testing" },
  "io.quarkus":        { id: "quarkus",   name: "Quarkus",       color: "#4695eb", langId: "java", category: "backend" },
  "io.micronaut":      { id: "micronaut", name: "Micronaut",     color: "#3dbfc6", langId: "java", category: "backend" },
}
