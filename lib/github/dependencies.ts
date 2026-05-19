import {
  NPM_FRAMEWORK_MAP,
  PY_FRAMEWORK_MAP,
  GO_FRAMEWORK_MAP,
  RUST_FRAMEWORK_MAP,
  JAVA_FRAMEWORK_MAP,
  type FrameworkMeta,
} from "@/lib/universe/frameworks"

// Top N repos to scan for dependency files (balances accuracy vs rate-limit usage)
const MAX_REPOS_TO_SCAN = 12

export interface RepoRef {
  nameWithOwner: string
  language: string | null
  commitCount: number
}

// Returns: langId → detected FrameworkMeta[]
export async function detectAllFrameworks(
  repos: RepoRef[],
  token: string
): Promise<Record<string, FrameworkMeta[]>> {
  const topRepos = [...repos]
    .sort((a, b) => b.commitCount - a.commitCount)
    .slice(0, MAX_REPOS_TO_SCAN)

  const accumulated: Record<string, Map<string, FrameworkMeta>> = {}

  const results = await Promise.allSettled(
    topRepos.map((repo) => detectFrameworksInRepo(repo, token))
  )

  for (const result of results) {
    if (result.status !== "fulfilled") continue
    for (const [langId, metas] of Object.entries(result.value)) {
      if (!accumulated[langId]) accumulated[langId] = new Map()
      for (const meta of metas) {
        accumulated[langId].set(meta.id, meta)
      }
    }
  }

  return Object.fromEntries(
    Object.entries(accumulated).map(([langId, metaMap]) => [
      langId,
      Array.from(metaMap.values()),
    ])
  )
}

async function detectFrameworksInRepo(
  repo: RepoRef,
  token: string
): Promise<Record<string, FrameworkMeta[]>> {
  const fileCandidates = getDepFilesForLanguage(repo.language)
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
  }

  const results = await Promise.allSettled(
    fileCandidates.map(async (path) => {
      const url = `https://api.github.com/repos/${repo.nameWithOwner}/contents/${path}`
      const res = await fetch(url, { headers, next: { revalidate: 0 } })
      if (!res.ok) return null
      const json = await res.json()
      if (!json.content) return null
      const text = Buffer.from(json.content, "base64").toString("utf-8")
      return { path, content: text }
    })
  )

  const collected: Record<string, FrameworkMeta[]> = {}

  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue
    const { path, content } = r.value
    const metas = parseDepFile(path, content)
    for (const meta of metas) {
      if (!collected[meta.langId]) collected[meta.langId] = []
      if (!collected[meta.langId].find((m) => m.id === meta.id)) {
        collected[meta.langId].push(meta)
      }
    }
  }

  return collected
}

function getDepFilesForLanguage(language: string | null): string[] {
  switch (language) {
    case "JavaScript":
    case "TypeScript":
      return ["package.json"]
    case "Python":
      return ["requirements.txt", "pyproject.toml", "Pipfile"]
    case "Go":
      return ["go.mod"]
    case "Rust":
      return ["Cargo.toml"]
    case "Java":
    case "Kotlin":
      return ["pom.xml", "build.gradle", "build.gradle.kts"]
    default:
      return ["package.json", "requirements.txt"]
  }
}

function parseDepFile(filePath: string, content: string): FrameworkMeta[] {
  if (filePath === "package.json") return parsePackageJson(content)
  if (filePath === "requirements.txt") return parseRequirementsTxt(content)
  if (filePath === "pyproject.toml") return parsePyprojectToml(content)
  if (filePath === "go.mod") return parseGoMod(content)
  if (filePath === "Cargo.toml") return parseCargoToml(content)
  if (filePath === "pom.xml") return parsePomXml(content)
  if (filePath.startsWith("build.gradle")) return parseGradleBuild(content)
  return []
}

function parsePackageJson(content: string): FrameworkMeta[] {
  try {
    const pkg = JSON.parse(content)
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    }
    const found: FrameworkMeta[] = []
    for (const pkgName of Object.keys(allDeps ?? {})) {
      const meta = NPM_FRAMEWORK_MAP[pkgName]
      if (meta) found.push(meta)
    }
    return found
  } catch {
    return []
  }
}

function parseRequirementsTxt(content: string): FrameworkMeta[] {
  const found: FrameworkMeta[] = []
  for (const line of content.split("\n")) {
    // Strip version specifiers: "django>=4.0" → "django"
    const pkg = line.trim().split(/[>=<!\s[]/)[0].toLowerCase()
    const meta = PY_FRAMEWORK_MAP[pkg]
    if (meta) found.push(meta)
  }
  return found
}

function parsePyprojectToml(content: string): FrameworkMeta[] {
  const found: FrameworkMeta[] = []
  // Match lines like: django = "^4.0" or "django>=4.0"
  const depPattern = /^\s*["']?([a-zA-Z0-9_-]+)["']?\s*[=<>!]/gm
  let match: RegExpExecArray | null
  while ((match = depPattern.exec(content)) !== null) {
    const pkg = match[1].toLowerCase()
    const meta = PY_FRAMEWORK_MAP[pkg]
    if (meta) found.push(meta)
  }
  return found
}

function parseGoMod(content: string): FrameworkMeta[] {
  const found: FrameworkMeta[] = []
  // Match: github.com/gin-gonic/gin v1.9.0
  const requirePattern = /^\s*([\w./\-]+)\s+v[\d.]+/gm
  let match: RegExpExecArray | null
  while ((match = requirePattern.exec(content)) !== null) {
    const modulePath = match[1]
    for (const [key, meta] of Object.entries(GO_FRAMEWORK_MAP)) {
      if (modulePath.includes(key)) {
        found.push(meta)
        break
      }
    }
  }
  return found
}

function parseCargoToml(content: string): FrameworkMeta[] {
  const found: FrameworkMeta[] = []
  // Match: actix-web = "4" or actix-web = { version = "4" }
  const cratePattern = /^\s*([a-zA-Z0-9_-]+)\s*=/gm
  let match: RegExpExecArray | null
  while ((match = cratePattern.exec(content)) !== null) {
    const crate = match[1].toLowerCase()
    const meta = RUST_FRAMEWORK_MAP[crate]
    if (meta) found.push(meta)
  }
  return found
}

function parsePomXml(content: string): FrameworkMeta[] {
  const found: FrameworkMeta[] = []
  for (const [key, meta] of Object.entries(JAVA_FRAMEWORK_MAP)) {
    if (content.toLowerCase().includes(key.toLowerCase())) {
      found.push(meta)
    }
  }
  return found
}

function parseGradleBuild(content: string): FrameworkMeta[] {
  const found: FrameworkMeta[] = []
  for (const [key, meta] of Object.entries(JAVA_FRAMEWORK_MAP)) {
    if (content.toLowerCase().includes(key.toLowerCase())) {
      found.push(meta)
    }
  }
  return found
}
