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
    status?: string;
  }): Promise<Institution[]> {
    let list = await this.getMergedInstitutions();
    if (filter) {
      if (filter.status) {
        list = list.filter(i => i.status === filter.status);
      } else {
        list = list.filter(i => i.status === 'ACTIVE');
      }
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
    const list = await this.getMergedInstitutions();
    return list.find(i => i.id === id) || null;
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
        await deleteDoc(doc(db, 'institutions', id));
      }
    } catch (e) {
      console.warn('Error deleting institution from Firestore:', e);
    }
    inMemoryStore.institutions = inMemoryStore.institutions.filter(i => i.id !== id);
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
  }): Promise<Tutor[]> {
    let list = (await this.getMergedTutors()).filter(t => t.status === 'ACTIVE');
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
    const list = await this.getMergedTutors();
    return list.find(t => t.id === id) || null;
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
        await deleteDoc(doc(db, 'tutors', id));
      }
    } catch (e) {
      console.warn('Error deleting tutor from Firestore:', e);
    }
    inMemoryStore.tutors = inMemoryStore.tutors.filter(t => t.id !== id);
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
}
