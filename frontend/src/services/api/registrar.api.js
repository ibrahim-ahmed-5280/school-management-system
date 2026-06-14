import { http } from './http';

export const getCurrentAcademicYear = async () => {
    return await http.get('/registrar/academic-years/current');
};

export const createStudentAdmission = async (data) => {
    return await http.post('/registrar/students', data);
};

export const getStudents = async (params) => {
    // params: { classId, academicYearId, status, q }
    return await http.get('/registrar/students', { params });
};

export const getStudentById = async (id) => {
    return await http.get(`/registrar/students/${id}`);
};

export const updateStudent = async (id, data) => {
    return await http.put(`/registrar/students/${id}`, data);
};

export const createEnrollment = async (data) => {
    return await http.post('/registrar/enrollments', data);
};

export const transferStudentBranch = async (data) => {
    return await http.post('/registrar/transfers/branch', data);
};

export const getTransferBranches = async () => {
    return await http.get('/tenant/branches');
};

export const getTransferBranchClasses = async (branchId) => {
    return await http.get(`/tenant/branches/${branchId}/classes`);
};

export const apiResetStudentPassword = async (id) => {
    return await http.put(`/registrar/students/${id}/reset-password`);
};

export const getRegistrarStats = async () => {
    return await http.get('/registrar/stats');
};
