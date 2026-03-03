'use server';

import { initializeFirebase } from '@/firebase/index';
import { collection, doc, getDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { Case, UpcomingAppointment, ReportedTicket } from '@/lib/types';

export async function getUserDashboardData(userId: string) {
    const { firestore: db } = initializeFirebase();
    if (!db) {
        throw new Error('Firebase not initialized');
    }

    // 1. Fetch Cases (Chats)
    const chatsRef = collection(db, 'chats');

    const participantsQuery = await getDocs(query(chatsRef, where('participants', 'array-contains', userId)));
    const userIdQuery = await getDocs(query(chatsRef, where('userId', '==', userId)));

    const chatDocs = new Map();
    participantsQuery.docs.forEach(d => chatDocs.set(d.id, d));
    userIdQuery.docs.forEach(d => chatDocs.set(d.id, d));

    const cases: Case[] = [];

    // Helper to get lawyer details
    // Optimization: Cache lawyer profiles to avoid repetitive fetches
    const lawyerCache = new Map();

    const getLawyerDetails = async (lawyerIdParam: string | undefined): Promise<any> => {
        if (!lawyerIdParam) return { id: 'unknown', name: 'Unknown Lawyer', imageUrl: '', imageHint: '' };
        if (lawyerCache.has(lawyerIdParam)) return lawyerCache.get(lawyerIdParam);

        let lawyerData = { id: lawyerIdParam, name: 'Unknown Lawyer', imageUrl: '', imageHint: '' };

        // Try lawyerProfiles first
        const lawyerDoc = await getDoc(doc(db, 'lawyerProfiles', lawyerIdParam));
        if (lawyerDoc.exists()) {
            const d = lawyerDoc.data();
            lawyerData = {
                id: lawyerDoc.id,
                name: d?.name || 'Unknown Lawyer',
                imageUrl: d?.imageUrl || '',
                imageHint: d?.imageHint || ''
            };
        } else {
            // Fallback to users
            const userDoc = await getDoc(doc(db, 'users', lawyerIdParam));
            if (userDoc.exists()) {
                const d = userDoc.data();
                lawyerData = {
                    id: userDoc.id,
                    name: d?.name || 'Unknown Lawyer',
                    imageUrl: '',
                    imageHint: ''
                };
            }
        }
        lawyerCache.set(lawyerIdParam, lawyerData);
        return lawyerData;
    };

    for (const doc of chatDocs.values()) {
        const data = doc.data();

        // Logic to find lawyerId (same as client-side)
        let lawyerId = data.lawyerId;
        if (!lawyerId && data.participants && Array.isArray(data.participants)) {
            lawyerId = data.participants.find((p: string) => p !== userId);
        }

        const lawyer = await getLawyerDetails(lawyerId);

        // Date handling: timestamps from Admin SDK need to be converted to Date or String
        const lastMessageAt = data.lastMessageAt instanceof Timestamp
            ? data.lastMessageAt.toDate().toISOString()
            : new Date().toISOString();

        const updatedAt = data.lastMessageAt instanceof Timestamp
            ? data.lastMessageAt.toDate()
            : (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date());

        cases.push({
            id: doc.id,
            title: data.caseTitle || '',
            status: data.status || 'active',
            lastMessage: data.lastMessage || '',
            lastMessageTimestamp: lastMessageAt,
            lawyer: lawyer,
            updatedAt: updatedAt, // Note: Case type expects Date object, but for Client Component passing we might need serialization if direct. 
            // However, Next.js Server Actions can return Date objects which are serialized.
            rejectReason: data.rejectReason || '',
        });
    }

    // Sort cases by updated most recent
    cases.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // 2. Fetch Appointments
    const appointmentsRef = collection(db, 'appointments');
    const aptSnapshot = await getDocs(query(appointmentsRef, where('userId', '==', userId)));

    const appointments: UpcomingAppointment[] = [];
    for (const doc of aptSnapshot.docs) {
        const data = doc.data();
        const lawyer = await getLawyerDetails(data.lawyerId);

        // Filter future only
        const date = data.date instanceof Timestamp ? data.date.toDate() : new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        if (date >= todayStart) {
            appointments.push({
                id: doc.id,
                date: date,
                time: data.timeSlot || 'N/A',
                description: data.description || '',
                lawyer: { name: lawyer.name, imageUrl: lawyer.imageUrl, imageHint: lawyer.imageHint },
                status: data.status || 'pending'
            });
        }
    }

    // 3. Fetch Tickets
    const ticketsRef = collection(db, 'tickets');
    const ticketSnapshot = await getDocs(query(ticketsRef, where('userId', '==', userId)));

    const tickets: ReportedTicket[] = ticketSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            caseId: data.caseId || '',
            lawyerId: data.lawyerId || '',
            caseTitle: data.caseTitle || '',
            problemType: data.problemType || '',
            status: data.status || 'pending',
            reportedAt: data.reportedAt instanceof Timestamp ? data.reportedAt.toDate() : new Date(),
        };
    });

    return { cases, appointments, tickets };
}
