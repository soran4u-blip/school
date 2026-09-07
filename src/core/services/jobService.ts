import { Job, JobApplication } from '../types/job';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, where } from 'firebase/firestore';

/* =========================================================
   JOBS & JOB APPLICATIONS
========================================================= */
export async function createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
  const ref = doc(collection(db, 'jobs'));
  const now = new Date().toISOString();
  const newJob: Job = { ...job, id: ref.id, createdAt: now, updatedAt: now };
  const payload = Object.fromEntries(Object.entries(newJob).filter(([, v]) => v !== undefined));
  await setDoc(ref, payload);
  return newJob;
}

export async function updateJob(id: string, patch: Partial<Job>): Promise<void> {
  await updateDoc(doc(db, 'jobs', id), { ...patch, updatedAt: new Date().toISOString() });
}

// Direct getDoc, bypassing any bulk-query restriction — mirrors getInstitutionById/getTutorById
// so an owner can load their own DRAFT/CLOSED job even though a bulk unfiltered query would
// otherwise be denied for a non-ACTIVE doc.
export async function getJobById(id: string): Promise<Job | null> {
  const snap = await getDoc(doc(db, 'jobs', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Job) : null;
}

export async function getInstitutionJobs(institutionId: string): Promise<Job[]> {
  const q = query(collection(db, 'jobs'), where('institutionId', '==', institutionId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Job))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEmployerJobs(employerId: string): Promise<Job[]> {
  const q = query(collection(db, 'jobs'), where('employerId', '==', employerId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Job))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Public directory of open jobs — jobs are dynamic/time-sensitive so (unlike institutions/tutors)
// there's no in-memory seed fallback here, just a straight Firestore query on the one indexable
// field (status) with the rest filtered client-side, same approach the /tutors listing uses.
export async function getActiveJobs(filters?: { governorateId?: string; employmentType?: Job['employmentType']; isRemote?: boolean; subjectId?: string }): Promise<Job[]> {
  const q = query(collection(db, 'jobs'), where('status', '==', 'ACTIVE'));
  const snap = await getDocs(q);
  let jobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
  if (filters?.governorateId) jobs = jobs.filter(j => j.governorateId === filters.governorateId);
  if (filters?.employmentType) jobs = jobs.filter(j => j.employmentType === filters.employmentType);
  if (filters?.isRemote) jobs = jobs.filter(j => j.isRemote);
  if (filters?.subjectId) jobs = jobs.filter(j => j.subjectIds?.includes(filters.subjectId!));
  return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createJobApplication(app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<JobApplication> {
  const ref = doc(collection(db, 'jobApplications'));
  const now = new Date().toISOString();
  const newApp: JobApplication = { ...app, id: ref.id, status: 'SUBMITTED', createdAt: now, updatedAt: now };
  const payload = Object.fromEntries(Object.entries(newApp).filter(([, v]) => v !== undefined));
  await setDoc(ref, payload);
  return newApp;
}

// All applications across every job this institution owns — a unified applicants inbox.
// Filtered by institutionId (not jobId) because firestore.rules' read check is keyed off
// resource.data.institutionId — Firestore requires a query's `where` field to match the field
// a data-dependent rule checks, or it rejects the query outright without evaluating documents.
// Callers that need one job's applications should filter this list by jobId client-side.
export async function getInstitutionJobApplications(institutionId: string): Promise<JobApplication[]> {
  const q = query(collection(db, 'jobApplications'), where('institutionId', '==', institutionId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as JobApplication))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEmployerJobApplications(employerId: string): Promise<JobApplication[]> {
  const q = query(collection(db, 'jobApplications'), where('employerId', '==', employerId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as JobApplication))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateJobApplicationStatus(id: string, status: JobApplication['status']): Promise<void> {
  await updateDoc(doc(db, 'jobApplications', id), { status, updatedAt: new Date().toISOString() });
}

export async function updateJobApplicationNotes(id: string, internalNotes: string): Promise<void> {
  await updateDoc(doc(db, 'jobApplications', id), { internalNotes, updatedAt: new Date().toISOString() });
}

// Platform-wide oversight (superadmin only, per firestore.rules).
export async function getAllJobs(): Promise<Job[]> {
  const snap = await getDocs(collection(db, 'jobs'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Job))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllJobApplications(): Promise<JobApplication[]> {
  const snap = await getDocs(collection(db, 'jobApplications'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as JobApplication));
}
