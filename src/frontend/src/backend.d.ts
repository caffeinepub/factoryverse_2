import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type PersonnelId = string;
export type Timestamp = bigint;
export type MachineId = string;
export interface Machine {
    id: MachineId;
    status: string;
    name: string;
    createdAt: Timestamp;
    serialNumber: string;
    notes: string;
    location: string;
    machineType: string;
    companyId: CompanyId;
}
export interface Task {
    id: TaskId;
    status: string;
    title: string;
    assigneeId: AssigneeId;
    dueDate: DeadLine;
    projectId: ProjectId;
    companyId: CompanyId;
}
export interface Failure {
    id: string;
    machineId: string;
    companyId: CompanyId;
    title: string;
    description: string;
    severity: string;
    status: string;
    reportedBy: string;
    reportedAt: Timestamp;
    resolvedAt: string;
}
export interface FailureWithProject {
    id: string;
    machineId: string;
    companyId: CompanyId;
    title: string;
    description: string;
    severity: string;
    status: string;
    reportedBy: string;
    reportedAt: Timestamp;
    resolvedAt: string;
    projectId: string;
}
export interface Document {
    id: string;
    companyId: CompanyId;
    title: string;
    fileName: string;
    category: string;
    uploadedBy: string;
    createdAt: Timestamp;
}
export interface HseRecord {
    id: string;
    companyId: CompanyId;
    hseType: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    reportedBy: string;
    createdAt: Timestamp;
}
export interface Shipment {
    id: string;
    companyId: string;
    title: string;
    machineId: string;
    fromLocation: string;
    toLocation: string;
    carrier: string;
    status: string;
    shipDate: string;
    estimatedDelivery: string;
    notes: string;
    createdAt: Timestamp;
}
export type CompanyId = string;
export interface AuthenticatedUser {
    role?: string;
    personnelId?: PersonnelId;
    companyId?: CompanyId;
}
export type TaskId = bigint;
export type Code = string;
export type ProjectId = string;
export interface Project {
    id: ProjectId;
    status: string;
    name: string;
    createdAt: Timestamp;
    description: string;
    deadline: string;
    companyId: CompanyId;
}
export type DeadLine = string;
export interface UserProfile {
    name: string;
    email: string;
    personnelId?: PersonnelId;
    companyId?: CompanyId;
}
export type AssigneeId = string;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface Personnel {
    id: string;
    companyId?: CompanyId;
    name: string;
    role: string;
    loginCode: string;
    inviteCode: string;
    createdAt: Timestamp;
}
export interface ProjectAssignment {
    id: string;
    companyId: CompanyId;
    projectId: ProjectId;
    personnelId: string;
    personnelName: string;
    role: string;
    assignedAt: Timestamp;
}
export interface backendInterface {
    addMachine(companyId: string, name: string, machineType: string, serialNumber: string, location: string, notes: string): Promise<string>;
    addPersonnelToCompany(adminCode: Code, inviteCode: Code, role: string): Promise<void>;
    addTask(projectId: string, companyId: string, title: string, assigneeId: string, dueDate: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    authenticate(code: Code): Promise<AuthenticatedUser | null>;
    createProject(companyId: string, name: string, description: string, deadline: string): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listMachines(companyId: string): Promise<Array<Machine>>;
    listProjects(companyId: string): Promise<Array<Project>>;
    listTasks(projectId: string): Promise<Array<Task>>;
    registerCompany(name: string, mode: string): Promise<{ id: CompanyId; adminCode: Code }>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selfRegisterPersonnel(name: string, role: string): Promise<{ loginCode: Code; inviteCode: Code }>;
    updateMachineStatus(machineId: string, status: string): Promise<void>;
    addFailure(machineId: string, companyId: string, title: string, description: string, severity: string, reportedBy: string, projectId: string): Promise<string>;
    listFailures(companyId: string): Promise<Array<FailureWithProject>>;
    updateFailureStatus(failureId: string, status: string): Promise<void>;
    addDocument(companyId: string, title: string, fileName: string, category: string, uploadedBy: string): Promise<string>;
    listDocuments(companyId: string): Promise<Array<Document>>;
    deleteDocument(documentId: string): Promise<void>;
    addHseRecord(companyId: string, hseType: string, title: string, description: string, severity: string, reportedBy: string): Promise<string>;
    listHseRecords(companyId: string): Promise<Array<HseRecord>>;
    updateHseStatus(hseId: string, status: string): Promise<void>;
    addShipment(companyId: string, title: string, machineId: string, fromLocation: string, toLocation: string, carrier: string, shipDate: string, estimatedDelivery: string, notes: string): Promise<string>;
    listShipments(companyId: string): Promise<Array<Shipment>>;
    updateShipmentStatus(shipmentId: string, status: string): Promise<void>;
    addMaintenancePlan(companyId: string, machineId: string, title: string, description: string, frequency: string, nextDate: string, assignedTo: string): Promise<string>;
    listMaintenancePlans(companyId: string): Promise<Array<MaintenancePlan>>;
    updateMaintenancePlanStatus(planId: string, status: string): Promise<void>;
    addProjectCost(companyId: string, projectId: string, title: string, category: string, amount: number, currency: string, description: string, createdBy: string): Promise<string>;
    listProjectCosts(companyId: string): Promise<Array<ProjectCost>>;
    deleteProjectCost(costId: string): Promise<void>;
    assignPersonnelToProject(companyId: string, projectId: string, personnelId: string, role: string): Promise<string>;
    removePersonnelFromProject(assignmentId: string): Promise<void>;
    listProjectAssignments(projectId: string): Promise<Array<ProjectAssignment>>;
    listCompanyPersonnel(companyId: string): Promise<Array<Personnel>>;
}

export interface MaintenancePlan {
    id: string;
    companyId: CompanyId;
    machineId: string;
    title: string;
    description: string;
    frequency: string;
    nextDate: string;
    assignedTo: string;
    status: string;
    createdAt: Timestamp;
}

export interface ProjectCost {
    id: string;
    companyId: CompanyId;
    projectId: ProjectId;
    title: string;
    category: string;
    amount: number;
    currency: string;
    description: string;
    createdBy: string;
    createdAt: Timestamp;
}
