import initialSeed from '../seed/seedData.json';
import {
  Governorate,
  City,
  Category,
  TaxonomyItem,
  QuickSearchTag,
  SystemSettings
} from '../types/masterData';
import { Institution } from '../types/institution';
import { Tutor } from '../types/tutor';
import { Review, Inquiry } from '../types/review';
import { Application } from '../types/application';
import { Booking } from '../types/booking';
import { Job, JobApplication } from '../types/job';
import { Thread, ThreadMessage } from '../types/message';
import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

// In-Memory Master Data Store for rapid low-latency reads and offline-safe fallback
interface MasterDataStore {
  governorates: Governorate[];
  cities: City[];
  categories: Category[];
  taxonomies: TaxonomyItem[];
  quickSearchTags: QuickSearchTag[];
  systemSettings: SystemSettings;
  institutions: Institution[];
  tutors: Tutor[];
}

// Global in-memory singleton initialized with complete Iraq seed data
const inMemoryStore: MasterDataStore = {
  governorates: (initialSeed.governorates as unknown) as Governorate[],
  cities: (initialSeed.cities as unknown) as City[],
  categories: (initialSeed.categories as unknown) as Category[],
  taxonomies: (initialSeed.taxonomies as unknown) as TaxonomyItem[],
  quickSearchTags: (initialSeed.quickSearchTags as unknown) as QuickSearchTag[],
  systemSettings: (initialSeed.systemSettings as unknown) as SystemSettings,
  institutions: (initialSeed.institutions as unknown) as Institution[],
  tutors: (initialSeed.tutors as unknown) as Tutor[],
};

export class MasterDataService {
  /* =========================================================
     GOVERNORATES & CITIES (ZERO HARDCODING)
  ========================================================= */
  static async getGovernorates(activeOnly = true): Promise<Governorate[]> {
    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
        const ref = collection(db, 'locations_governorates');
        const q = activeOnly ? query(ref, where('isActive', '==', true), orderBy('displayOrder', 'asc')) : query(ref, orderBy('displayOrder', 'asc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as Governorate));
        }
      }
    } catch (e) {
      console.warn('Firestore fallback to in-memory store for governorates');
    }

    const list = inMemoryStore.governorates;
    return (activeOnly ? list.filter(g => g.isActive) : list).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static async getGovernorateById(id: string): Promise<Governorate | null> {
    const list = await this.getGovernorates(false);
    return list.find(g => g.id === id) || null;
  }

  static async saveGovernorate(gov: Governorate): Promise<Governorate> {
    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
        const ref = doc(db, 'locations_governorates', gov.id);
        await setDoc(ref, gov, { merge: true });
      }
    } catch (e) {
      console.warn('Error persisting governorate to Firestore:', e);
    }

    const idx = inMemoryStore.governorates.findIndex(g => g.id === gov.id);
    if (idx >= 0) {
      inMemoryStore.governorates[idx] = gov;
    } else {
      inMemoryStore.governorates.push(gov);
    }
    return gov;
  }

  static async deleteGovernorate(id: string): Promise<boolean> {
    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
        await deleteDoc(doc(db, 'locations_governorates', id));
      }
    } catch (e) {
      console.warn('Error deleting governorate from Firestore:', e);
    }
    inMemoryStore.governorates = inMemoryStore.governorates.filter(g => g.id !== id);
    return true;
  }

  static async getCities(governorateId?: string, activeOnly = true): Promise<City[]> {
    let list = inMemoryStore.cities;
    if (governorateId) {
      list = list.filter(c => c.governorateId === governorateId);
    }
    if (activeOnly) {
      list = list.filter(c => c.isActive);
    }
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static async saveCity(city: City): Promise<City> {
    const idx = inMemoryStore.cities.findIndex(c => c.id === city.id);
    if (idx >= 0) {
      inMemoryStore.cities[idx] = city;
    } else {
      inMemoryStore.cities.push(city);
    }
    return city;
  }

  /* =========================================================
     CATEGORIES & TAXONOMIES (ZERO HARDCODING)
  ========================================================= */
  static async getCategories(activeOnly = true): Promise<Category[]> {
    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
        const ref = collection(db, 'categories');
        const q = activeOnly ? query(ref, where('isActive', '==', true), orderBy('displayOrder', 'asc')) : query(ref, orderBy('displayOrder', 'asc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        }
      }
    } catch (e) {
      console.warn('Firestore fallback to in-memory store for categories');
    }

    const list = inMemoryStore.categories;
    return (activeOnly ? list.filter(c => c.isActive) : list).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static async saveCategory(cat: Category): Promise<Category> {
    const idx = inMemoryStore.categories.findIndex(c => c.id === cat.id);
    if (idx >= 0) {
      inMemoryStore.categories[idx] = cat;
    } else {
      inMemoryStore.categories.push(cat);
    }
    return cat;
  }

  static async getTaxonomies(type?: string, activeOnly = true): Promise<TaxonomyItem[]> {
    let list = inMemoryStore.taxonomies;
    if (type) {
      list = list.filter(t => t.type === type);
    }
    if (activeOnly) {
      list = list.filter(t => t.isActive);
    }
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static async saveTaxonomy(item: TaxonomyItem): Promise<TaxonomyItem> {
    const idx = inMemoryStore.taxonomies.findIndex(t => t.id === item.id);
    if (idx >= 0) {
      inMemoryStore.taxonomies[idx] = item;
    } else {
      inMemoryStore.taxonomies.push(item);
    }
    return item;
  }

  /* =========================================================
     INSTITUTIONS DIRECTORY
  ========================================================= */
  private static async getMergedInstitutions(): Promise<Institution[]> {
    let list = inMemoryStore.institutions;
    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
        // Unfiltered list is only permitted by the rules for an authenticated superadmin
        // (whose access doesn't depend on resource.data). Unauthenticated/public callers
        // must filter on `status` to match the rule's data-dependent branch, or Firestore
        // denies the list outright — fall back to that filtered query in that case.
        let snap;
        try {
          snap = await getDocs(collection(db, 'institutions'));
        } catch {
          snap = await getDocs(query(collection(db, 'institutions'), where('status', '==', 'ACTIVE')));
        }
        if (!snap.empty) {
          const merged = new Map(list.map(i => [i.id, i]));
          snap.docs.forEach(d => merged.set(d.id, { id: d.id, ...d.data() } as Institution));
          list = Array.from(merged.values());
        }
      }
    } catch (e) {
      console.warn('Firestore fallback to in-memory store for institutions');
    }
    return list;
  }

  static async getInstitutions(filter?: {
    categoryId?: string;
    governorateId?: string;
    keyword?: string;
    isVerified?: boolean;
    status?: string; // pass 'ALL' (admin use only) to include every status, not just ACTIVE
  }): Promise<Institution[]> {
    let list = await this.getMergedInstitutions();
    if (filter?.status === 'ALL') {
      // no status filtering — admin needs to see PENDING/INACTIVE listings too
    } else if (filter?.status) {
      list = list.filter(i => i.status === filter.status);
    } else {
      list = list.filter(i => i.status === 'ACTIVE');
    }
    if (filter) {
      if (filter.categoryId && filter.categoryId !== 'all') {
        list = list.filter(i => i.categoryId === filter.categoryId);
      }
      if (filter.governorateId && filter.governorateId !== 'all') {
        list = list.filter(i => i.governorateId === filter.governorateId);
      }
      if (filter.isVerified !== undefined) {
        list = list.filter(i => i.isVerified === filter.isVerified);
      }
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase().trim();
        list = list.filter(i => 
          i.name.ar.toLowerCase().includes(kw) ||
          i.name.en.toLowerCase().includes(kw) ||
          i.description.ar.toLowerCase().includes(kw) ||
          i.description.en.toLowerCase().includes(kw) ||
          i.address.ar.toLowerCase().includes(kw)
        );
      }
    }
    return list;
  }

  static async getInstitutionById(id: string): Promise<Institution | null> {
    // A direct single-doc read (not the collection-wide getMergedInstitutions scan) — same fix
    // as getTutorById, for the same reason: an unfiltered collection query gets denied entirely
    // for a signed-in owner whose own doc is still 'PENDING' (e.g. right after approval, before
    // an admin activates it), even though isOwnerInstitution() already permits reading that doc
    // directly.
    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
        const snap = await getDoc(doc(db, 'institutions', id));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Institution;
      }
    } catch (e) {
      console.warn('Firestore fallback to in-memory store for institution', id);
    }
    return inMemoryStore.institutions.find(i => i.id === id) || null;
  }

  static async getInstitutionBySlug(slug: string): Promise<Institution | null> {
    const list = await this.getMergedInstitutions();
    return list.find(i => i.slug === slug || i.id === slug) || null;
  }

  static async saveInstitution(inst: Institution): Promise<Institution> {
    const now = new Date().toISOString();
    const toSave: Institution = { ...inst, createdAt: inst.createdAt || now, updatedAt: now };

    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
        await setDoc(doc(db, 'institutions', toSave.id), toSave, { merge: true });
      }
    } catch (e) {
      console.warn('Error persisting institution to Firestore:', e);
    }

    const idx = inMemoryStore.institutions.findIndex(i => i.id === toSave.id);
    if (idx >= 0) {
      inMemoryStore.institutions[idx] = toSave;
    } else {
      inMemoryStore.institutions.push(toSave);
    }
    return toSave;
  }

  static async deleteInstitution(id: string): Promise<void> {
    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
        // Firestore doesn't cascade-delete subcollections when their parent doc goes.
        await deleteDoc(doc(db, 'institutions', id, 'private', 'verification')).catch(() => {});
        await deleteDoc(doc(db, 'institutions', id));
      }
    } catch (e) {
      console.warn('Error deleting institution from Firestore:', e);
    }
    inMemoryStore.institutions = inMemoryStore.institutions.filter(i => i.id !== id);
  }

  // Accreditation/verification documents live in a private subcollection, same reasoning as
  // the tutor equivalent — the institution doc is world-readable once status is 'ACTIVE'.
  static async getInstitutionVerificationDocuments(institutionId: string): Promise<string[]> {
    const snap = await getDoc(doc(db, 'institutions', institutionId, 'private', 'verification'));
    return snap.exists() ? (snap.data().documents as string[]) || [] : [];
  }

  static async saveInstitutionVerificationDocuments(institutionId: string, documents: string[]): Promise<void> {
    await setDoc(doc(db, 'institutions', institutionId, 'private', 'verification'), { documents });
  }

  /* =========================================================
     PRIVATE TUTORS
  ========================================================= */
  private static async getMergedTutors(): Promise<Tutor[]> {
    let list = inMemoryStore.tutors;
    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
        let snap;
        try {
          snap = await getDocs(collection(db, 'tutors'));
        } catch {
          snap = await getDocs(query(collection(db, 'tutors'), where('status', '==', 'ACTIVE')));
        }
        if (!snap.empty) {
          const merged = new Map(list.map(t => [t.id, t]));
          snap.docs.forEach(d => merged.set(d.id, { id: d.id, ...d.data() } as Tutor));
          list = Array.from(merged.values());
        }
      }
    } catch (e) {
      console.warn('Firestore fallback to in-memory store for tutors');
    }
    return list;
  }

  static async getTutors(filter?: {
    governorateId?: string;
    subjectId?: string;
    isVerified?: boolean;
    status?: string; // pass 'ALL' (admin use only) to include every status, not just ACTIVE
  }): Promise<Tutor[]> {
    let list = await this.getMergedTutors();
    if (filter?.status === 'ALL') {
      // no status filtering — admin needs to see PENDING/INACTIVE listings too
    } else if (filter?.status) {
      list = list.filter(t => t.status === filter.status);
    } else {
      list = list.filter(t => t.status === 'ACTIVE');
    }
    if (filter) {
      if (filter.governorateId && filter.governorateId !== 'all') {
        list = list.filter(t => t.governorateId === filter.governorateId);
      }
      if (filter.subjectId) {
        list = list.filter(t => t.subjectIds.includes(filter.subjectId!));
      }
      if (filter.isVerified !== undefined) {
        list = list.filter(t => t.isVerified === filter.isVerified);
      }
    }
    return list;
  }

  static async getTutorById(id: string): Promise<Tutor | null> {
    // A direct single-doc read (not the collection-wide getMergedTutors scan) so Firestore's
    // per-document rules apply correctly — in particular so a tutor can read their OWN doc via
    // isOwnerTutor() even while status is still 'PENDING' (e.g. right after approval, before an
    // admin activates them), which an unfiltered collection query would otherwise deny entirely.
    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
        const snap = await getDoc(doc(db, 'tutors', id));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Tutor;
      }
    } catch (e) {
      console.warn('Firestore fallback to in-memory store for tutor', id);
    }
    return inMemoryStore.tutors.find(t => t.id === id) || null;
  }

  static async saveTutor(tutor: Tutor): Promise<Tutor> {
    const now = new Date().toISOString();
    const toSave: Tutor = { ...tutor, createdAt: tutor.createdAt || now, updatedAt: now };

    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
        await setDoc(doc(db, 'tutors', toSave.id), toSave, { merge: true });
      }
    } catch (e) {
      console.warn('Error persisting tutor to Firestore:', e);
    }

    const idx = inMemoryStore.tutors.findIndex(t => t.id === toSave.id);
    if (idx >= 0) {
      inMemoryStore.tutors[idx] = toSave;
    } else {
      inMemoryStore.tutors.push(toSave);
    }
    return toSave;
  }

  static async deleteTutor(id: string): Promise<void> {
    try {
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
        // Firestore doesn't cascade-delete subcollections when their parent doc goes —
        // clean up the private verification doc explicitly so it doesn't linger orphaned.
        await deleteDoc(doc(db, 'tutors', id, 'private', 'verification')).catch(() => {});
        await deleteDoc(doc(db, 'tutors', id));
      }
    } catch (e) {
      console.warn('Error deleting tutor from Firestore:', e);
    }
    inMemoryStore.tutors = inMemoryStore.tutors.filter(t => t.id !== id);
  }

  // Verification documents live in a private subcollection, not on the tutor doc itself —
  // that doc is world-readable once status is 'ACTIVE', which would leak these otherwise.
  static async getTutorVerificationDocuments(tutorId: string): Promise<string[]> {
    const snap = await getDoc(doc(db, 'tutors', tutorId, 'private', 'verification'));
    return snap.exists() ? (snap.data().documents as string[]) || [] : [];
  }

  static async saveTutorVerificationDocuments(tutorId: string, documents: string[]): Promise<void> {
    await setDoc(doc(db, 'tutors', tutorId, 'private', 'verification'), { documents });
  }

  /* =========================================================
     REVIEWS
  ========================================================= */
  static async createReview(review: Omit<Review, 'id' | 'createdAt' | 'status'>): Promise<Review> {
    const ref = doc(collection(db, 'reviews'));
    const newReview: Review = { ...review, id: ref.id, status: 'PENDING', createdAt: new Date().toISOString() };
    await setDoc(ref, newReview);
    return newReview;
  }

  static async getApprovedReviews(institutionId: string): Promise<Review[]> {
    const q = query(
      collection(db, 'reviews'),
      where('institutionId', '==', institutionId),
      where('status', '==', 'APPROVED')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Review))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static async getApprovedTutorReviews(tutorId: string): Promise<Review[]> {
    const q = query(
      collection(db, 'reviews'),
      where('tutorId', '==', tutorId),
      where('status', '==', 'APPROVED')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Review))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static async getAllReviews(): Promise<Review[]> {
    const snap = await getDocs(collection(db, 'reviews'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Review))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static async updateReviewStatus(id: string, status: Review['status'], review: Review): Promise<void> {
    await updateDoc(doc(db, 'reviews', id), { status });
    if (status !== 'APPROVED') return;

    if (review.institutionId) {
      const approved = await this.getApprovedReviews(review.institutionId);
      const ratingAvg = approved.length
        ? Number((approved.reduce((sum, r) => sum + r.rating, 0) / approved.length).toFixed(1))
        : 0;
      await updateDoc(doc(db, 'institutions', review.institutionId), {
        'metrics.ratingAvg': ratingAvg,
        'metrics.reviewCount': approved.length,
      });
    } else if (review.tutorId) {
      const approved = await this.getApprovedTutorReviews(review.tutorId);
      const ratingAvg = approved.length
        ? Number((approved.reduce((sum, r) => sum + r.rating, 0) / approved.length).toFixed(1))
        : 0;
      await updateDoc(doc(db, 'tutors', review.tutorId), {
        ratingAvg,
        reviewCount: approved.length,
      });
    }
  }

  // Tutor replying to their own approved review — firestore.rules restricts this update to
  // touching only the `reply` field, so it must be the *only* key in this call's payload.
  static async replyToReview(reviewId: string, text: string): Promise<void> {
    await updateDoc(doc(db, 'reviews', reviewId), {
      reply: { text, createdAt: new Date().toISOString() },
    });
  }

  /* =========================================================
     INQUIRIES & LEADS
  ========================================================= */
  static async createInquiry(inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'status'>): Promise<Inquiry> {
    const ref = doc(collection(db, 'inquiries'));
    const newInquiry: Inquiry = { ...inquiry, id: ref.id, status: 'NEW', createdAt: new Date().toISOString() };
    await setDoc(ref, newInquiry);
    return newInquiry;
  }

  static async getAllInquiries(): Promise<Inquiry[]> {
    const snap = await getDocs(collection(db, 'inquiries'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Inquiry))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static async updateInquiryStatus(id: string, status: Inquiry['status']): Promise<void> {
    await updateDoc(doc(db, 'inquiries', id), { status });
  }

  // An institution's own inquiries (isOwnerInstitution rule scopes this to their own docs only).
  static async getInstitutionInquiries(institutionId: string): Promise<Inquiry[]> {
    const q = query(collection(db, 'inquiries'), where('institutionId', '==', institutionId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Inquiry))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static async replyToInquiry(inquiryId: string, text: string): Promise<void> {
    await updateDoc(doc(db, 'inquiries', inquiryId), {
      reply: { text, createdAt: new Date().toISOString() },
    });
  }

  /* =========================================================
     JOIN APPLICATIONS (Tutor / Institution)
  ========================================================= */
  static async createApplication(app: Omit<Application, 'id' | 'createdAt' | 'status'>): Promise<Application> {
    const ref = doc(collection(db, 'applications'));
    const newApp: Application = { ...app, id: ref.id, status: 'PENDING', createdAt: new Date().toISOString() };
    // Firestore's client SDK rejects explicit `undefined` field values — drop optional fields the caller left unset.
    const payload = Object.fromEntries(Object.entries(newApp).filter(([, v]) => v !== undefined));
    await setDoc(ref, payload);
    return newApp;
  }

  static async getAllApplications(): Promise<Application[]> {
    const snap = await getDocs(collection(db, 'applications'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Application))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static async rejectApplication(id: string, rejectionReason?: string): Promise<void> {
    await updateDoc(doc(db, 'applications', id), {
      status: 'REJECTED',
      reviewedAt: new Date().toISOString(),
      ...(rejectionReason ? { rejectionReason } : {}),
    });
  }

  // Approval provisions a real login (tutors) via the Admin SDK, so it goes through an API route.
  static async approveApplication(id: string): Promise<{ tutorId?: string; resetLink?: string; note?: string }> {
    const res = await fetch(`/api/applications/${id}/approve`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Approval failed');
    return data;
  }

  /* =========================================================
     SETTINGS & QUICK SEARCH TAGS
  ========================================================= */
  static async getQuickSearchTags(): Promise<QuickSearchTag[]> {
    return inMemoryStore.quickSearchTags.filter(t => t.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static async getSystemSettings(): Promise<SystemSettings> {
    return inMemoryStore.systemSettings;
  }

  static async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    inMemoryStore.systemSettings = { ...inMemoryStore.systemSettings, ...settings };
    return inMemoryStore.systemSettings;
  }

  /* =========================================================
     BOOKINGS (tutor's own — read/manage via client SDK; creation
     and group-join price splitting happen server-side, see /api/bookings)
  ========================================================= */
  static async getTutorBookings(tutorId: string): Promise<Booking[]> {
    const q = query(collection(db, 'bookings'), where('tutorId', '==', tutorId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Booking))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }

  static async updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
    await updateDoc(doc(db, 'bookings', id), { status });
  }

  static async getAllBookings(): Promise<Booking[]> {
    const snap = await getDocs(collection(db, 'bookings'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Booking))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }

  /* =========================================================
     JOBS & JOB APPLICATIONS
  ========================================================= */
  static async createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    const ref = doc(collection(db, 'jobs'));
    const now = new Date().toISOString();
    const newJob: Job = { ...job, id: ref.id, createdAt: now, updatedAt: now };
    const payload = Object.fromEntries(Object.entries(newJob).filter(([, v]) => v !== undefined));
    await setDoc(ref, payload);
    return newJob;
  }

  static async updateJob(id: string, patch: Partial<Job>): Promise<void> {
    await updateDoc(doc(db, 'jobs', id), { ...patch, updatedAt: new Date().toISOString() });
  }

  // Direct getDoc, bypassing any bulk-query restriction — mirrors getInstitutionById/getTutorById
  // so an owner can load their own DRAFT/CLOSED job even though a bulk unfiltered query would
  // otherwise be denied for a non-ACTIVE doc.
  static async getJobById(id: string): Promise<Job | null> {
    const snap = await getDoc(doc(db, 'jobs', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Job) : null;
  }

  static async getInstitutionJobs(institutionId: string): Promise<Job[]> {
    const q = query(collection(db, 'jobs'), where('institutionId', '==', institutionId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Job))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // Public directory of open jobs — jobs are dynamic/time-sensitive so (unlike institutions/tutors)
  // there's no in-memory seed fallback here, just a straight Firestore query on the one indexable
  // field (status) with the rest filtered client-side, same approach the /tutors listing uses.
  static async getActiveJobs(filters?: { governorateId?: string; employmentType?: Job['employmentType']; isRemote?: boolean; subjectId?: string }): Promise<Job[]> {
    const q = query(collection(db, 'jobs'), where('status', '==', 'ACTIVE'));
    const snap = await getDocs(q);
    let jobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
    if (filters?.governorateId) jobs = jobs.filter(j => j.governorateId === filters.governorateId);
    if (filters?.employmentType) jobs = jobs.filter(j => j.employmentType === filters.employmentType);
    if (filters?.isRemote) jobs = jobs.filter(j => j.isRemote);
    if (filters?.subjectId) jobs = jobs.filter(j => j.subjectIds?.includes(filters.subjectId!));
    return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static async createJobApplication(app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<JobApplication> {
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
  static async getInstitutionJobApplications(institutionId: string): Promise<JobApplication[]> {
    const q = query(collection(db, 'jobApplications'), where('institutionId', '==', institutionId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as JobApplication))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static async updateJobApplicationStatus(id: string, status: JobApplication['status']): Promise<void> {
    await updateDoc(doc(db, 'jobApplications', id), { status, updatedAt: new Date().toISOString() });
  }

  static async updateJobApplicationNotes(id: string, internalNotes: string): Promise<void> {
    await updateDoc(doc(db, 'jobApplications', id), { internalNotes, updatedAt: new Date().toISOString() });
  }

  // Platform-wide oversight (superadmin only, per firestore.rules).
  static async getAllJobs(): Promise<Job[]> {
    const snap = await getDocs(collection(db, 'jobs'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Job))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static async getAllJobApplications(): Promise<JobApplication[]> {
    const snap = await getDocs(collection(db, 'jobApplications'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as JobApplication));
  }

  /* =========================================================
     MESSAGING — one thread per context (a Booking or an Inquiry), doc id == that context's id.
     Tutor/institution owner side only — authenticated, direct via client SDK under
     firestore.rules. The guest (student/parent) side goes through /api/bookings/[id]/messages
     or /api/inquiries/[id]/messages instead, since guests have no account to authenticate
     against these rules directly.
  ========================================================= */
  static async getThreadMessages(contextId: string): Promise<ThreadMessage[]> {
    const q = query(collection(db, 'threads', contextId, 'messages'), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ThreadMessage);
  }

  private static async sendOwnerMessage(
    thread: Omit<Thread, 'lastMessageAt' | 'lastMessagePreview' | 'createdAt'>,
    senderRole: 'tutor' | 'institution',
    senderName: string,
    text: string
  ): Promise<ThreadMessage> {
    const now = new Date().toISOString();
    const threadRef = doc(db, 'threads', thread.id);
    const messageRef = doc(collection(db, 'threads', thread.id, 'messages'));

    const message: ThreadMessage = { id: messageRef.id, senderRole, senderName, text, createdAt: now };

    // Reading a thread doc that doesn't exist yet is denied by firestore.rules (it can't evaluate
    // resource.data on nothing), which only stayed invisible so far because a guest's first message
    // — sent via the Admin SDK route, bypassing rules — always created the thread before an owner
    // got here. Job applications have no such guaranteed first guest message, so treat a denied
    // existence check the same as "doesn't exist yet" rather than letting it throw.
    let existingThread;
    try {
      existingThread = await getDoc(threadRef);
    } catch {
      existingThread = null;
    }
    if (existingThread?.exists()) {
      await updateDoc(threadRef, { lastMessageAt: now, lastMessagePreview: text.slice(0, 140) });
    } else {
      const newThread: Thread = { ...thread, lastMessageAt: now, lastMessagePreview: text.slice(0, 140), createdAt: now };
      await setDoc(threadRef, newThread);
    }
    await setDoc(messageRef, message);
    return message;
  }

  static async sendTutorMessage(booking: Booking, senderName: string, text: string): Promise<ThreadMessage> {
    return this.sendOwnerMessage(
      { id: booking.id, tutorId: booking.tutorId, participantPhones: booking.participantPhones },
      'tutor',
      senderName,
      text
    );
  }

  static async sendInstitutionMessage(inquiry: Inquiry, senderName: string, text: string): Promise<ThreadMessage> {
    return this.sendOwnerMessage(
      { id: inquiry.id, institutionId: inquiry.institutionId, participantPhones: [inquiry.phone] },
      'institution',
      senderName,
      text
    );
  }
}
