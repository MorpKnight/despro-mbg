import { api } from './api';

export interface Student {
    id: string;
    username: string;
    full_name: string;
    school_id: string;
    role: 'siswa';
    account_status: string;
    created_at: string;
}

export interface StudentCreate {
    username: string;
    password: string;
    full_name: string;
    role: 'siswa'; // Required by backend schema
    account_status?: string;
}

export interface StudentUpdate {
    username?: string;
    password?: string;
    full_name?: string;
    account_status?: string;
}

export async function fetchSchoolStudents(search?: string, schoolId?: string): Promise<Student[]> {
    const params = new URLSearchParams();
    if (search) params.append('query', search);
    if (schoolId) params.append('school_id', schoolId);

    return api(`school-admin/students?${params.toString()}`, {
        method: 'GET',
    });
}

export async function createStudent(data: StudentCreate, schoolId?: string): Promise<Student> {
    const params = new URLSearchParams();
    if (schoolId) params.append('school_id', schoolId);

    return api(`school-admin/students?${params.toString()}`, {
        method: 'POST',
        body: data,
    });
}

export async function bulkCreateStudents(data: { students: StudentCreate[] }, schoolId?: string): Promise<Student[]> {
    const params = new URLSearchParams();
    if (schoolId) params.append('school_id', schoolId);

    return api(`school-admin/students/bulk?${params.toString()}`, {
        method: 'POST',
        body: data,
    });
}

// Simplified bulk create - only requires full_name
export interface BulkSimpleCreate {
    students: string[];  // List of full_name only
}

export interface BulkCreateResult {
    full_name: string;
    username: string;
    password: string;
    success: boolean;
    error?: string;
}

export async function bulkCreateStudentsSimple(data: BulkSimpleCreate, schoolId?: string): Promise<BulkCreateResult[]> {
    const params = new URLSearchParams();
    if (schoolId) params.append('school_id', schoolId);

    return api(`school-admin/students/bulk-simple?${params.toString()}`, {
        method: 'POST',
        body: data,
    });
}

export async function updateStudent(id: string, data: StudentUpdate, schoolId?: string): Promise<Student> {
    const params = new URLSearchParams();
    if (schoolId) params.append('school_id', schoolId);

    return api(`school-admin/students/${id}?${params.toString()}`, {
        method: 'PATCH',
        body: data,
    });
}

export async function deleteStudent(id: string, schoolId?: string): Promise<void> {
    const params = new URLSearchParams();
    if (schoolId) params.append('school_id', schoolId);

    return api(`school-admin/students/${id}?${params.toString()}`, {
        method: 'DELETE',
    });
}
