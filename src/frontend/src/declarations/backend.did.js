/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

export const Code = IDL.Text;
export const UserRole = IDL.Variant({
  'admin' : IDL.Null,
  'user' : IDL.Null,
  'guest' : IDL.Null,
});
export const PersonnelId = IDL.Text;
export const CompanyId = IDL.Text;
export const AuthenticatedUser = IDL.Record({
  'role' : IDL.Opt(IDL.Text),
  'personnelId' : IDL.Opt(PersonnelId),
  'companyId' : IDL.Opt(CompanyId),
});
export const UserProfile = IDL.Record({
  'name' : IDL.Text,
  'email' : IDL.Text,
  'personnelId' : IDL.Opt(PersonnelId),
  'companyId' : IDL.Opt(CompanyId),
});
export const MachineId = IDL.Text;
export const Timestamp = IDL.Int;
export const Machine = IDL.Record({
  'id' : MachineId,
  'status' : IDL.Text,
  'name' : IDL.Text,
  'createdAt' : Timestamp,
  'serialNumber' : IDL.Text,
  'notes' : IDL.Text,
  'location' : IDL.Text,
  'machineType' : IDL.Text,
  'companyId' : CompanyId,
});
export const ProjectId = IDL.Text;
export const Project = IDL.Record({
  'id' : ProjectId,
  'status' : IDL.Text,
  'name' : IDL.Text,
  'createdAt' : Timestamp,
  'description' : IDL.Text,
  'deadline' : IDL.Text,
  'companyId' : CompanyId,
});
export const TaskId = IDL.Nat;
export const AssigneeId = IDL.Text;
export const DeadLine = IDL.Text;
export const Task = IDL.Record({
  'id' : TaskId,
  'status' : IDL.Text,
  'title' : IDL.Text,
  'assigneeId' : AssigneeId,
  'dueDate' : DeadLine,
  'projectId' : ProjectId,
  'companyId' : CompanyId,
});
export const FailureId = IDL.Text;
export const Failure = IDL.Record({
  'id' : IDL.Text,
  'machineId' : IDL.Text,
  'companyId' : CompanyId,
  'title' : IDL.Text,
  'description' : IDL.Text,
  'severity' : IDL.Text,
  'status' : IDL.Text,
  'reportedBy' : IDL.Text,
  'reportedAt' : Timestamp,
  'resolvedAt' : IDL.Text,
});
export const FailureWithProject = IDL.Record({
  'id' : IDL.Text,
  'machineId' : IDL.Text,
  'companyId' : CompanyId,
  'title' : IDL.Text,
  'description' : IDL.Text,
  'severity' : IDL.Text,
  'status' : IDL.Text,
  'reportedBy' : IDL.Text,
  'reportedAt' : Timestamp,
  'resolvedAt' : IDL.Text,
  'projectId' : IDL.Text,
});
export const Document = IDL.Record({
  'id' : IDL.Text,
  'companyId' : CompanyId,
  'title' : IDL.Text,
  'fileName' : IDL.Text,
  'category' : IDL.Text,
  'uploadedBy' : IDL.Text,
  'createdAt' : Timestamp,
});
export const HseRecord = IDL.Record({
  'id' : IDL.Text,
  'companyId' : CompanyId,
  'hseType' : IDL.Text,
  'title' : IDL.Text,
  'description' : IDL.Text,
  'severity' : IDL.Text,
  'status' : IDL.Text,
  'reportedBy' : IDL.Text,
  'createdAt' : Timestamp,
});
export const Shipment = IDL.Record({
  'id' : IDL.Text,
  'companyId' : CompanyId,
  'title' : IDL.Text,
  'machineId' : IDL.Text,
  'fromLocation' : IDL.Text,
  'toLocation' : IDL.Text,
  'carrier' : IDL.Text,
  'status' : IDL.Text,
  'shipDate' : IDL.Text,
  'estimatedDelivery' : IDL.Text,
  'notes' : IDL.Text,
  'createdAt' : Timestamp,
});

export const idlService = IDL.Service({
  '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
  'addMachine' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
  'addPersonnelToCompany' : IDL.Func([Code, Code, IDL.Text], [], []),
  'addTask' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
  'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
  'authenticate' : IDL.Func([Code], [IDL.Opt(AuthenticatedUser)], ['query']),
  'createProject' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
  'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
  'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
  'getUserProfile' : IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
  'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
  'listMachines' : IDL.Func([IDL.Text], [IDL.Vec(Machine)], ['query']),
  'listProjects' : IDL.Func([IDL.Text], [IDL.Vec(Project)], ['query']),
  'updateProjectStatus' : IDL.Func([IDL.Text, IDL.Text], [], []),
  'listTasks' : IDL.Func([IDL.Text], [IDL.Vec(Task)], ['query']),
  'registerCompany' : IDL.Func([IDL.Text, IDL.Text], [IDL.Record({ 'id' : CompanyId, 'adminCode' : Code })], []),
  'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
  'selfRegisterPersonnel' : IDL.Func([IDL.Text, IDL.Text], [IDL.Record({ 'loginCode' : Code, 'inviteCode' : Code })], []),
  'updateMachineStatus' : IDL.Func([IDL.Text, IDL.Text], [], []),
  'addFailure' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
  'listFailures' : IDL.Func([IDL.Text], [IDL.Vec(FailureWithProject)], ['query']),
  'updateFailureStatus' : IDL.Func([IDL.Text, IDL.Text], [], []),
  'addDocument' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
  'listDocuments' : IDL.Func([IDL.Text], [IDL.Vec(Document)], ['query']),
  'deleteDocument' : IDL.Func([IDL.Text], [], []),
  'addHseRecord' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
  'listHseRecords' : IDL.Func([IDL.Text], [IDL.Vec(HseRecord)], ['query']),
  'updateHseStatus' : IDL.Func([IDL.Text, IDL.Text], [], []),
  'addShipment' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
  'listShipments' : IDL.Func([IDL.Text], [IDL.Vec(Shipment)], ['query']),
  'updateShipmentStatus' : IDL.Func([IDL.Text, IDL.Text], [], []),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const Code = IDL.Text;
  const UserRole = IDL.Variant({ 'admin' : IDL.Null, 'user' : IDL.Null, 'guest' : IDL.Null });
  const PersonnelId = IDL.Text;
  const CompanyId = IDL.Text;
  const AuthenticatedUser = IDL.Record({ 'role' : IDL.Opt(IDL.Text), 'personnelId' : IDL.Opt(PersonnelId), 'companyId' : IDL.Opt(CompanyId) });
  const UserProfile = IDL.Record({ 'name' : IDL.Text, 'email' : IDL.Text, 'personnelId' : IDL.Opt(PersonnelId), 'companyId' : IDL.Opt(CompanyId) });
  const MachineId = IDL.Text;
  const Timestamp = IDL.Int;
  const Machine = IDL.Record({ 'id' : MachineId, 'status' : IDL.Text, 'name' : IDL.Text, 'createdAt' : Timestamp, 'serialNumber' : IDL.Text, 'notes' : IDL.Text, 'location' : IDL.Text, 'machineType' : IDL.Text, 'companyId' : CompanyId });
  const ProjectId = IDL.Text;
  const Project = IDL.Record({ 'id' : ProjectId, 'status' : IDL.Text, 'name' : IDL.Text, 'createdAt' : Timestamp, 'description' : IDL.Text, 'deadline' : IDL.Text, 'companyId' : CompanyId });
  const TaskId = IDL.Nat;
  const AssigneeId = IDL.Text;
  const DeadLine = IDL.Text;
  const Task = IDL.Record({ 'id' : TaskId, 'status' : IDL.Text, 'title' : IDL.Text, 'assigneeId' : AssigneeId, 'dueDate' : DeadLine, 'projectId' : ProjectId, 'companyId' : CompanyId });
  const Failure = IDL.Record({ 'id' : IDL.Text, 'machineId' : IDL.Text, 'companyId' : CompanyId, 'title' : IDL.Text, 'description' : IDL.Text, 'severity' : IDL.Text, 'status' : IDL.Text, 'reportedBy' : IDL.Text, 'reportedAt' : Timestamp, 'resolvedAt' : IDL.Text });
  const FailureWithProject = IDL.Record({ 'id' : IDL.Text, 'machineId' : IDL.Text, 'companyId' : CompanyId, 'title' : IDL.Text, 'description' : IDL.Text, 'severity' : IDL.Text, 'status' : IDL.Text, 'reportedBy' : IDL.Text, 'reportedAt' : Timestamp, 'resolvedAt' : IDL.Text, 'projectId' : IDL.Text });
  const Document = IDL.Record({ 'id' : IDL.Text, 'companyId' : CompanyId, 'title' : IDL.Text, 'fileName' : IDL.Text, 'category' : IDL.Text, 'uploadedBy' : IDL.Text, 'createdAt' : Timestamp });
  const HseRecord = IDL.Record({ 'id' : IDL.Text, 'companyId' : CompanyId, 'hseType' : IDL.Text, 'title' : IDL.Text, 'description' : IDL.Text, 'severity' : IDL.Text, 'status' : IDL.Text, 'reportedBy' : IDL.Text, 'createdAt' : Timestamp });
  const Shipment = IDL.Record({ 'id' : IDL.Text, 'companyId' : CompanyId, 'title' : IDL.Text, 'machineId' : IDL.Text, 'fromLocation' : IDL.Text, 'toLocation' : IDL.Text, 'carrier' : IDL.Text, 'status' : IDL.Text, 'shipDate' : IDL.Text, 'estimatedDelivery' : IDL.Text, 'notes' : IDL.Text, 'createdAt' : Timestamp });

  return IDL.Service({
    '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
    'addMachine' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
    'addPersonnelToCompany' : IDL.Func([Code, Code, IDL.Text], [], []),
    'addTask' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'authenticate' : IDL.Func([Code], [IDL.Opt(AuthenticatedUser)], ['query']),
    'createProject' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getUserProfile' : IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'listMachines' : IDL.Func([IDL.Text], [IDL.Vec(Machine)], ['query']),
    'listProjects' : IDL.Func([IDL.Text], [IDL.Vec(Project)], ['query']),
  'updateProjectStatus' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'listTasks' : IDL.Func([IDL.Text], [IDL.Vec(Task)], ['query']),
    'registerCompany' : IDL.Func([IDL.Text, IDL.Text], [IDL.Record({ 'id' : CompanyId, 'adminCode' : Code })], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'selfRegisterPersonnel' : IDL.Func([IDL.Text, IDL.Text], [IDL.Record({ 'loginCode' : Code, 'inviteCode' : Code })], []),
    'updateMachineStatus' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'addFailure' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
    'listFailures' : IDL.Func([IDL.Text], [IDL.Vec(FailureWithProject)], ['query']),
    'updateFailureStatus' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'addDocument' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
    'listDocuments' : IDL.Func([IDL.Text], [IDL.Vec(Document)], ['query']),
    'deleteDocument' : IDL.Func([IDL.Text], [], []),
    'addHseRecord' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
    'listHseRecords' : IDL.Func([IDL.Text], [IDL.Vec(HseRecord)], ['query']),
    'updateHseStatus' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'addShipment' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
    'listShipments' : IDL.Func([IDL.Text], [IDL.Vec(Shipment)], ['query']),
    'updateShipmentStatus' : IDL.Func([IDL.Text, IDL.Text], [], []),
  });
};

export const init = ({ IDL }) => { return []; };
