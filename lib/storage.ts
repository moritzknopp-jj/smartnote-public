// ============================================================
// SMARTNOTE — Local JSON-based storage (no external DB needed)
// ============================================================

import { promises as fs } from 'fs';
import path from 'path';
import { Project } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

// ----- Projects -----
export async function saveProject(project: Project): Promise<void> {
  await ensureDir(PROJECTS_DIR);
  const filePath = path.join(PROJECTS_DIR, `${project.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8');
}

export async function loadProject(id: string): Promise<Project | null> {
  const safeName = path.basename(id);
  const filePath = path.join(PROJECTS_DIR, `${safeName}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as Project;
  } catch {
    return null;
  }
}

export async function listProjects(): Promise<Project[]> {
  await ensureDir(PROJECTS_DIR);
  const files = await fs.readdir(PROJECTS_DIR);
  const projects: Project[] = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const data = await fs.readFile(path.join(PROJECTS_DIR, file), 'utf-8');
        projects.push(JSON.parse(data) as Project);
      } catch {
        // Skip corrupted files
      }
    }
  }

  return projects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function deleteProject(id: string): Promise<void> {
  const safeName = path.basename(id);
  const filePath = path.join(PROJECTS_DIR, `${safeName}.json`);
  try {
    await fs.unlink(filePath);
  } catch {
    // Already deleted
  }
}

// ----- Uploads -----
export async function saveUpload(
  projectId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const safeProjectId = path.basename(projectId);
  const dir = path.join(UPLOADS_DIR, safeProjectId);
  await ensureDir(dir);
  const safeName = path.basename(filename);
  const filePath = path.join(dir, safeName);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

// ----- Extracted Text Cache -----
export async function saveExtractedText(
  projectId: string,
  documentId: string,
  text: string
): Promise<void> {
  const safeProjectId = path.basename(projectId);
  const safeDocId = path.basename(documentId);
  const dir = path.join(DATA_DIR, 'texts', safeProjectId);
  await ensureDir(dir);
  await fs.writeFile(path.join(dir, `${safeDocId}.txt`), text, 'utf-8');
}

export async function loadExtractedText(
  projectId: string,
  documentId: string
): Promise<string | null> {
  const safeProjectId = path.basename(projectId);
  const safeDocId = path.basename(documentId);
  const filePath = path.join(DATA_DIR, 'texts', safeProjectId, `${safeDocId}.txt`);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}
