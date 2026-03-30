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
export interface Shipment {
    id: ShipmentId;
    status: string;
    title: string;
    shipDate: string;
    createdAt: Timestamp;
    estimatedDelivery: string;
    toLocation: string;
    fromLocation: string;
    notes: string;
    carrier: string;
    machineId: string;
    companyId: CompanyId;
}
export type MaintenancePlanId = string;
export interface Document {
    id: DocumentId;
    title: string;
    createdAt: Timestamp;
    fileName: string;
    category: string;
    uploadedBy: string;
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
export interface ProjectCost {
    id: ProjectCostId;
    title: string;
    createdAt: Timestamp;
    createdBy: string;
    description: string;
    projectId: ProjectId;
    currency: string;
    category: string;
    amount: number;
    companyId: CompanyId;
}
export type ProjectAssignmentId = string;
export interface ProjectAssignment {
    id: ProjectAssignmentId;
    assignedAt: Timestamp;
    role: string;
    personnelId: PersonnelId;
    projectId: ProjectId;
    personnelName: string;
    companyId: CompanyId;
}
export type FailureId = string;
export type Code = string;
export type DocumentId = string;
export interface FailureWithProject {
    id: FailureId;
    status: string;
    title: string;
    description: string;
    reportedAt: Timestamp;
    reportedBy: string;
    projectId: string;
    severity: string;
    machineId: MachineId;
    resolvedAt: string;
    companyId: CompanyId;
}
export interface Personnel {
    id: PersonnelId;
    loginCode: Code;
    name: string;
    createdAt: Timestamp;
    role: string;
    inviteCode: Code;
    companyId?: CompanyId;
}
export interface HseRecord {
    id: HseId;
    status: string;
    title: string;
    hseType: string;
    createdAt: Timestamp;
    description: string;
    reportedBy: string;
    severity: string;
    companyId: CompanyId;
}
export type AssigneeId = string;
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
export type ShipmentId = string;
export type CompanyId = string;
export interface AuthenticatedUser {
    role?: string;
    personnelId?: PersonnelId;
    companyId?: CompanyId;
}
export interface MaintenancePlan {
    id: MaintenancePlanId;
    status: string;
    title: string;
    assignedTo: string;
    createdAt: Timestamp;
    description: string;
    frequency: string;
    machineId: string;
    nextDate: string;
    companyId: CompanyId;
}
export type HseId = string;
export type TaskId = bigint;
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
export type ProjectCostId = string;
export interface UserProfile {
    name: string;
    email: string;
    personnelId?: PersonnelId;
    companyId?: CompanyId;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDocument(companyId: string, title: string, fileName: string, category: string, uploadedBy: string): Promise<string>;
    addFailure(machineId: string, companyId: string, title: string, description: string, severity: string, reportedBy: string, projectId: string): Promise<string>;
    addHseRecord(companyId: string, hseType: string, title: string, description: string, severity: string, reportedBy: string): Promise<string>;
    addMachine(companyId: string, name: string, machineType: string, serialNumber: string, location: string, notes: string): Promise<string>;
    addMaintenancePlan(companyId: string, machineId: string, title: string, description: string, frequency: string, nextDate: string, assignedTo: string): Promise<string>;
    addPersonnelToCompany(adminCode: Code, inviteCode: Code, role: string): Promise<void>;
    addProjectCost(companyId: string, projectId: string, title: string, category: string, amount: number, currency: string, description: string, createdBy: string): Promise<string>;
    addShipment(companyId: string, title: string, machineId: string, fromLocation: string, toLocation: string, carrier: string, shipDate: string, estimatedDelivery: string, notes: string): Promise<string>;
    addTask(projectId: string, companyId: string, title: string, assigneeId: string, dueDate: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignPersonnelToProject(companyId: string, projectId: string, personnelId: string, role: string): Promise<string>;
    authenticate(code: Code): Promise<AuthenticatedUser | null>;
    createProject(companyId: string, name: string, description: string, deadline: string): Promise<string>;
    deleteDocument(documentId: string): Promise<void>;
    deleteMachine(machineId: string): Promise<void>;
    deleteProjectCost(costId: string): Promise<void>;
    deleteTask(taskId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFailureMaintenance(failureId: string): Promise<string>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    linkFailureMaintenance(failureId: string, maintenancePlanId: string): Promise<void>;
    listCompanyPersonnel(companyId: string): Promise<Array<Personnel>>;
    listDocuments(companyId: string): Promise<Array<Document>>;
    listFailures(companyId: string): Promise<Array<FailureWithProject>>;
    listHseRecords(companyId: string): Promise<Array<HseRecord>>;
    listMachines(companyId: string): Promise<Array<Machine>>;
    listMaintenancePlans(companyId: string): Promise<Array<MaintenancePlan>>;
    listProjectAssignments(projectId: string): Promise<Array<ProjectAssignment>>;
    listProjectCosts(companyId: string): Promise<Array<ProjectCost>>;
    listProjects(companyId: string): Promise<Array<Project>>;
    listShipments(companyId: string): Promise<Array<Shipment>>;
    listTasks(projectId: string): Promise<Array<Task>>;
    registerCompany(name: string, mode: string): Promise<{
        id: CompanyId;
        adminCode: Code;
    }>;
    removePersonnelFromProject(assignmentId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selfRegisterPersonnel(name: string, role: string): Promise<{
        loginCode: Code;
        inviteCode: Code;
    }>;
    updateFailureStatus(failureId: string, status: string): Promise<void>;
    updateHseStatus(hseId: string, status: string): Promise<void>;
    updateMachine(machineId: string, name: string, machineType: string, serialNumber: string, location: string, notes: string): Promise<void>;
    updateMachineStatus(machineId: string, status: string): Promise<void>;
    updateMaintenancePlanStatus(planId: string, status: string): Promise<void>;
    updateProjectStatus(projectId: string, status: string): Promise<void>;
    updateShipmentStatus(shipmentId: string, status: string): Promise<void>;
    updateTaskStatus(taskId: bigint, status: string): Promise<void>;
    addSupplier(companyId: string, name: string, category: string, contactName: string, contactPhone: string, contactEmail: string, address: string, notes: string): Promise<string>;
    deletePersonnel(personnelId: string): Promise<void>;
    deleteSupplier(supplierId: string): Promise<void>;
    listAllTasks(companyId: string): Promise<Array<Task>>;
    listSuppliers(companyId: string): Promise<Array<Supplier>>;
    resolveFailure(failureId: string, resolutionNote: string): Promise<void>;
    updatePersonnel(personnelId: string, name: string, role: string): Promise<void>;
    updateSupplier(supplierId: string, name: string, category: string, contactName: string, contactPhone: string, contactEmail: string, address: string, notes: string): Promise<void>;
    updateSupplierStatus(supplierId: string, status: string): Promise<void>;
    updateTask(taskId: bigint, title: string, assigneeId: string, dueDate: string): Promise<void>;
    // Sürüm 23
    updateShipment(shipmentId: string, title: string, machineId: string, fromLocation: string, toLocation: string, carrier: string, shipDate: string, estimatedDelivery: string, notes: string): Promise<void>;
    deleteShipment(shipmentId: string): Promise<void>;
    updateHseRecord(hseId: string, hseType: string, title: string, description: string, severity: string): Promise<void>;
    deleteHseRecord(hseId: string): Promise<void>;
    updateMaintenancePlan(planId: string, title: string, description: string, frequency: string, nextDate: string, assignedTo: string): Promise<void>;
    deleteMaintenancePlan(planId: string): Promise<void>;
    updateDocument(documentId: string, title: string, fileName: string, category: string): Promise<void>;
    updateProjectCost(costId: string, title: string, category: string, amount: number, currency: string, description: string): Promise<void>;
}

// Sürüm 22 additions
export type SupplierId = string;
export interface Supplier {
    id: SupplierId;
    companyId: CompanyId;
    name: string;
    category: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
    notes: string;
    status: string;
    createdAt: Timestamp;
}
